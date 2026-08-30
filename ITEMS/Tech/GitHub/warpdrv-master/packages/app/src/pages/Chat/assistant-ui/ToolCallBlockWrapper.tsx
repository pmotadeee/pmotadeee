import { Box, HStack, Text } from "@chakra-ui/react";
import { EToolApprovalMode, EToolCallStatus } from "@warpcore/bridge";
import { AlertCircle, Ban, Check, Loader, Lock, Wrench, X } from "lucide-react";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
	decideMcpToolCall,
	fetchThreadPermissions,
	setThreadToolPermission,
} from "@/api/mcpServices";
import { useToast } from "@/components/ToastProvider";
import { computeModeUnionTools } from "@/lib/toolUtils";
import { ToolCallBlock } from "@/pages/Chat/assistant-ui/ToolCallBlock";
import { useStore } from "@/store";
import { WithErrorBoundary } from "../../../components/WithErrorBoundary";
import { ToolCallUiSpace } from "../ui-space/ToolCallUiSpace";
import { ServerStatusContext } from "./thread";
import { autoResolveRenderer } from "./tool-renderers/resolver";

interface IToolCallBlockWrapperProps {
	toolCallId: string;
	toolName: string;
	serverName?: string;
	args: Record<string, unknown>;
	result?: unknown;
	status: "complete" | "running" | "requires-action" | "error";
	messageId: string;
}

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

