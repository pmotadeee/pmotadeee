import type { Orchestrator, SqlitePersistence, SseBroadcaster } from "@warpcore/bridge/server";
import type { EventNode } from "@warpcore/realmcore";
import {
	EToolApprovalMode,
	EChatRole,
	EMessagePartType,
	type IChatMessage,
} from "@warpcore/bridge";
import type { IToolAttachment, INotification } from "@warpcore/shared";
import {
	EReasoningEffort,
	EServerStatus,
	EThreadHierarchyType,
	genThreadId,
	genMessageId,
	genPartId,
} from "@warpcore/shared";
import type { IServer } from "@warpcore/shared";
import { SUBAGENT_SYSTEM_PROMPT } from "../applets/BEApplet/prompts";
import { getMode } from "./modeStore";
import { clearIfSame, registerAbort } from "./abortRegistry";
import { store } from "../util/store";

export const INJECTED_TOOLS: IToolAttachment[] = [
	{ serverName: "warpmcp", toolName: "superthread_send_message" },
	{ serverName: "warpmcp", toolName: "set_current_status" },
];

export function mergeWithInjectedTools(savedTools: IToolAttachment[]): IToolAttachment[] {
	return [
		...savedTools.filter(
			(t) =>
				!INJECTED_TOOLS.some(
					(inj) => inj.serverName === t.serverName && inj.toolName === t.toolName,
				),
		),
		...INJECTED_TOOLS,
	];
}

export interface ISubThreadInfo {
	threadId: string;
	title: string;
	pendingMessages: number;
}

export interface ISubthreadResponse {
	threadId: string;
	response?: string;
	backgrounded?: boolean;
	timedOut?: boolean;
}

const SUBTHREAD_WAIT_TIMEOUT = 30000; // 30s — auto-background long-running subthread calls

export class SubthreadService {
	private persistence: SqlitePersistence;
	private orchestrator: Orchestrator;
	private broadcaster: SseBroadcaster;
	private eventNode: EventNode;
	private pendingWaits: Map<
		string,
		{
			resolve: (result: ISubthreadResponse) => void;
			timer: NodeJS.Timeout;
			requesterThreadId: string;
		}
	> = new Map();
	// O(1) index: requester (superthread) -> subthread currently waiting for its response
	private requesterIndex: Map<string, string> = new Map();

	constructor(
		persistence: SqlitePersistence,
		orchestrator: Orchestrator,
		broadcaster: SseBroadcaster,
		eventNode: EventNode,
	) {
		this.persistence = persistence;
		this.orchestrator = orchestrator;
		this.broadcaster = broadcaster;
		this.eventNode = eventNode;
		this.setupResponseListeners();
	}

	private setupResponseListeners(): void {
		this.eventNode.on("/warpcore", "subthread.response", (api) => {
			const { threadId, message } = api.payload as { threadId: string; message: string };
			this.resolveWait(threadId, { threadId, response: message });
		});
	}

	// Resolve a pending wait for the given subthread and clean up both maps.
	private resolveWait(subthreadId: string, result: ISubthreadResponse): void {
		const pending = this.pendingWaits.get(subthreadId);
		if (!pending) return;
		clearTimeout(pending.timer);
		pending.resolve(result);
		this.pendingWaits.delete(subthreadId);
		this.requesterIndex.delete(pending.requesterThreadId);
	}

	private waitForSubthreadResponse(
		subthreadId: string,
		requesterThreadId: string,
		timeoutMs: number,
	): Promise<ISubthreadResponse> {
		return new Promise<ISubthreadResponse>((resolve) => {
			const timer = setTimeout(() => {
				this.resolveWait(subthreadId, { threadId: subthreadId, timedOut: true });
			}, timeoutMs);
			this.pendingWaits.set(subthreadId, { resolve, timer, requesterThreadId });
			this.requesterIndex.set(requesterThreadId, subthreadId);
		});
	}

	// Background a waiting tool call by the requester (superthread) ID. The FE
	// knows the requester ID (current thread) but not the subthread ID, so we
	// look it up via the requester index.
	backgroundSubthread(requesterThreadId: string): void {
		const subthreadId = this.requesterIndex.get(requesterThreadId);
		if (!subthreadId) return;
		this.resolveWait(subthreadId, { threadId: subthreadId, backgrounded: true });
	}

