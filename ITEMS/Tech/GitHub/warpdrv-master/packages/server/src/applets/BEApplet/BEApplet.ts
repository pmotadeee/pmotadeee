import {
	EChatRole,
	EMessagePartType,
	type IChatMessage,
	type IMessagePart,
	type TOpenAIMessage,
} from "@warpcore/bridge";
import type { IAppletFn, TAppletDefinition } from "@warpcore/realmcore";
import { EAppletHostType, EAppletScope } from "@warpcore/realmcore";
import type {
	IGuardrailDefinition,
	IGuardrailError,
	IGuardrailIssue,
	IMode,
	IServer,
	IThreadSenderInfo,
} from "@warpcore/shared";
import {
	parseMessyLLMArray,
	EThreadHierarchyType,
	EServerStatus,
	genPartId,
} from "@warpcore/shared";
import { getMode, listModes } from "../../services/modeStore";
import { mergeWithInjectedTools } from "../../services/subthreadService";
import { store } from "../../util/store";
import type { IAppletAPIBE } from "../lib/types";
import {
	COMPACTION_PROMPT,
	GUARDRAIL_PROMPT,
	GUARDRAIL_RULESET_GENERIC_PROMPT,
	MODE_SYSTEM_PROMPT,
} from "./prompts";

const GUARDRAILS_DEFAULT_INFERENCE_PARAMS = {
	enableThinking: false,
	reasoningEffort: "none",
};

const USE_MODE_DEF_TAIL = false;
const USE_MODE_CURRENT_TAIL = false;

function injectSystemPrompt(
	messages: TOpenAIMessage[],
	text: string,
	position: "prepend" | "append" = "prepend",
): void {
	const firstMsg = messages[0];
	if (firstMsg?.role === "system") {
		if (typeof firstMsg.content === "string") {
			messages[0] = {
				...firstMsg,
				content:
					position === "prepend"
						? text + "\n" + firstMsg.content
						: firstMsg.content + text,
			};
		} else {
			const partIndex = firstMsg.content?.findIndex((p) => p.type === "text") || -1;
			if (partIndex >= 0) {
				const newContent = firstMsg.content!.map((p, i) =>
					i === partIndex
						? {
								...p,
								text:
									position === "prepend"
										? text + "\n" + (p.text ?? "")
										: (p.text ?? "") + text,
							}
						: p,
				);
				messages[0] = { ...firstMsg, content: newContent };
			} else {
				messages[0] = {
					...firstMsg,
					content:
						position === "prepend"
							? [{ type: "text", text }]
							: [...(firstMsg.content || []), { type: "text", text }],
				};
			}
		}
	} else {
		messages.unshift({ role: "system", content: text });
	}
}