export const ToolCallBlockWrapper = React.memo(
	({
		toolCallId,
		toolName,
		serverName,
		args,
		result,
		status,
		messageId,
	}: IToolCallBlockWrapperProps) => {
		const currentThreadId = useStore((s) => s.currentThreadId);
		const { currentServerId } = useContext(ServerStatusContext);
		const currentSystemPrompt = useStore((s) => s.currentSystemPrompt);
		const currentInferenceParams = useStore((s) => s.currentInferenceParams);
		const toolCall = useStore((s) => s.toolCallsById[toolCallId]);
		const serverState = useStore((s) => (serverName ? s.mcpServers[serverName] : undefined));
		const toolCallRenderers = useStore((s) => s.toolCallRenderers);
		const attachAllTools = useStore((s) => s.attachAllTools);
		const attachedTools = useStore((s) => s.attachedTools);
		const modes = useStore((s) => s.modes);
		const modeId = useStore((s) => s.getCurrentThreadState(s)?.modeId);
		const currentMode = modeId ? modes[modeId] : null;
		const isModeActive = !!currentMode;

		const modeUnionTools = useMemo(
			() => computeModeUnionTools(modes, isModeActive),
			[isModeActive, modes],
		);

		const [deciding, setDeciding] = useState(false);
		const toast = useToast();

		const handleDecision = useCallback(
			async (decision: "approve" | "deny") => {
				if (!currentThreadId || !currentServerId) return;
				setDeciding(true);
				try {
					const tools = isModeActive
						? {
								attachAllTools: false,
								attachedTools: modeUnionTools,
								skipToolsSave: true,
							}
						: {
								attachAllTools,
								attachedTools: attachAllTools ? undefined : attachedTools,
							};
					await decideMcpToolCall(
						toolCallId,
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
				toolCallId,
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
			if (!currentThreadId || !currentServerId || !serverName) return;
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
					toolCallId,
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
			toolCallId,
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

		const displayStatus: EToolCallStatus =
			toolCall?.status ??
			(status === "requires-action"
				? EToolCallStatus.PENDING
				: status === "running"
					? EToolCallStatus.EXECUTING
					: status === "error"
						? EToolCallStatus.ERROR
						: EToolCallStatus.COMPLETED);

		const isPending = displayStatus === EToolCallStatus.PENDING;
		const isExecuting = displayStatus === EToolCallStatus.EXECUTING;
		const statusColor = statusColors[displayStatus];

		const body = useMemo(() => {
			const fallback = (
				<ToolCallBlock
					args={JSON.stringify(args)}
					result={result ? JSON.stringify(result) : undefined}
				/>
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
							result={result}
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
						<AutoComponent {...props} result={result} />
					</WithErrorBoundary>
				);
			}
			// Priority 3: default fallback
			return fallback;
		}, [serverState, toolName, toolCallRenderers, args, result]);

		return (
			<Box
				m="-3.5"
				borderRadius="lg"
				bg="var(--wc-bg-interactive)"
				overflow="hidden"
				borderBottomColor={"var(--wc-border-default)"}
				borderBottomWidth={0}
			>
				<HStack
					gap="3"
					px="3"
					py="2.5"
					borderBottomColor={"var(--wc-border-subtle)"}
					borderBottomWidth={1}
				>
					<Wrench size={13} color="var(--wc-text-tertiary)" />
					<Text
						fontSize="calc(var(--chat-font-size) - 1px)"
						fontWeight="700"
						color="var(--wc-text-secondary)"
					>
						{toolName}
					</Text>
					<Text fontSize="calc(var(--chat-font-size) - 2px)" color="var(--wc-text-faint)">
						{serverName}
					</Text>
					<Box flex="1" />
					<HStack gap="1">
						{isExecuting && (
							<>
								<Loader size={11} color={statusColor} className="animate-spin" />
								<Text
									fontSize="calc(var(--chat-font-size) - 4px)"
									color={statusColor}
								>
									{statusLabels[displayStatus]}
								</Text>
							</>
						)}
						{displayStatus === EToolCallStatus.COMPLETED && (
							<Check size={11} color={statusColor} />
						)}
						{displayStatus === EToolCallStatus.DENIED && (
							<>
								<Ban size={11} color={statusColor} />
								<Text
									fontSize="calc(var(--chat-font-size) - 4px)"
									color={statusColor}
								>
									{statusLabels[displayStatus]}
								</Text>
							</>
						)}
						{displayStatus === EToolCallStatus.ERROR && (
							<>
								<AlertCircle
									size={11}
									color={statusColor}
									title={toolCall?.error}
								/>
								<Text
									fontSize="calc(var(--chat-font-size) - 4px)"
									color={statusColor}
								>
									{statusLabels[displayStatus]}
								</Text>
							</>
						)}
						{isPending && deciding && (
							<>
								<Loader
									size={11}
									color="var(--wc-text-muted)"
									className="animate-spin"
								/>
								<Text
									fontSize="calc(var(--chat-font-size) - 3px)"
									color="var(--wc-text-muted)"
								>
									Processing...
								</Text>
							</>
						)}
						/* Approval buttons moved to ToolCallBlockCollapsible header
						{isPending && !deciding && (
							<HStack gap="2">
								<Box
									as="button"
									px="3"
									py="1"
									fontSize="calc(var(--chat-font-size) - 2px)"
									borderRadius="sm"
									bg="var(--wc-accent-green-bg-15)"
									color="var(--wc-accent-green)"
									_hover={{ bg: "var(--wc-accent-green-hover)" }}
									onClick={() => handleDecision("approve")}
								>
									<HStack gap="1">
										<Check size={12} />
										<Text fontSize="calc(var(--chat-font-size) - 2px)">
											Allow Once
										</Text>
									</HStack>
								</Box>
								<Box
									as="button"
									px="3"
									py="1"
									fontSize="calc(var(--chat-font-size) - 2px)"
									borderRadius="sm"
									bg="var(--wc-accent-yellow-bg-8)"
									color="var(--wc-accent-yellow-strong)"
									_hover={{ bg: "var(--wc-accent-yellow-hover-bg)" }}
									onClick={() => handleAlwaysApprove()}
								>
									<HStack gap="1">
										<Lock size={12} />
										<Text fontSize="calc(var(--chat-font-size) - 2px)">
											Allow Always
										</Text>
									</HStack>
								</Box>
								<Box
									as="button"
									px="3"
									py="1"
									fontSize="calc(var(--chat-font-size) - 2px)"
									borderRadius="sm"
									bg="var(--wc-accent-red-bg-12)"
									color="var(--wc-accent-red-alt)"
									_hover={{ bg: "var(--wc-accent-red-hover)" }}
									onClick={() => handleDecision("deny")}
								>
									<HStack gap="1">
										<X size={12} />
										<Text fontSize="calc(var(--chat-font-size) - 2px)">
											Deny
										</Text>
									</HStack>
								</Box>
							</HStack>
						)}
						*/
					</HStack>
				</HStack>

				<ToolCallUiSpace toolCallId={toolCallId} messageId={messageId}>
					{displayStatus === EToolCallStatus.ERROR && toolCall?.error && (
						<Box
							px="3"
							py="2"
							borderBottomWidth="1px"
							borderColor="var(--wc-border-subtle)"
						>
							<Text
								fontSize="calc(var(--chat-font-size) - 3px)"
								color="var(--wc-accent-red)"
								whiteSpace="pre-wrap"
								wordBreak="break-word"
							>
								{toolCall.error}
							</Text>
						</Box>
					)}
					{body}
				</ToolCallUiSpace>
			</Box>
		);
	},
);