	async listSubthreads(parentThreadId: string): Promise<ISubThreadInfo[]> {
		const subThreads = await this.persistence.listThreads({ parentId: parentThreadId });
		const notifications = await this.persistence.notificationList(
			parentThreadId,
			false, // exclude consumed
			false, // exclude hidden
		);

		// Count pending notifications per subthread
		const pendingCountMap = new Map<string, number>();
		for (const n of notifications) {
			if (n.senderType === "thread") {
				pendingCountMap.set(n.senderId, (pendingCountMap.get(n.senderId) ?? 0) + 1);
			}
		}

		return subThreads.map((t) => ({
			threadId: t.id,
			title: t.title,
			pendingMessages: pendingCountMap.get(t.id) ?? 0,
		}));
	}

	async createSubthread(
		parentThreadId: string,
		agentName: string,
		message: string,
		title: string,
		background = false,
	): Promise<ISubthreadResponse> {
		// 1. Look up parent thread to get folderId
		const parentThread = await this.persistence.getThread(parentThreadId);
		if (!parentThread) {
			throw new Error(`Parent thread ${parentThreadId} not found`);
		}

		// 2. Look up agent by name
		const agent = await this.persistence.getAgentByName(agentName);
		if (!agent) {
			throw new Error(`Agent "${agentName}" not found`);
		}

		// 2.2. Check if the agent's server is running
		const server = await store.get<IServer>("servers:" + agent.serverId);
		if (!server) {
			throw new Error(`Server ${agent.serverId} not found`);
		}
		if (server.status !== EServerStatus.RUNNING) {
			throw new Error(
				`Server '${server.serverName}' is not running (status: ${server.status})`,
			);
		}

		// 2.5. Check if the current mode or thread-level agent restrictions allow this agent
		const threadState = await this.persistence.getThreadState(parentThreadId);
		const modeId = threadState?.modeId as string | undefined;
		if (modeId) {
			const mode = await getMode(modeId);
			if (mode) {
				if (!mode.allowedAgents.includes(agent.id)) {
					throw new Error(`Agent '${agentName}' is blocked by mode restrictions.`);
				}
			}
		} else {
			const activeAgents = threadState?.activeAgents as string[] | undefined;
			if (activeAgents && activeAgents.length > 0) {
				if (!activeAgents.includes(agent.id)) {
					throw new Error(`Agent '${agentName}' is blocked by thread restrictions.`);
				}
			}
		}

		// 3. Resolve agent's prompt for systemPrompt (prepend sub-agent prompt)
		let systemPrompt = SUBAGENT_SYSTEM_PROMPT;
		if (agent.promptId) {
			const prompt = await this.persistence.getChatPrompt(agent.promptId);
			if (prompt) {
				systemPrompt += "\n\n" + prompt.content;
			}
		}

		// 4. Generate new thread ID
		const newThreadId = genThreadId();
		const now = Date.now();

		// 5. Create thread
		await this.persistence.createThread({
			id: newThreadId,
			title,
			folderId: parentThread.folderId,
			parentId: parentThreadId,
			systemPrompt,
			meta: JSON.stringify({
				serverId: agent.serverId,
				whisperServerId: null,
				tags: [],
				enableAutoEmbed: false,
			}),
			totalPromptTokens: 0,
			totalCompletionTokens: 0,
			createdAt: now,
			updatedAt: now,
		});

		// 5.5. Save original agent info + guardrails in thread state
		await this.persistence.updateThreadState(newThreadId, {
			originalAgent: { id: agent.id, name: agent.name },
			activeGuardrails: agent.guardrails ?? [],
		});

		// 6. Save agent's tools (always include injected tools)
		const allTools = [
			...agent.tools.filter(
				(t) =>
					!INJECTED_TOOLS.some(
						(inj) => inj.serverName === t.serverName && inj.toolName === t.toolName,
					),
			),
			...INJECTED_TOOLS,
		];
		await this.persistence.saveThreadAttachedTools(newThreadId, false, allTools);

		// 7. Set auto-approve permissions
		for (const tool of agent.autoApproveTools) {
			await this.persistence.setThreadToolPermission(
				newThreadId,
				tool.serverName,
				tool.toolName,
				true,
				EToolApprovalMode.ALLOWED,
			);
		}
		// Always auto-approve injected tools
		for (const tool of INJECTED_TOOLS) {
			const hasAutoApprove = agent.autoApproveTools.some(
				(t) => t.serverName === tool.serverName && t.toolName === tool.toolName,
			);
			if (!hasAutoApprove) {
				await this.persistence.setThreadToolPermission(
					newThreadId,
					tool.serverName,
					tool.toolName,
					true,
					EToolApprovalMode.ALLOWED,
				);
			}
		}

		// 8. Emit thread.created event
		const thread = await this.persistence.getThread(newThreadId);
		if (thread) {
			this.broadcaster.emit({ type: "thread.created", thread });
		}

		// 8.5. Set thread config with agent's reasoning level
		if (agent.reasoningEffort) {
			await this.persistence.setThreadConfig({
				threadId: newThreadId,
				presetId: null,
				systemPrompt,
				params: JSON.stringify({
					reasoningEffort: agent.reasoningEffort,
					enableThinking: agent.reasoningEffort !== EReasoningEffort.NONE,
				}),
			});
		}

		// 9. Trigger inference via handleCompletionV2
		const inferenceUrl = `http://127.0.0.1:${server.port}`;
		const abortController = new AbortController();
		registerAbort(newThreadId, abortController);

		this.orchestrator
			.handleCompletionV2(
				inferenceUrl,
				{
					threadId: newThreadId,
					serverId: agent.serverId,
					userMessage: { content: message },
					attachedTools: allTools,
					skipToolsSave: true,
					messageState: {
						sender: {
							threadId: parentThreadId,
							type: EThreadHierarchyType.SUPERTHREAD,
						},
					},
					inferenceParams: agent.reasoningEffort
						? {
								reasoningEffort: agent.reasoningEffort,
								enableThinking: agent.reasoningEffort !== EReasoningEffort.NONE,
							}
						: {},
					folderId: parentThread.folderId,
				},
				abortController.signal,
			)
			.catch((err) => {
				console.error(`[Subthread] Inference failed for thread ${newThreadId}:`, err);
			})
			.finally(() => {
				clearIfSame(newThreadId, abortController);
			});

		// Background mode: return immediately with the thread ID; the response
		// will arrive later as a notification. Otherwise wait for the response.
		return this.finishSend(newThreadId, parentThreadId, background);
	}

