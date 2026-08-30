import { Box, HStack, Text } from "@chakra-ui/react";
import type { IMessagePartToolCall, IToolCall, TMessageId } from "@warpcore/bridge";
import { EChatRole, EMessagePartType, EToolApprovalMode, EToolCallStatus } from "@warpcore/bridge";
import { Check, Loader, Lock, Wrench, X } from "lucide-react";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
	decideMcpToolCall,
	fetchThreadPermissions,
	setThreadToolPermission,
} from "@/api/mcpServices";
import { useToast } from "@/components/ToastProvider";
import { useDependantState } from "@/hooks/useDependantState";
import { computeModeUnionTools } from "@/lib/toolUtils";
import { ToolCallBlock } from "@/pages/Chat/assistant-ui/ToolCallBlock";
import { useStore } from "@/store";
import { WithErrorBoundary } from "../../../components/WithErrorBoundary";
import { MiniToolCallUiSpace } from "../ui-space/MiniToolCallUiSpace";
import { PendingToolCallUiSpace } from "../ui-space/PendingToolCallUiSpace";
import { ServerStatusContext } from "./thread";
import { autoResolveMiniRenderer, autoResolveRenderer } from "./tool-renderers/resolver";

const statusColors: Record<EToolCallStatus, string> = {
	[EToolCallStatus.PENDING]: "var(--wc-accent-yellow-strong)",
	[EToolCallStatus.DENIED]: "var(--wc-accent-red)",
	[EToolCallStatus.EXECUTING]: "var(--wc-accent-blue)",
	[EToolCallStatus.COMPLETED]: "var(--wc-accent-green-icon)",
	[EToolCallStatus.ERROR]: "var(--wc-accent-red)",
};

const statusLabels: Record<EToolCallStatus, string> = {
	[EToolCallStatus.PENDING]: "Awaiting approval",
	[EToolCallStatus.DENIED]: "Denied",
	[EToolCallStatus.EXECUTING]: "Running",
	[EToolCallStatus.COMPLETED]: "Completed",
	[EToolCallStatus.ERROR]: "Error",
};