const fn: IAppletFn<IAppletAPIBE> = async (api) => {
	console.log("[BEApplet] Started");

	api.onReady(() => {
		api.eventNode.hook("/warpcore", "bridge.buildBranchChain", async (eventApi) => {
			const payload = eventApi.payload as {
				branch: Array<{ id: string }>;
				request: { threadId: string };
			};

			const threadState = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.getThreadState",
				payload.request.threadId,
			)) as Record<string, unknown> | null;

			const messageStates = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.getAllMessageStatesByThread",
				payload.request.threadId,
			)) as Array<{ messageId: string; data: Record<string, unknown> }>;

			const stateById: Record<string, Record<string, unknown>> = {};
			for (const ms of messageStates) {
				stateById[ms.messageId] = ms.data;
			}

			const modeId = threadState?.modeId as string | undefined;
			let mode: IMode | null = null;
			if (modeId) mode = await getMode(modeId);

			let newResult = [...(eventApi.result as Array<IChatMessage>)];

			// ---- SENDER HEADER INJECTION ----
			// For USER messages with a sender in their state, prepend a text part
			// identifying the origin and how to respond.
			newResult = newResult.map((msg) => {
				if (msg.role !== EChatRole.USER) return msg;

				const sender = stateById[msg.id]?.sender as IThreadSenderInfo | undefined;
				if (!sender) return msg;

				let header: string | null = null;

				if (sender.type === EThreadHierarchyType.SUBTHREAD) {
					const agentName = sender.agent?.name ?? "Unknown";
					const title = sender.title ?? "Untitled";
					header = `[Message(s) from threadId: ${sender.threadId} (Title: ${title}, Agent: ${agentName})]`;
				} else if (sender.type === EThreadHierarchyType.SUPERTHREAD) {
					header = `[Message from parent thread. Use the superthread_send_message tool to respond when ready.]`;
				}

				if (!header) return msg;

				return {
					...msg,
					content: [
						{
							id: genPartId(),
							type: EMessagePartType.TEXT,
							orderIndex: -1,
							text: header,
						} as IMessagePart,
						...msg.content,
					],
				};
			});

			// ---- MODE INJECTION ----

			if (mode && !USE_MODE_DEF_TAIL && !USE_MODE_CURRENT_TAIL) {
				newResult = newResult.map((msg) => {
					if (msg.role !== EChatRole.USER) return msg;
					const msgMode =
						(stateById[msg.id]?.modeMarker as { id: string; name: string }) ||
						undefined;
					if (!msgMode) return msg;

					const newMsg = {
						...msg,
						content: [
							...msg.content,
							{
								type: EMessagePartType.TEXT,
								text: `<system-reminder>ACTIVE MODE: ${msgMode.name}</system-reminder>`,
							} as IMessagePart,
						],
					};

					return newMsg;
				});
			}

			// ---- compaction base slice ----

			if (threadState?.ignoreCompactionBase === true) return newResult;

			let compactionBaseIndex = -1;
			const branch = eventApi.result as Array<IChatMessage>;
			for (let i = branch.length - 1; i >= 0; i--) {
				const msgState = stateById[branch[i]!.id];
				const commands = msgState?.slashCommands as Array<{ name: string }> | undefined;
				if (commands?.some((c) => c.name === "compact")) {
					compactionBaseIndex = i;
					break;
				}
			}

			if (compactionBaseIndex === -1) return newResult;
			newResult = newResult.slice(compactionBaseIndex);

			// ---- Done ----

			return newResult;
		});

		api.eventNode.hook("/warpcore", "bridge.preInference", async (eventApi) => {
			const payload = eventApi.payload as {
				request: {
					messageState?: Record<string, unknown>;
					threadId: string;
					attachAllTools?: boolean;
					attachedTools?: Array<{ serverName: string; toolName: string }>;
				};
			};

			// const commands = payload.request.messageState?.slashCommands as
			// 	| Array<{ name: string }>
			// 	| undefined;
			// if (commands?.some((c) => c.name === "compact")) return;

			const threadState = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.getThreadState",
				payload.request.threadId,
			)) as Record<string, unknown> | null;

			// Load workspace state for projectRoot fallback
			let wsState: Record<string, unknown> | null = null;
			const folderId = (payload.request as any).folderId as string | undefined;
			if (folderId) {
				wsState = (await api.eventNode.invoke(
					"/warpcore",
					"bridge.getWorkspaceState",
					folderId,
				)) as Record<string, unknown> | null;
			}

			const messages = [...(eventApi.result as Array<TOpenAIMessage>)];

			// --- Project Root ---

			const projectRoot = (threadState?.projectRoot || wsState?.projectRoot) as
				| string
				| undefined;

			// Inject project root into system prompt (independent of mode)
			if (projectRoot) {
				injectSystemPrompt(messages, `\nProject Root\n${projectRoot}\n`, "append");
			}

			// --- Mode section ---

			const modeId = threadState?.modeId as string | undefined;
			let mode: IMode | null = null;
			if (modeId) mode = await getMode(modeId);

			// Fetch all agents for resolution
			const allAgents = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.listAgents",
			)) as Array<{ id: string; name: string; description?: string }> | null;
			const agentMap = new Map<string, { name: string; description?: string }>();
			if (allAgents) {
				for (const agent of allAgents) {
					agentMap.set(agent.id, { name: agent.name, description: agent.description });
				}
			}

			if (mode) {
				const modesArr = await listModes();

				// Fetch all unique saved prompts referenced by modes
				const promptIds = [
					...new Set(
						modesArr.map((m) => m.promptId).filter((id): id is string => Boolean(id)),
					),
				];
				const promptMap = new Map<string, string>();
				if (promptIds.length > 0) {
					const fetchedPrompts = await Promise.all(
						promptIds.map(async (id) => {
							const p = (await api.eventNode.invoke(
								"/warpcore",
								"bridge.getChatPrompt",
								id,
							)) as { content: string } | null;
							return p ? [id, p.content] : [];
						}),
					);
					for (const entry of fetchedPrompts) {
						if (entry.length === 2) promptMap.set(entry[0], entry[1]);
					}
				}

				// Build combined allowed agent list (union of all modes)
				const allAllowedAgentIds = new Set<string>();
				for (const m of modesArr) {
					for (const aid of m.allowedAgents || []) {
						allAllowedAgentIds.add(aid);
					}
				}
				const combinedAgents = [...allAllowedAgentIds]
					.map((id) => agentMap.get(id))
					.filter((a): a is { name: string; description?: string } => Boolean(a))
					.sort((a, b) => a.name.localeCompare(b.name));

				// Build the combined agents injection text
				const agentsInjectionText =
					combinedAgents.length > 0
						? "This is the list of available agents. The allowed list varies per mode; you must follow the list of allowed agents for the active mode:\\n" +
							combinedAgents
								.map(
									(a) =>
										`- ${a.name}${a.description ? `: ${a.description}` : ""}`,
								)
								.join("\n")
						: "No agents are available in any mode.";

				// Inject combined agents list
				injectSystemPrompt(
					messages,
					`\nAVAILABLE AGENTS\n\n${agentsInjectionText}\n`,
					"append",
				);

				injectSystemPrompt(
					messages,
					`${MODE_SYSTEM_PROMPT}\n${modesArr
						.filter((mode) => mode.prompt?.length || mode.promptId)
						.sort((a, b) => a.name.localeCompare(b.name))
						.map((mode, i) => {
							let toolMessage = "";
							const toolNames =
								typeof mode.allowedTools[0] === "string"
									? mode.allowedTools
									: mode.allowedTools.map((t: any) => t.toolName);

							if (toolNames.length) toolMessage += [...toolNames].sort().join(", ");
							else toolMessage += "TOOLS ARE NOT ALLOWED IN THIS MODE!";

							// Build agents message — resolve IDs to names
							const agentIds = (mode.allowedAgents as string[]) || [];
							const agentNamesList = agentIds
								.map((id) => agentMap.get(id)?.name)
								.filter((n): n is string => Boolean(n));
							let agentMessage = "";
							if (agentNamesList.length)
								agentMessage += [...agentNamesList].sort().join(", ");
							else agentMessage += "AGENTS ARE NOT ALLOWED IN THIS MODE!";

							// Build prompt text: saved prompt first, then custom prompt
							const savedContent = mode.promptId
								? promptMap.get(mode.promptId) || ""
								: "";
							const promptText = savedContent + (mode.prompt || "");

							return `--- MODE ${mode.name} ---\n\n ${promptText}\n\nALLOWED TOOLS: ${toolMessage}\n\nALLOWED AGENTS: ${agentMessage}\n---`;
						})
						.join(`\n\n`)}\n`,
				);
			}

			// --- No-mode agent injection ---
			if (!mode) {
				const request = payload.request;
				const hasCreateSubthread =
					request.attachAllTools === true ||
					request.attachedTools?.some(
						(t) => t.serverName === "warpmcp" && t.toolName === "create_subthread",
					);
				const threadAgentIds = threadState?.activeAgents as string[] | undefined;
				if (hasCreateSubthread && threadAgentIds && threadAgentIds.length > 0) {
					const threadAgents = threadAgentIds
						.map((id) => agentMap.get(id))
						.filter((a): a is { name: string; description?: string } => Boolean(a))
						.sort((a, b) => a.name.localeCompare(b.name));
					if (threadAgents.length > 0) {
						const agentsText =
							"This is the list of available agents that can be used to create subthreads:\n" +
							threadAgents
								.map(
									(a) =>
										`- ${a.name}${a.description ? `: ${a.description}` : ""}`,
								)
								.join("\n");
						injectSystemPrompt(
							messages,
							`\nAVAILABLE AGENTS\n\n${agentsText}\n`,
							"append",
						);
					}
				}
			}

			return messages;
		});

		api.eventNode.hook("/warpcore", "bridge.preConvertNewMsg", async (eventApi) => {
			const payload = eventApi.payload as {
				request: { messageState?: Record<string, unknown>; threadId: string };
			};

			let userMsg = eventApi.result as IChatMessage;

			// ---- MODE INJECTION (same as buildBranchChain) ----

			const threadState = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.getThreadState",
				payload.request.threadId,
			)) as Record<string, unknown> | null;

			const modeId = threadState?.modeId as string | undefined;
			let mode: IMode | null = null;
			if (modeId) mode = await getMode(modeId);

			if (mode && !USE_MODE_DEF_TAIL && !USE_MODE_CURRENT_TAIL) {
				const modeMarker = payload.request.messageState?.modeMarker as
					| { id: string; name: string }
					| undefined;
				if (modeMarker) {
					userMsg = {
						...userMsg,
						content: [
							...userMsg.content,
							{
								type: EMessagePartType.TEXT,
								text: `<system-reminder>ACTIVE MODE: ${modeMarker.name}</system-reminder>`,
							} as IMessagePart,
						],
					};
				}
			}

			// ---- SENDER HEADER INJECTION (for the new message) ----
			const sender = payload.request.messageState?.sender as IThreadSenderInfo | undefined;
			if (sender) {
				let header: string | null = null;
				if (sender.type === EThreadHierarchyType.SUBTHREAD) {
					const agentName = sender.agent?.name ?? "Unknown";
					const title = sender.title ?? "Untitled";
					header = `[Message(s) from threadId: ${sender.threadId} (Title: ${title}, Agent: ${agentName})]`;
				} else if (sender.type === EThreadHierarchyType.SUPERTHREAD) {
					header = `[Message from parent thread. Use the superthread_send_message tool to respond when ready.]`;
				}
				if (header) {
					userMsg = {
						...userMsg,
						content: [
							{
								id: genPartId(),
								type: EMessagePartType.TEXT,
								orderIndex: -1,
								text: header,
							} as IMessagePart,
							...userMsg.content,
						],
					};
				}
			}

			// ---- COMPACT ----

			const commands = payload.request.messageState?.slashCommands as
				| Array<{ name: string }>
				| undefined;
			if (commands?.some((c) => c.name === "compact")) {
				for (const part of userMsg.content) {
					if (part.type === "text") {
						part.text = COMPACTION_PROMPT + part.text;
						break;
					}
				}
			}

			return userMsg;
		});

		api.eventNode.hook("/warpcore", "bridge.preTool", async (eventApi) => {
			const payload = eventApi.payload as {
				threadId: string;
				messageId: string;
				toolName: string;
			};

			const threadState = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.getThreadState",
				payload.threadId,
			)) as Record<string, unknown> | null;

			if (!threadState?.modeId) return false;

			const mode = await getMode(threadState.modeId as string);
			if (!mode) return false;

			const toolNames =
				mode.allowedTools.length > 0 && typeof mode.allowedTools[0] === "string"
					? mode.allowedTools
					: mode.allowedTools.map((t) => t.toolName);

			if (toolNames.length === 0 || !toolNames.includes(payload.toolName)) {
				await api.eventNode.invoke("/warpcore", "bridge.updateMessageState", {
					messageId: payload.messageId,
					data: {
						blockedToolName: payload.toolName,
					},
				});
				return true;
			}

			return false;
		});

		api.eventNode.on("/warpcore", "bridge.inference.finish", async (eventApi) => {
			const payload = eventApi.payload as {
				threadId: string;
				messageId: string;
				inferenceUrl: string;
				messages: Array<TOpenAIMessage>;
				message: IChatMessage;
			};
			const { threadId, messageId, inferenceUrl, messages, message } = payload;

			const threadState = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.getThreadState",
				threadId,
			)) as Record<string, unknown> | null;

			// Resolve active guardrail names: from mode if set, else from threadState
			const modeId = threadState?.modeId as string | undefined;
			let activeNames: string[] = [];
			if (modeId) {
				const mode = (await api.eventNode.invoke(
					"/warpcore",
					"bridge.getMode",
					modeId,
				)) as { activeGuardrails?: string[] } | null;
				activeNames = mode?.activeGuardrails || [];
			} else {
				activeNames = (threadState?.activeGuardrails as string[]) || [];
			}
			if (!activeNames.length) return;

			// Fetch all guardrail definitions from DB
			const allDefinitions = (await api.eventNode.invoke(
				"/warpcore",
				"bridge.listGuardrails",
			)) as Record<string, IGuardrailDefinition>;
			if (!allDefinitions) return;

			// Look up definitions for active names
			const activeGuardrails = activeNames
				.map((name) => allDefinitions[name])
				.filter((g): g is IGuardrailDefinition => !!g);
			if (!activeGuardrails.length) return;

			// Find current turn boundary
			const assistantIndex = messages.map((m) => m.role).lastIndexOf("assistant");
			const beforePart3 =
				assistantIndex !== -1 ? messages.slice(0, assistantIndex) : messages;

			// Tool names from the assistant message
			const lastAssistant = messages[assistantIndex];
			const toolNames =
				lastAssistant?.tool_calls?.map((tc) => tc.function.name.toLowerCase()) || [];

			// Collect tool call IDs from the current assistant message
			const currentToolCallIds = new Set(lastAssistant?.tool_calls?.map((tc) => tc.id) || []);

			// Filter guardrails by triggerOnTools
			const applicableGuardrails = activeGuardrails.filter((g) => {
				if (!g.triggerOnTools) return true;
				const tools = g.triggerOnTools.map((t: any) => t.toolName.toLowerCase());
				if (!tools.length) return true;
				return tools.some((t) => toolNames.includes(t));
			});
			if (!applicableGuardrails.length) return;

			// Immediately mark all as processing
			const initialResults: Record<string, boolean> = {};
			for (const g of applicableGuardrails) {
				initialResults[g.name] = false;
			}
			await api.eventNode.invoke("/warpcore", "bridge.updateMessageState", {
				messageId,
				data: { guardrailResults: initialResults },
			});

			// Process one by one, save each result
			for (const guardrail of applicableGuardrails) {
				let inferenceResult: any;
				try {
					if (!guardrail.serverId) {
						throw (
							'[BEApplet] Guardrail "' + guardrail.name + '" has no server configured'
						);
					}
					const grServer = await store.get<IServer>("servers:" + guardrail.serverId);
					if (!grServer)
						throw "[BEApplet] Guardrail server not found:" + guardrail.serverId;

					const grInferenceUrl = `http://127.0.0.1:${grServer.port}`;

					const toText = (m: TOpenAIMessage) => {
						if (m.role === "system") {
							if (m.content === "<base>") return `--- Conversation Root ---`;
							else if (m.content === "<latest>") return `--- Recent Messages ---`;
							else if (m.content === "<review>") return `--- Message to Review ---`;
						}

						const content =
							typeof m.content === "string"
								? m.content
								: Array.isArray(m.content)
									? m.content.find((c: any) => c.type === "text")?.text || ""
									: "";
						let result = `[${m.role}]: ${content}`;
						if (m.tool_calls?.length) {
							result += "\ntool_calls=" + JSON.stringify(m.tool_calls);
						}
						return result;
					};

					const part1: Array<TOpenAIMessage> = [];
					const part2: Array<TOpenAIMessage> = [];
					const part3: Array<TOpenAIMessage> = [];

					// Part 3 - always included, just the assistant message
					part3.push({ role: "system", content: "<review>" });
					part3.push(messages[assistantIndex]!);

					// Part 1 - base from beforePart3
					if (guardrail.includeBaseMessage) {
						if (beforePart3.length >= 1) {
							part1.push({ role: "system", content: "<base>" });
							part1.push(beforePart3[0]!);
						}
						if (beforePart3.length >= 2) part1.push(beforePart3[1]!);
					}

					// Part 2 - last N from beforePart3
					if (guardrail.messagesCount && guardrail.messagesCount > 0) {
						part2.push({ role: "system", content: "<latest>" });
						part2.push(...beforePart3.slice(-guardrail.messagesCount));
					}

					// Merge with dedup (part 1/2 can overlap)
					const all = [...part1, ...part2, ...part3];
					const seen = new Set<TOpenAIMessage>();
					const context = all.filter((m) => {
						if (seen.has(m)) return false;
						seen.add(m);
						return true;
					});
					const contextTexts = context.map(toText);

					// Fetch saved prompt if promptId is set
					let savedPromptContent = "";
					if (guardrail.promptId) {
						const savedPrompt = (await api.eventNode.invoke(
							"/warpcore",
							"bridge.getChatPrompt",
							guardrail.promptId,
						)) as { content: string } | null;
						if (savedPrompt) savedPromptContent = savedPrompt.content + "\n";
					}

					const grSysPrompt =
						GUARDRAIL_PROMPT +
						"\n" +
						savedPromptContent +
						(guardrail.prompt || GUARDRAIL_RULESET_GENERIC_PROMPT) +
						"Conversation/Message is below as given by the user.";
					const prompt = contextTexts.join("\n");

					inferenceResult = await api.eventNode.invoke(
						"/warpcore",
						"bridge.handlePureCompletion",
						{
							inferenceRequestId: guardrail.name + "-" + messageId,
							inferenceUrl: grInferenceUrl,

							messages: [
								{
									role: "system",
									content: grSysPrompt,
								},
								{
									role: "user",
									content: prompt,
								},
							],

							inferenceParams: {
								...GUARDRAILS_DEFAULT_INFERENCE_PARAMS,
								...guardrail.inferenceParams,
							},
						},
					);

					const text =
						inferenceResult.content?.filter((c: any) => c.type === "text")?.[0]?.text ||
						"Error";
					const parsed = parseMessyLLMArray(text) as IGuardrailIssue[];
					if (!parsed) {
						throw new Error("Failed to parse guardrail JSON output");
					}

					// Read existing results, merge, save
					const existing = (await api.eventNode.invoke(
						"/warpcore",
						"bridge.getMessageState",
						messageId,
					)) as Record<string, unknown>;
					const currentResults =
						(existing?.guardrailResults as Record<string, any>) || {};
					const currentErrors =
						(existing?.guardrailErrors as Record<string, IGuardrailError>) || {};

					// Strip toolCallId from issues that don't belong to this message's tool calls
					const filteredIssues = parsed.map((item: IGuardrailIssue) => {
						if (
							item.toolCallId !== undefined &&
							!currentToolCallIds.has(item.toolCallId)
						) {
							return { ...item, toolCallId: undefined as undefined };
						}
						return item;
					});

					await api.eventNode.invoke("/warpcore", "bridge.updateMessageState", {
						messageId,
						data: {
							guardrailResults: {
								...currentResults,
								[guardrail.name]: filteredIssues,
							},
							guardrailErrors: { ...currentErrors },
						},
					});
				} catch (err) {
					console.error("[BEApplet] Guardrail error:", guardrail.name, err);
					const errorMessage = err instanceof Error ? err.message : String(err);
					const rawResponse = inferenceResult?.content?.filter(
						(c: any) => c.type === "text",
					)?.[0]?.text;
					const existing = (await api.eventNode.invoke(
						"/warpcore",
						"bridge.getMessageState",
						messageId,
					)) as Record<string, unknown>;
					const currentResults =
						(existing?.guardrailResults as Record<string, any>) || {};
					const currentErrors =
						(existing?.guardrailErrors as Record<string, IGuardrailError>) || {};

					await api.eventNode.invoke("/warpcore", "bridge.updateMessageState", {
						messageId,
						data: {
							guardrailResults: { ...currentResults, [guardrail.name]: [] },
							guardrailErrors: {
								...currentErrors,
								[guardrail.name]: { message: errorMessage, rawResponse },
							},
						},
					});
				}
			}
		});

		api.eventNode.on("/warpcore", "bridge.threadInference.ended", async (eventApi) => {
			const payload = eventApi.payload as {
				threadId: string;
				cause: string;
			};
			const { threadId, cause } = payload;

			// Only auto-process if inference ended normally (not user abort, error, or pending approval)
			if (cause !== "completed") return;

			const thread = await api.eventNode.invoke("/warpcore", "bridge.getThread", threadId);
			if (!thread || !thread.parentId) return;

			// Pre-send checks (before consuming notifications)
			const meta = JSON.parse(thread.meta) as { serverId: string | null };
			if (!meta?.serverId) return;

			const server = await store.get<IServer>("servers:" + meta.serverId);
			if (!server || server.status !== EServerStatus.RUNNING) return;

			const isRunning = await api.eventNode.invoke(
				"/warpcore",
				"bridge.isThreadRunningInference",
				threadId,
			);
			if (isRunning) return;

			// Fetch pending notifications, filter to parent thread only
			const notifications = await api.eventNode.invoke(
				"/warpcore",
				"bridge.listNotifications",
				{ threadId },
			);
			const parentMessages = notifications.filter(
				(n) => n.senderType === "thread" && n.senderId === thread.parentId,
			);
			if (parentMessages.length === 0) return;

			const combinedMessage = parentMessages
				.map(
					(n) =>
						`[${new Date(n.createdAt).toLocaleTimeString()}] ${(n.payload as { message?: string }).message}`,
				)
				.filter(Boolean)
				.join("\n\n--- queued message boundary ---\n\n");

			if (!combinedMessage) return;

			// Load saved tools + inject subthread tools
			const savedTools = await api.eventNode.invoke(
				"/warpcore",
				"bridge.getThreadAttachedTools",
				threadId,
			);
			const attachedTools = mergeWithInjectedTools(savedTools?.tools ?? []);

			const inferenceUrl = `http://127.0.0.1:${server.port}`;
			const abortController = new AbortController();

			await api.eventNode.invoke("/warpcore", "bridge.handleCompletion", {
				inferenceUrl: `http://127.0.0.1:${server.port}`,
				request: {
					threadId,
					serverId: meta.serverId,
					userMessage: { content: combinedMessage },
					attachedTools,
					skipToolsSave: true,
					messageState: {
						sender: {
							threadId: thread.parentId,
							type: EThreadHierarchyType.SUPERTHREAD,
						},
					},
					folderId: thread.folderId ?? undefined,
					inferenceParams: {},
				},
			});

			for (const n of parentMessages) {
				await api.eventNode.invoke("/warpcore", "bridge.consumeNotification", n.id);
			}
		});
	});
};

export const BEApplet: TAppletDefinition<IAppletAPIBE> = {
	name: "BEApplet",
	description: "Backend applet",
	fn,
	hostType: EAppletHostType.BE,
	scope: EAppletScope.GLOBAL,
};