	async sendToSubthread(
		parentThreadId: string,
		targetSubThreadId: string,
		message: string,
		background = false,
	): Promise<ISubthreadResponse> {
		// 1. Look up target thread to get serverId
		const targetThread = await this.persistence.getThread(targetSubThreadId);
		if (!targetThread) {
			throw new Error(`Target thread ${targetSubThreadId} not found`);
		}

		// 2. Get serverId from thread meta
		const meta = JSON.parse(targetThread.meta) as { serverId: string | null };
		if (!meta.serverId) {
			throw new Error(`Thread ${targetSubThreadId} has no serverId`);
		}

		// 3. Check if server is running
		const server = await store.get<IServer>("servers:" + meta.serverId);
		if (!server || server.status !== EServerStatus.RUNNING) {
			await this.queueNotification(parentThreadId, targetSubThreadId, message);
			return this.finishSend(targetSubThreadId, parentThreadId, background);
		}

		// 4. Check if thread is currently running inference
		if (this.orchestrator.isThreadRunningInference(targetSubThreadId)) {
			await this.queueNotification(parentThreadId, targetSubThreadId, message);
			return this.finishSend(targetSubThreadId, parentThreadId, background);
		}

		// 4.5. Fetch and flush pending parent notifications
		const pendingNotifications = await this.persistence.notificationList(
			targetSubThreadId,
			false, // exclude consumed
			false, // exclude hidden
		);
		const parentMessages = pendingNotifications.filter(
			(n) => n.senderType === "thread" && n.senderId === parentThreadId,
		);
		const combinedMessage =
			parentMessages.length > 0
				? message +
					"\n\n--- queued message boundary ---\n\n" +
					parentMessages
						.map(
							(n) =>
								`[${new Date(n.createdAt).toLocaleTimeString()}] ${(n.payload as { message?: string }).message}`,
						)
						.filter(Boolean)
						.join("\n\n--- queued message boundary ---\n\n")
				: message;

		// 5. Send directly via handleCompletionV2
		const inferenceUrl = `http://127.0.0.1:${server.port}`;
		const abortController = new AbortController();
		registerAbort(targetSubThreadId, abortController);

		const savedTools = await this.persistence.getThreadAttachedTools(targetSubThreadId);
		const attachedTools = mergeWithInjectedTools(savedTools?.tools ?? []);

		const headMessage = await this.persistence.getHeadMessage(targetSubThreadId);

		this.orchestrator
			.handleCompletionV2(
				inferenceUrl,
				{
					threadId: targetSubThreadId,
					serverId: meta.serverId,
					parentId: headMessage?.id ?? null,
					userMessage: { content: combinedMessage },
					attachedTools,
					skipToolsSave: true,
					messageState: {
						sender: {
							threadId: parentThreadId,
							type: EThreadHierarchyType.SUPERTHREAD,
						},
					},
					folderId: targetThread.folderId ?? undefined,
					inferenceParams: {},
				},
				abortController.signal,
			)
			.catch((err) => {
				console.error(`[Subthread] Inference failed for thread ${targetSubThreadId}:`, err);
			})
			.finally(() => {
				clearIfSame(targetSubThreadId, abortController);
			});

		// Consume the flushed notifications
		for (const n of parentMessages) {
			await this.persistence.notificationConsume(n.id);
		}

		// Wait for the subthread to respond via superthread_send_message (or be backgrounded/timed out)
		return this.finishSend(targetSubThreadId, parentThreadId, background);
	}

