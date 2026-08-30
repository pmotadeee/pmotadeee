import { Box, HStack, Text } from "@chakra-ui/react";
import { EToolApprovalMode, EToolCallStatus } from "@warpcore/bridge";
import {
	AlertCircle,
	Ban,
	Check,
	ChevronDown,
	ChevronRight,
	Loader,
	Lock,
	Wrench,
	X,
} from "lucide-react";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
	decideMcpToolCall,
	fetchThreadPermissions,
	setThreadToolPermission,
} from "@/api/mcpServices";
import { useToast } from "@/components/ToastProvider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { computeModeUnionTools } from "@/lib/toolUtils";
import { useStore } from "@/store";
import { MiniToolCallUiSpace } from "../ui-space/MiniToolCallUiSpace";
import { ToolCallBlockBody } from "./ToolCallBlockBody";
import { ServerStatusContext } from "./thread";
import { autoResolveMiniRenderer } from "./tool-renderers/resolver";

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

interface IToolCallBlockCollapsibleProps {
	toolCallId: string;
	toolName: string;
	serverName?: string;
	args: Record<string, unknown>;
	result?: unknown;
	status: "complete" | "running" | "requires-action" | "error";
	messageId: string;
}

export const ToolCallBlockCollapsible = React.memo(
	({
		toolCallId,
		toolName,
		serverName,
		args,
		result,
		status,
		messageId,
	}: IToolCallBlockCollapsibleProps) => {
		const currentThreadId = useStore((s) => s.currentThreadId);
		const { currentServerId } = useContext(ServerStatusContext);
		const currentSystemPrompt = useStore((s) => s.currentSystemPrompt);
		const currentInferenceParams = useStore((s) => s.currentInferenceParams);
		const toolCall = useStore((s) => s.toolCallsById[toolCallId]);
		const toolCallRenderers = useStore((s) => s.toolCallRenderers);
		const attachAllTools = useStore((s) => s.attachAllTools);
		const attachedTools = useStore((s) => s.attachedTools);
		const modes = useStore((s) => s.modes);
		const modeId = useStore((s) => s.getCurrentThreadState(s)?.modeId);
		const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
		const currentMode = modeId ? modes[modeId] : null;
		const isModeActive = !!currentMode;

		const modeUnionTools = useMemo(
			() => computeModeUnionTools(modes, isModeActive),
			[isModeActive, modes],
		);

		const [isOpen, setIsOpen] = useState(false);
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

		const MiniComponent = useMemo(() => {
			return autoResolveMiniRenderer(toolName, args, result, toolCallRenderers);
		}, [toolName, args, result, toolCallRenderers]);

		return (
			<Box w="full" overflow="hidden">
				<Collapsible
					open={isOpen}
					onOpenChange={setIsOpen}
					style={{
						borderRadius: "10px",
						borderColor: "var(--wc-border-subtle)",
						borderWidth: isOpen ? 1 : 0,
					}}
				>
					<CollapsibleTrigger asChild>
						<HStack
							gap="2"
							align="center"
							whiteSpace="nowrap"
							overflow="hidden"
							py="1"
							cursor="pointer"
							title={
								displayStatus === EToolCallStatus.ERROR
									? toolCall?.error
									: undefined
							}
							_hover={{ opacity: 0.8 }}
							px="2"
						>
							{/* Chevron */}
							<Box flexShrink={0}>
								{isOpen ? (
									<ChevronDown size={13} color="var(--wc-text-muted)" />
								) : (
									<ChevronRight size={13} color="var(--wc-text-muted)" />
								)}
							</Box>

							{/* Mini renderer component — memoized */}
							<Box
								minW="0"
								overflow="hidden"
								textDecoration={
									displayStatus === EToolCallStatus.DENIED ||
									displayStatus === EToolCallStatus.ERROR
										? "line-through"
										: "none"
								}
							>
								<MiniToolCallUiSpace toolCallId={toolCallId} messageId={messageId}>
									{MiniComponent ? (
										<MiniComponent
											args={args}
											result={result}
											status={displayStatus}
										/>
									) : (
										<HStack gap="1" align="center">
											<Wrench
												size={chatFontSize}
												color="var(--wc-text-muted)"
											/>
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
							</Box>

							{/* Spacer */}
							<Box flex="1" />

							{/* Right side: status OR buttons (never both) */}
							<Box flexShrink={0}>
								{!isPending && isExecuting && (
									<HStack gap="1">
										<Loader
											size={11}
											color={statusColor}
											className="animate-spin"
										/>
										<Text fontSize="var(--chat-font-size)" color={statusColor}>
											{statusLabels[displayStatus]}
										</Text>
									</HStack>
								)}
								{displayStatus === EToolCallStatus.COMPLETED && (
									<Check size={11} color={statusColor} />
								)}
								{displayStatus === EToolCallStatus.DENIED && (
									<HStack gap="1">
										<Ban size={11} color={statusColor} />
										<Text fontSize="var(--chat-font-size)" color={statusColor}>
											{statusLabels[displayStatus]}
										</Text>
									</HStack>
								)}
								{displayStatus === EToolCallStatus.ERROR && (
									<HStack gap="1">
										<AlertCircle size={11} color={statusColor} />
										<Text fontSize="var(--chat-font-size)" color={statusColor}>
											{statusLabels[displayStatus]}
										</Text>
									</HStack>
								)}
								{isPending && deciding && (
									<HStack gap="1">
										<Loader
											size={11}
											color="var(--wc-text-muted)"
											className="animate-spin"
										/>
										<Text
											fontSize="var(--chat-font-size)"
											color="var(--wc-text-muted)"
										>
											Processing...
										</Text>
									</HStack>
								)}
								{isPending && !deciding && (
									<HStack gap="2">
										<Box
											as="button"
											px="3"
											py="1"
											fontSize="var(--chat-font-size)"
											borderRadius="sm"
											bg="var(--wc-accent-green-bg-15)"
											color="var(--wc-accent-green)"
											_hover={{ bg: "var(--wc-accent-green-hover)" }}
											cursor="pointer"
											onClick={(e) => {
												e.stopPropagation();
												handleDecision("approve");
											}}
										>
											<HStack gap="1">
												<Check size={12} />
												<Text fontSize="var(--chat-font-size)">
													Allow Once
												</Text>
											</HStack>
										</Box>
										<Box
											as="button"
											px="3"
											py="1"
											fontSize="var(--chat-font-size)"
											borderRadius="sm"
											bg="var(--wc-accent-yellow-bg-8)"
											color="var(--wc-accent-yellow-strong)"
											_hover={{ bg: "var(--wc-accent-yellow-hover-bg)" }}
											cursor="pointer"
											onClick={(e) => {
												e.stopPropagation();
												handleAlwaysApprove();
											}}
										>
											<HStack gap="1">
												<Lock size={12} />
												<Text fontSize="var(--chat-font-size)">
													Allow Always
												</Text>
											</HStack>
										</Box>
										<Box
											as="button"
											px="3"
											py="1"
											fontSize="var(--chat-font-size)"
											borderRadius="sm"
											bg="var(--wc-accent-red-bg-12)"
											color="var(--wc-accent-red-alt)"
											_hover={{ bg: "var(--wc-accent-red-hover)" }}
											cursor="pointer"
											onClick={(e) => {
												e.stopPropagation();
												handleDecision("deny");
											}}
										>
											<HStack gap="1">
												<X size={12} />
												<Text fontSize="var(--chat-font-size)">Deny</Text>
											</HStack>
										</Box>
									</HStack>
								)}
							</Box>
						</HStack>
					</CollapsibleTrigger>

					<CollapsibleContent>
						{isOpen && (
							<ToolCallBlockBody
								toolCallId={toolCallId}
								toolName={toolName}
								serverName={serverName}
								args={args}
								result={result}
								messageId={messageId}
							/>
						)}
					</CollapsibleContent>
				</Collapsible>
			</Box>
		);
	},
);