export const PendingToolCallsBox = React.memo(() => {
	// ===== All hooks first, unconditionally =====
	const currentThreadId = useStore((s) => s.currentThreadId);
	const headMessageIdByThread = useStore((s) => s.headMessageIdByThread);
	const messagesByThread = useStore((s) => s.messagesByThread);
	const toolCallsById = useStore((s) => s.toolCallsById);
	const { currentServerId } = useContext(ServerStatusContext);
	const currentSystemPrompt = useStore((s) => s.currentSystemPrompt);
	const currentInferenceParams = useStore((s) => s.currentInferenceParams);
	const toolCallRenderers = useStore((s) => s.toolCallRenderers);
	const attachAllTools = useStore((s) => s.attachAllTools);
	const attachedTools = useStore((s) => s.attachedTools);
	const modes = useStore((s) => s.modes);
	const threadState = useStore((s) => s.getCurrentThreadState(s));
	const mcpServers = useStore((s) => s.mcpServers);
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
	const toast = useToast();
	const [deciding, setDeciding] = useState(false);

	const modeId = threadState?.modeId as string | undefined;
	const currentMode = modeId ? modes[modeId] : null;
	const isModeActive = !!currentMode;
	const headMessageId = currentThreadId ? headMessageIdByThread[currentThreadId] : null;

	const modeUnionTools = useMemo(
		() => computeModeUnionTools(modes, isModeActive),
		[isModeActive, modes],
	);

	// Filter tool calls for the head message of the current thread
	const anchorMessageId = useMemo(() => {
		if (!currentThreadId || !headMessageId) return null;
		const msgs = messagesByThread[currentThreadId] ?? {};
		let cursor: TMessageId | null = headMessageId;
		while (cursor) {
			const msg = msgs[cursor];
			if (!msg) return null;
			if (msg.role !== EChatRole.TOOL) {
				return msg.role === EChatRole.ASSISTANT ? cursor : null;
			}
			cursor = msg.parentId;
		}
		return null;
	}, [currentThreadId, headMessageId, messagesByThread]);
	const headMessageToolCalls = useMemo(() => {
		if (!currentThreadId || !anchorMessageId) return [];
		const msg = messagesByThread[currentThreadId]?.[anchorMessageId];
		if (!msg) return [];
		return msg.content
			.filter((p): p is IMessagePartToolCall => p.type === EMessagePartType.TOOL_CALL)
			.map((p) => toolCallsById[p.toolCallId])
			.filter((tc): tc is IToolCall => !!tc);
	}, [currentThreadId, anchorMessageId, messagesByThread, toolCallsById]);

	// Dismiss state - resets when anchor message changes
	const [dismissedAnchorKey, setDismissedAnchorKey] = useDependantState(anchorMessageId ?? null);
	const isDismissed = useMemo(() => dismissedAnchorKey === null, [dismissedAnchorKey]);

	// Get pending tool calls (sorted by creation time)
	const pendingCalls = useMemo(() => {
		return headMessageToolCalls
			.filter((tc) => tc.status === EToolCallStatus.PENDING)
			.sort((a, b) => a.createdAt - b.createdAt);
	}, [headMessageToolCalls]);

	// Hide the entire box if any tool call was denied
	const hasDenied = headMessageToolCalls.some((tc) => tc.status === EToolCallStatus.DENIED);

	// Safe to access currentCall for hooks - use first pending or a dummy
	const currentCall = pendingCalls[0] ?? null;
	const serverName = currentCall?.serverName ?? "";
	const toolName = currentCall?.toolName ?? "";

	// All hooks that depend on currentCall must be here, before early return
	const args = useMemo(() => {
		if (!currentCall) return {};
		try {
			return JSON.parse(currentCall.arguments) as Record<string, unknown>;
		} catch {
			return {};
		}
	}, [currentCall?.arguments]);

	const serverState = useMemo(
		() => (serverName ? mcpServers[serverName] : undefined),
		[serverName, mcpServers],
	);

	const MiniComponent = useMemo(() => {
		return autoResolveMiniRenderer(toolName, args, currentCall?.result, toolCallRenderers);
	}, [toolName, args, currentCall?.result, toolCallRenderers]);

	const handleDecision = useCallback(
		async (decision: "approve" | "deny") => {
			if (!currentCall || !currentThreadId || !currentServerId) return;
			setDeciding(true);
			try {
				const tools = isModeActive
					? { attachAllTools: false, attachedTools: modeUnionTools, skipToolsSave: true }
					: { attachAllTools, attachedTools: attachAllTools ? undefined : attachedTools };
				await decideMcpToolCall(
					currentCall.id,
					decision,
					currentThreadId,
					currentServerId,
					currentSystemPrompt,
					currentInferenceParams,
					undefined,
					tools.attachAllTools,
					tools.attachedTools,
					tools.skipToolsSave,
				);
			} finally {
				setDeciding(false);
			}
		},
		[
			currentCall?.id,
			currentThreadId,
			currentServerId,
			currentSystemPrompt,
			currentInferenceParams,
			attachAllTools,
			attachedTools,
			isModeActive,
			modeUnionTools,
		],
	);

	const handleAlwaysApprove = useCallback(async () => {
		if (!currentCall || !currentThreadId || !currentServerId || !serverName) return;
		setDeciding(true);
		try {
			await setThreadToolPermission(
				currentThreadId,
				serverName,
				toolName,
				true,
				EToolApprovalMode.ALLOWED,
			);
			const res = await fetchThreadPermissions(currentThreadId);
			if (res.ok)
				useStore
					.getState()
					.setThreadToolPermissions(currentThreadId, res.data.threadOverrides);
			const tools = isModeActive
				? { attachAllTools: false, attachedTools: modeUnionTools, skipToolsSave: true }
				: { attachAllTools, attachedTools: attachAllTools ? undefined : attachedTools };
			await decideMcpToolCall(
				currentCall.id,
				"approve",
				currentThreadId,
				currentServerId,
				currentSystemPrompt,
				currentInferenceParams,
				undefined,
				tools.attachAllTools,
				tools.attachedTools,
				tools.skipToolsSave,
			);
			toast({
				title: `"${toolName}" will always be approved for this thread`,
				status: "success",
				duration: 3000,
			});
		} finally {
			setDeciding(false);
		}
	}, [
		currentCall?.id,
		toolName,
		serverName,
		currentThreadId,
		currentServerId,
		currentSystemPrompt,
		currentInferenceParams,
		attachAllTools,
		attachedTools,
		isModeActive,
		modeUnionTools,
		toast,
	]);

	// Render the tool call body using the same logic as ToolCallBlockWrapper
	const body = useMemo(() => {
		if (!currentCall) return null;
		const fallback = (
			<ToolCallBlock args={currentCall.arguments} result={currentCall.result ?? undefined} />
		);
		// Priority 1: explicit mcp.json renderer config
		const rendererCfg = serverState?.warpdrv?.renderers?.[toolName];
		const ExplicitComponent = rendererCfg
			? toolCallRenderers[rendererCfg.component]?.component
			: undefined;
		if (rendererCfg && ExplicitComponent) {
			const mappedArgs: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(args)) {
				const targetKey = rendererCfg.propsMap?.[k] ?? k;
				mappedArgs[targetKey] = v;
			}
			return (
				<WithErrorBoundary fallback={fallback}>
					<ExplicitComponent
						{...mappedArgs}
						{...(rendererCfg.props ?? {})}
						result={currentCall.result}
					/>
				</WithErrorBoundary>
			);
		}
		// Priority 2: auto-match via keywords + canRender
		const resolved = autoResolveRenderer(toolName, args, toolCallRenderers);
		if (resolved) {
			const { component: AutoComponent, props } = resolved;
			return (
				<WithErrorBoundary fallback={fallback}>
					<AutoComponent {...props} result={currentCall.result} />
				</WithErrorBoundary>
			);
		}
		// Priority 3: default fallback
		return fallback;
	}, [
		serverState,
		toolName,
		toolCallRenderers,
		args,
		currentCall?.arguments,
		currentCall?.result,
	]);

	// Nothing to show - early return AFTER all hooks
	if (
		hasDenied ||
		pendingCalls.length === 0 ||
		!currentThreadId ||
		!anchorMessageId ||
		isDismissed
	)
		return null;

	return (
		<Box
			data-role="assistant"
			minW="48rem"
			shadow="0 10px 10px 10px rgba(0,0,0,0.15)"
			borderWidth="1px"
			borderColor="var(--wc-border-default)"
			borderRadius="lg"
			bg="var(--wc-bg-elevated)"
			overflow="hidden"
		>
			{/* Header */}
			<HStack
				gap="2"
				px="3"
				py="2"
				borderBottomWidth={1}
				borderBottomColor="var(--wc-border-subtle)"
			>
				<Wrench size={13} color="var(--wc-text-tertiary)" />
				<Text
					fontSize="calc(var(--chat-font-size) - 3px)"
					fontWeight="600"
					color="var(--wc-text-primary)"
				>
					Tool Calls ({pendingCalls.length} Pending)
				</Text>
				<Box flex="1" />
				<Box
					as="button"
					display="flex"
					alignItems="center"
					justifyContent="center"
					width="20px"
					height="20px"
					borderRadius="sm"
					color="var(--wc-text-muted)"
					_hover={{ bg: "var(--wc-bg-hover)", color: "var(--wc-accent-red)" }}
					onClick={() => setDismissedAnchorKey(null)}
					title="Dismiss"
				>
					<X size={12} />
				</Box>
			</HStack>

			{/* Tool call row — mini renderer */}
			<HStack
				gap="3"
				px="3"
				py="2.5"
				borderBottomWidth={1}
				borderBottomColor="var(--wc-border-subtle)"
			>
				<MiniToolCallUiSpace toolCallId={currentCall.id} messageId={anchorMessageId}>
					{MiniComponent ? (
						<MiniComponent
							args={args}
							result={currentCall?.result}
							status={currentCall?.status}
						/>
					) : (
						<HStack gap="1" align="center">
							<Wrench size={chatFontSize} color="var(--wc-text-muted)" />
							<Text whiteSpace="nowrap">
								{serverName && (
									<Text as="span" color="var(--wc-text-muted)">
										{serverName}/
									</Text>
								)}
								<Text as="span" color="var(--wc-text-primary)">
									{toolName}
								</Text>
							</Text>
						</HStack>
					)}
				</MiniToolCallUiSpace>
				<Box flex="1" />
				<HStack gap="1">
					{deciding && (
						<Loader size={11} color="var(--wc-text-muted)" className="animate-spin" />
					)}
					{!deciding && (
						<Loader
							size={11}
							color={statusColors[EToolCallStatus.PENDING]}
							className="animate-spin"
						/>
					)}
				</HStack>
			</HStack>

			{/* Tool call body */}
			<Box maxH="700px" overflowY="auto" overflowX="hidden" maxW="100%">
				<PendingToolCallUiSpace toolCallId={currentCall.id} messageId={anchorMessageId}>
					<Box maxH={"500px"} overflowY="auto" overflowX="auto" maxW="100%">
						{body}
					</Box>
				</PendingToolCallUiSpace>
			</Box>

			{/* Action buttons */}
			<HStack
				gap="2"
				px="3"
				py="2.5"
				borderTopWidth={1}
				borderTopColor="var(--wc-border-subtle)"
			>
				<Box
					as="button"
					disabled={deciding}
					opacity={deciding ? 0.5 : 1}
					cursor={deciding ? "not-allowed" : "pointer"}
					px="3"
					py="1"
					fontSize="calc(var(--chat-font-size) - 2px)"
					borderRadius="sm"
					bg="var(--wc-accent-green-bg-15)"
					color="var(--wc-accent-green)"
					_hover={{ bg: deciding ? undefined : "var(--wc-accent-green-hover)" }}
					onClick={() => handleDecision("approve")}
				>
					<HStack gap="1">
						<Check size={12} />
						<Text fontSize="calc(var(--chat-font-size) - 2px)">Allow Once</Text>
					</HStack>
				</Box>
				<Box
					as="button"
					disabled={deciding}
					opacity={deciding ? 0.5 : 1}
					cursor={deciding ? "not-allowed" : "pointer"}
					px="3"
					py="1"
					fontSize="calc(var(--chat-font-size) - 2px)"
					borderRadius="sm"
					bg="var(--wc-accent-yellow-bg-8)"
					color="var(--wc-accent-yellow-strong)"
					_hover={{ bg: deciding ? undefined : "var(--wc-accent-yellow-hover-bg)" }}
					onClick={() => handleAlwaysApprove()}
				>
					<HStack gap="1">
						<Lock size={12} />
						<Text fontSize="calc(var(--chat-font-size) - 2px)">Allow Always</Text>
					</HStack>
				</Box>
				<Box
					as="button"
					disabled={deciding}
					opacity={deciding ? 0.5 : 1}
					cursor={deciding ? "not-allowed" : "pointer"}
					px="3"
					py="1"
					fontSize="calc(var(--chat-font-size) - 2px)"
					borderRadius="sm"
					bg="var(--wc-accent-red-bg-12)"
					color="var(--wc-accent-red-alt)"
					_hover={{ bg: deciding ? undefined : "var(--wc-accent-red-hover)" }}
					onClick={() => handleDecision("deny")}
				>
					<HStack gap="1">
						<X size={12} />
						<Text fontSize="calc(var(--chat-font-size) - 2px)">Deny</Text>
					</HStack>
				</Box>
			</HStack>
		</Box>
	);
});