	// Shared tail for sendToSubthread: background mode returns immediately,
	// otherwise wait for the subthread's response.
	private finishSend(
		targetSubThreadId: string,
		parentThreadId: string,
		background: boolean,
	): Promise<ISubthreadResponse> {
		if (background) {
			return Promise.resolve({ threadId: targetSubThreadId, backgrounded: true });
		}
		return this.waitForSubthreadResponse(
			targetSubThreadId,
			parentThreadId,
			SUBTHREAD_WAIT_TIMEOUT,
		);
	}

	private async queueNotification(
		parentThreadId: string,
		targetSubThreadId: string,
		message: string,
	): Promise<{ notificationId: string; threadId: string }> {
		const notification = await this.persistence.notificationCreate({
			threadId: targetSubThreadId,
			notificationType: "agent",
			notificationSubtype: "message",
			senderType: "thread",
			senderId: parentThreadId,
			payload: { message },
		});
		this.broadcaster.emit({ type: "notification.created", notification });
		return { notificationId: notification.id, threadId: targetSubThreadId };
	}

	async sendToSuperthread(
		currentThreadId: string,
		message: string,
	): Promise<{ notificationId: string; threadId: string }> {
		const thread = await this.persistence.getThread(currentThreadId);
		if (!thread || !thread.parentId) {
			throw new Error(`Thread ${currentThreadId} has no parent`);
		}
		// Attach the sending subthread's agent info so the superthread can
		// label the message sender without loading the subthread's state later.
		const state = await this.persistence.getThreadState(currentThreadId);
		const agent = (state as Record<string, unknown> | null)?.originalAgent ?? null;
		const notification = await this.persistence.notificationCreate({
			threadId: thread.parentId,
			notificationType: "agent",
			notificationSubtype: "message",
			senderType: "thread",
			senderId: currentThreadId,
			payload: { message, agent, title: thread.title },
		});
		this.broadcaster.emit({ type: "notification.created", notification });

		// Signal any waiting tool (create_subthread / subthread_send_message) with the response
		this.eventNode.broadcast("subthread.response", { threadId: currentThreadId, message });

		return { notificationId: notification.id, threadId: thread.parentId };
	}

	// Consume notifications (messages sent up from subthreads) for a superthread.
	// Groups them by sender (subthread), combines each group into a single USER
	// message tagged with the sender's hierarchy + agent, chains them via
	// parentId, marks them consumed, then triggers inference on the last message.
	async consumeSubthreadMessages(
		threadId: string,
		ids: string[],
		headMessageId: string | null,
	): Promise<{
		ok: boolean;
		data?: { createdMessageIds: string[]; consumedNotificationIds: string[] };
		error?: string;
	}> {
		// 1. Guard — do not consume while an inference is running on this thread.
		if (this.orchestrator.isThreadRunningInference(threadId)) {
			return { ok: false, error: "wait for the inference to finish" };
		}

		const thread = await this.persistence.getThread(threadId);
		if (!thread) {
			return { ok: false, error: "Thread not found" };
		}

		// 2. Fetch + validate + filter to subthread-originated messages.
		const groups = new Map<string, INotification[]>();
		for (const id of ids) {
			const n = await this.persistence.notificationGet(id);
			if (!n) continue;
			if (n.threadId !== threadId) continue;
			if (n.consumed) continue;
			if (n.senderType !== "thread") continue;
			if (n.senderId === threadId) continue;
			// Hierarchy check: the sender must be a subthread of this thread.
			const senderThread = await this.persistence.getThread(n.senderId);
			if (!senderThread || senderThread.parentId !== threadId) continue;
			const arr = groups.get(n.senderId) ?? [];
			arr.push(n);
			groups.set(n.senderId, arr);
		}

		if (groups.size === 0) {
			return { ok: true, data: { createdMessageIds: [], consumedNotificationIds: [] } };
		}

		// 3. Process each group in order, chaining messages via parentId.
		let currentParent = headMessageId;
		const createdMessageIds: string[] = [];
		const consumedNotificationIds: string[] = [];

		for (const [subthreadId, notifications] of groups) {
			// Preserve chronological order within the group.
			notifications.sort((a, b) => a.createdAt - b.createdAt);

			// Combine the group's messages, each prefixed with a timestamp.
			const combined = notifications
				.map(
					(n) =>
						`[${new Date(n.createdAt).toLocaleTimeString()}] ${(n.payload as { message?: string }).message}`,
				)
				.filter(Boolean)
				.join("\n\n---\n\n");

			const firstPayload = notifications[0]?.payload as
				| { agent?: { id: string; name: string } | null; title?: string }
				| undefined;
			const agent = firstPayload?.agent ?? null;
			const title = firstPayload?.title;

			const msgId = genMessageId();
			const msg: IChatMessage = {
				id: msgId,
				parentId: currentParent,
				threadId,
				role: EChatRole.USER,
				content: [
					{
						id: genPartId(),
						type: EMessagePartType.TEXT,
						orderIndex: 0,
						text: combined,
					},
				],
				stats: null,
				createdAt: Date.now(),
			};
			await this.persistence.createMessage(msg);
			await this.persistence.updateMessageState(msgId, {
				sender: {
					threadId: subthreadId,
					type: EThreadHierarchyType.SUBTHREAD,
					agent,
					title,
				},
			});
			this.broadcaster.emit({ type: "message.created", message: msg });

			createdMessageIds.push(msgId);
			currentParent = msgId;

			// Mark the group's notifications consumed.
			for (const n of notifications) {
				const updated = await this.persistence.notificationConsume(n.id);
				this.broadcaster.emit({ type: "notification.updated", notification: updated });
				consumedNotificationIds.push(n.id);
			}
		}

		// 4. Trigger inference on the last created message (no new user message).
		const lastMessageId = currentParent;
		if (lastMessageId) {
			const meta = JSON.parse(thread.meta || "{}") as { serverId: string | null };
			if (meta.serverId) {
				const server = await store.get<IServer>("servers:" + meta.serverId);
				if (server) {
					const inferenceUrl = `http://127.0.0.1:${server.port}`;
					const config = await this.persistence.getThreadConfig(threadId);
					const abortController = new AbortController();
					registerAbort(threadId, abortController);
					this.orchestrator
						.handleCompletionV2(
							inferenceUrl,
							{
								threadId,
								serverId: meta.serverId,
								parentId: lastMessageId,
								inferenceParams: (config?.params ?? {}) as Record<string, unknown>,
								skipToolsSave: true,
							},
							abortController.signal,
						)
						.catch((err) => {
							console.error(
								`[Subthread] Consume inference failed for thread ${threadId}:`,
								err,
							);
						})
						.finally(() => {
							clearIfSame(threadId, abortController);
						});
				}
			}
		}

		return { ok: true, data: { createdMessageIds, consumedNotificationIds } };
	}
}
