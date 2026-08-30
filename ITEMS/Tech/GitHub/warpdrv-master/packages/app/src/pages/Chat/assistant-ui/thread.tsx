import {
	ActionBarPrimitive,
	AuiIf,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	SuggestionPrimitive,
	ThreadPrimitive,
	useAui,
	useAuiEvent,
	useAuiState,
} from "@assistant-ui/react";
import {
	AccordionItem as AccordionItemComp,
	AccordionItemContent,
	AccordionItemTrigger,
	AccordionRoot,
	Box,
	HStack,
	IconButton,
	Image,
	Menu,
	Popover,
	Switch,
	Text,
	VStack,
} from "@chakra-ui/react";
import { EMcpServerStatus, type IToolAttachment } from "@warpcore/bridge";
import { EReasoningEffort, EServerStatus, type TServerId } from "@warpcore/shared";
import { encodingForModel } from "js-tiktoken";
import {
	ArrowDownIcon,
	Bot,
	CheckIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	MoreVertical,
	PencilIcon,
	RefreshCwIcon,
	SendHorizonal,
	SquareIcon,
	Timer,
	Trash2,
	Volume2,
	Wrench,
} from "lucide-react";
import React, {
	type FC,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LuDatabaseZap } from "react-icons/lu";
import { deleteMessage } from "@/api/services";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ThreadServerSelector } from "@/pages/Chat/assistant-ui/ServerSelector";
import { VoiceInput } from "@/pages/Chat/assistant-ui/VoiceInput";
import { ThreadWhisperServerSelector } from "@/pages/Chat/assistant-ui/WhisperServerSelector";
import { BranchTokensContext, ChatConfigContext } from "@/pages/Chat/ChatPage";
import { useStore } from "@/store";
import { ComposerUiSpace } from "../ui-space/ComposerUiSpace";
import { MessageFooterUiSpace } from "../ui-space/MessageFooterUiSpace";
import { MessageUiSpace } from "../ui-space/MessageUiSpace";
import { WorkspaceView } from "../WorkspaceView";
import { AnnotationsBox } from "./AnnotationsBox";
import { ComposerAddAttachment, ComposerAttachments, UserMessageAttachments } from "./attachment";
import { ComposerEditor, type IWarpComposerEditorRef } from "./ComposerEditor";
import { insertComposerText } from "./composerEditorRegistry";
import { DictationProvider, useDictation } from "./DictationContext";
import type { IExtractedSlashCommand } from "./docToString";
import { Elicitation } from "./Elicitation";
import { EmbeddingToggle } from "./EmbeddingToggle";
import { KokoroTTSButton } from "./KokoroTTS";
import { MarkdownText } from "./markdown-text";
import { MonitorBox } from "@/applets/ui/MonitorBox";
import { MonitorMiniBox } from "@/applets/ui/MonitorMiniBox";
import { PendingToolCallsBox } from "./PendingToolCallsBox";
import { SelectionPopover } from "./SelectionPopover";
import { ToolCallBlockCollapsible } from "./ToolCallBlockCollapsible";
import { TTSFlameWaveform } from "./TTSFlameWaveform";
import { TooltipIconButton } from "./tooltip-icon-button";
import { VoiceWaveform } from "./VoiceWaveform";

const tokenEncoder = encodingForModel("gpt-4o");

interface DeleteMessageState {
	messageId: string | null;
	isLoading: boolean;
	open: (messageId: string) => void;
	close: () => void;
	confirm: () => Promise<void>;
}
const DeleteMessageContext = React.createContext<DeleteMessageState | null>(null);

interface IServerStatusContext {
	currentServerId: string | null;
	currentServerStatus: EServerStatus | null;
	isValidServer: boolean;
	supportsMultiModal: boolean;
}

export const ServerStatusContext = React.createContext<IServerStatusContext>({
	currentServerId: null,
	currentServerStatus: null,
	isValidServer: false,
	supportsMultiModal: false,
});

const hexToRgba = (hex: string): string => {
	const cleaned = hex.replace("#", "");
	const r = parseInt(cleaned.slice(0, 2), 16);
	const g = parseInt(cleaned.slice(2, 4), 16);
	const b = parseInt(cleaned.slice(4, 6), 16);
	return `rgba(${r},${g},${b}`;
};

export const Thread: FC<{
	isLoading?: boolean;
	currentServerId: TServerId | null;
}> = React.memo(({ isLoading = false, currentServerId }) => {
	const ThreadMsgFn = useCallback(() => <ThreadMessage />, []);
	const serversMap = useStore((s) => s.servers);
	const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
	const [deletingLoading, setDeletingLoading] = useState(false);

	const currentServer = useMemo(
		() => (currentServerId ? serversMap[currentServerId] || null : null),
		[currentServerId, serversMap],
	);
	const currentServerStatus = currentServer?.status || null;
	const isValidServer = !!currentServerId && currentServer?.status === EServerStatus.RUNNING;
	const supportsMultiModal = currentServer?.useMultiModal ?? false;
	const chatFixedWidth = useStore((s) => s.settings.chatFixedWidth ?? false);
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);

	const deleteMessageCtx = useMemo<DeleteMessageState>(() => {
		const resolveFn: (() => void) | null = null;
		const handleConfirm = async () => {
			setDeletingLoading(true);
			try {
				await deleteMessage(deletingMessageId!);
			} finally {
				setDeletingLoading(false);
				setDeletingMessageId(null);
				if (resolveFn) resolveFn();
			}
		};
		return {
			messageId: deletingMessageId,
			isLoading: deletingLoading,
			open: (messageId: string) => setDeletingMessageId(messageId),
			close: () => setDeletingMessageId(null),
			confirm: handleConfirm,
		};
	}, [deletingMessageId, deletingLoading]);

	return (
		<ServerStatusContext.Provider
			value={{ currentServerId, currentServerStatus, isValidServer, supportsMultiModal }}
		>
			<DeleteMessageContext.Provider value={deleteMessageCtx}>
				<DictationProvider>
					<ThreadPrimitive.Root
						className="aui-root aui-thread-root @container flex h-full flex-col"
						style={{
							["--thread-max-width" as string]: "44rem",
							["--composer-radius" as string]: "24px",
							["--composer-padding" as string]: "10px",
							["--chat-font-size" as string]: `calc(${chatFontSize}px - 3px)`,
						}}
					>
						<ThreadPrimitive.Viewport
							turnAnchor="bottom"
							autoScroll={false}
							className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-6 pt-4"
							style={{ overflowAnchor: "none" }}
						>
							{isLoading ? (
								<div className="flex h-full items-center justify-center">
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
								</div>
							) : (
								<>
									<AuiIf condition={(s) => s.thread.isEmpty}>
										<ThreadWelcome />
									</AuiIf>

									<div
										style={{
											maxWidth: chatFixedWidth ? "960px" : "100%",
											margin: "0 auto",
											width: "100%",
										}}
									>
										<ThreadPrimitive.Messages>
											{ThreadMsgFn}
										</ThreadPrimitive.Messages>
									</div>
									<SelectionPopover />
								</>
							)}

							<div className="sticky bottom-0 left-0 right-0 mt-auto flex flex-col items-center gap-4 pb-4 md:pb-6 pt-4 bg-[linear-gradient(to_bottom,transparent_0%,var(--wc-bg-page)_35%,var(--wc-bg-page)_100%)]">
								<ThreadPrimitive.ViewportFooter
									className="aui-thread-viewport-footer flex flex-col gap-4 overflow-visible"
									style={{ width: "48rem" }}
								>
									<ThreadScrollToBottom />
									<Elicitation />
									<AnnotationsBox />
									<MonitorMiniBox />
									<MonitorBox />
									<PendingToolCallsBox />
									<Composer />
								</ThreadPrimitive.ViewportFooter>
							</div>
						</ThreadPrimitive.Viewport>
					</ThreadPrimitive.Root>

					{deletingMessageId && (
						<ConfirmDialog
							title="Delete Message"
							message="Are you sure you want to delete this message?"
							isOpen={true}
							onConfirm={deleteMessageCtx.confirm}
							onCancel={deleteMessageCtx.close}
							isLoading={deletingLoading}
							confirmLabel="Delete"
						/>
					)}
				</DictationProvider>
			</DeleteMessageContext.Provider>
		</ServerStatusContext.Provider>
	);
});

const ThreadMessage: FC = React.memo(() => {
	const role = useAuiState((s) => s.message.role);
	const isEditing = useAuiState((s) => s.message.composer.isEditing);
	const parts = useAuiState((s) => s.message.content);
	const hasToolCalls = useMemo(
		() => parts.some((part: any) => part.type === "tool-call"),
		[parts],
	);

	const msg = useMemo(() => {
		if (isEditing) return <EditComposer />;
		else if (role === "user") return <UserMessage />;
		else if (hasToolCalls) return <ToolMessage />;
		else return <AssistantMessage />;
	}, [isEditing, role, hasToolCalls]);

	return msg;
});

const ThreadScrollToBottom: FC = React.memo(() => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
			>
				<ArrowDownIcon />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	);
});

const ThreadWelcome: FC = React.memo(() => {
	const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);
	if (activeWorkspaceId) return <WorkspaceView folderId={activeWorkspaceId} />;

	return (
		<div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
			<div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
				<div
					className="aui-thread-welcome-message flex size-full flex-col justify-center px-4"
					style={{
						alignItems: "center",
					}}
				>
					<Image
						src="/logo.png"
						alt=""
						mb="4"
						w="96px"
						h="96px"
						borderRadius="xl"
						opacity={0.8}
						objectFit="cover"
						className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both duration-200"
					/>
					<h1
						className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200"
						style={{ color: "var(--wc-text-heading)" }}
					>
						Hello there!
					</h1>
					<p
						className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-xl delay-75 duration-200"
						style={{ color: "var(--wc-text-secondary)" }}
					>
						How can I help you today?
					</p>
				</div>
			</div>
			<ThreadSuggestions />
		</div>
	);
});

const ThreadSuggestions: FC = () => {
	return (
		<div className="aui-thread-welcome-suggestions grid w-full @md:grid-cols-2 gap-2 pb-4">
			<ThreadPrimitive.Suggestions>
				{() => <ThreadSuggestionItem />}
			</ThreadPrimitive.Suggestions>
		</div>
	);
};

const ThreadSuggestionItem: FC = () => {
	return (
		<div className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 @md:nth-[n+3]:block nth-[n+3]:hidden animate-in fill-mode-both duration-200">
			<SuggestionPrimitive.Trigger send asChild>
				<Button
					variant="ghost"
					className="aui-thread-welcome-suggestion h-auto w-full @md:flex-col flex-wrap items-start justify-start gap-1 rounded-3xl border px-4 py-3 text-left text-sm transition-colors"
					style={{
						backgroundColor: "var(--wc-bg-card)",
						color: "var(--wc-text-primary)",
					}}
					_hover={{ bg: "var(--wc-bg-hover)" }}
				>
					<SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1 font-medium" />
					<SuggestionPrimitive.Description
						className="aui-thread-welcome-suggestion-text-2 empty:hidden"
						style={{ color: "var(--wc-text-secondary)" }}
					/>
				</Button>
			</SuggestionPrimitive.Trigger>
		</div>
	);
};

const ContextUsageBar: FC = React.memo(() => {
	const { contextSize } = useContext(ChatConfigContext);
	const branchTokensCount = useContext(BranchTokensContext);
	const composerText = useAuiState((s) => s.composer.text);

	const inputTokens = useMemo(
		() => (composerText ? tokenEncoder.encode(composerText).length : 0),
		[composerText],
	);
	const total = branchTokensCount + inputTokens;

	const { ctxLabel, color, pct, textColor } = useMemo(() => {
		const ctxLabel =
			contextSize > 0
				? contextSize > 1000
					? `${(contextSize / 1000).toFixed(0)}k`
					: String(contextSize)
				: "?";
		const pct = contextSize > 0 ? Math.min((total / contextSize) * 100, 100) : 0;
		const color =
			pct > 90
				? "var(--wc-accent-red)"
				: pct > 70
					? "var(--wc-accent-yellow-strong)"
					: "var(--wc-text-muted)";

		const textColor =
			pct > 90
				? "var(--wc-accent-red)"
				: pct > 70
					? "var(--wc-accent-yellow-strong)"
					: undefined;

		return { ctxLabel, color, pct, textColor };
	}, [contextSize, total]);

	return (
		<div
			className="flex items-center gap-2 px-1 pt-1"
			title={`Context: ${total.toLocaleString()} / ${contextSize > 0 ? contextSize.toLocaleString() : "?"} tokens`}
		>
			<div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-300"
					style={{ width: `${pct}%`, backgroundColor: color }}
				/>
			</div>
			<span
				className="text-[12px] font-mono text-muted-foreground/60 shrink-0"
				style={textColor ? { color: textColor } : undefined}
			>
				{total > 1000 ? `${(total / 1000).toFixed(1)}k` : total} / {ctxLabel}
			</span>
		</div>
	);
});

const Composer: FC = React.memo(() => {
	const { isValidServer } = useContext(ServerStatusContext);
	const { waveformStream, setWaveformStream, subscribeTranscript } = useDictation();
	const annotatorVisible = useStore((s) => s.annotatorVisible);
	const ttsIsSpeaking = useStore((s) => s.ttsIsSpeaking);
	const annotations = useStore((s) => s.annotations);
	const clearAnnotations = useStore((s) => s.clearAnnotations);
	const aui = useAui();
	const composerText = useAuiState((s) => s.composer.text);
	const pendingSlashCommands = useStore((s) => s.pendingSlashCommands);
	const editorRef = useRef<IWarpComposerEditorRef>(null);
	const modes = useStore((s) => s.modes);
	const modeId = useStore((s) => {
		const ts = s.getCurrentThreadState(s);
		return ts?.modeId as string | undefined;
	});
	const modeColor = useMemo(() => {
		return modeId ? modes[modeId]?.color : null;
	}, [modeId, modes]);

	const handleChangeText = useCallback(
		(text: string) => {
			aui.composer().setText(text);
		},
		[aui],
	);

	const handleEnter = useCallback(() => {
		// Annotation injection moved to FEApplet bridge.preCompletion hook
		// if (annotations.length > 0) {
		// 	const lines = annotations.map((a, i) => `${i + 1}. "${a.selectedText}"\n   ${a.comment}`);
		// 	const fullText = (lines.join('\n\n') + (composerText.trim() ? '\n\n' + composerText : '')).trim();
		// 	aui.composer().setText(fullText);
		// 	clearAnnotations();
		// }
		if (!composerText.trim() && (pendingSlashCommands.length > 0 || annotations.length > 0)) {
			aui.composer().setText("<continue>");
		}
		aui.composer().send({ startRun: true });
	}, [aui, annotations, composerText, clearAnnotations, pendingSlashCommands.length]);

	const composerDisabled = useAuiState((s) => s.composer.isEmpty || !s.composer.isEditing);
	const canSend = useCallback(() => {
		if (!isValidServer) {
			document.dispatchEvent(new CustomEvent("server-selector-shake"));
			return false;
		}
		if (composerDisabled && annotations.length === 0 && pendingSlashCommands.length === 0)
			return false;
		return true;
	}, [isValidServer, composerDisabled, annotations.length, pendingSlashCommands.length]);
	useAuiEvent("composer.send", () => {
		editorRef.current?.clear();
	});

	// Subscribe to dictation transcripts — only act when popover is not visible
	useEffect(() => {
		if (annotatorVisible) return;
		const unsubscribe = subscribeTranscript((text: string) => {
			const ed = editorRef.current?.getEditor();
			if (!ed) return;
			const needsSpace = !ed.getText().endsWith(" ");
			ed.chain()
				.focus()
				.insertContent((needsSpace ? " " : "") + text)
				.run();
		});
		return unsubscribe;
	}, [annotatorVisible, subscribeTranscript, aui]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValidServer) {
			document.dispatchEvent(new CustomEvent("server-selector-shake"));
			return;
		}
		// Annotation injection moved to FEApplet bridge.preCompletion hook
		// if (annotations.length === 0) return;
		// const lines = annotations.map((a, i) => `${i + 1}. "${a.selectedText}"\n   ${a.comment}`);
		// const fullText = (lines.join('\n\n') + (composerText.trim() ? '\n\n' + composerText : '')).trim();
		// aui.composer().setText(fullText);
		// clearAnnotations();
		if (!composerText.trim() && (pendingSlashCommands.length > 0 || annotations.length > 0)) {
			aui.composer().setText("<continue>");
		}
		aui.composer().send({ startRun: true });
	};

	return (
		<ComposerPrimitive.Root
			onSubmit={handleSubmit}
			className="aui-composer-root relative flex w-full flex-col"
		>
			{ttsIsSpeaking ? <TTSFlameWaveform /> : null}
			<ComposerPrimitive.AttachmentDropzone asChild>
				<div
					data-slot="composer-shell"
					className="flex w-full flex-col gap-2 rounded-xl border composer-gradient-border p-(--composer-padding) transition-shadow data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50"
					style={{
						background: "var(--wc-bg-elevated)",
						boxShadow: "0px 10px 10px 10px rgba(0,0,0,0.15)",
						"--composer-border-color": modeColor ?? "var(--wc-border-default)",
						color: "var(--wc-text-primary)",
					}}
				>
					<ComposerAttachments />
					<ComposerUiSpace />
					<ComposerEditor
						ref={editorRef}
						placeholder="Send a message, or type / to use slash-commands..."
						className="aui-composer-editor max-h-32 min-h-10 w-full overflow-y-auto bg-transparent px-1.75 py-1 text-sm"
						onChangeText={handleChangeText}
						onEnter={handleEnter}
						canSend={canSend}
					/>
					<ComposerAction onStreamChange={setWaveformStream} />
					{waveformStream ? (
						<VoiceWaveform stream={waveformStream} />
					) : (
						<ContextUsageBar />
					)}
				</div>
			</ComposerPrimitive.AttachmentDropzone>
		</ComposerPrimitive.Root>
	);
});

const ReasoningEffortToggle: FC = React.memo(() => {
	const { reasoningEffort, onReasoningEffortChange, enableThinking, onEnableThinkingChange } =
		useContext(ChatConfigContext);
	const levels: EReasoningEffort[] = [
		EReasoningEffort.LOW,
		EReasoningEffort.MEDIUM,
		EReasoningEffort.HIGH,
		EReasoningEffort.NONE,
	];
	const next = () => {
		const idx = levels.indexOf(reasoningEffort);
		const nextLevel = levels[(idx + 1) % levels.length]!;
		onReasoningEffortChange(nextLevel);
	};
	const isOn = enableThinking && reasoningEffort !== EReasoningEffort.NONE;
	const label = isOn ? reasoningEffort : "off";
	const color = isOn
		? reasoningEffort === EReasoningEffort.LOW
			? "var(--wc-accent-green)"
			: reasoningEffort === EReasoningEffort.MEDIUM
				? "var(--wc-accent-yellow-strong)"
				: "var(--wc-accent-red)"
		: "var(--wc-text-muted)";
	return (
		<IconButton
			variant="outline"
			size="sm"
			px="3"
			ml="1"
			borderRadius={"lg"}
			borderWidth="1px"
			borderColor={isOn ? color : "var(--wc-border-default)"}
			_hover={{ bg: "var(--wc-bg-hover)" }}
			color={color}
			onClick={next}
			fontSize="12px"
			textTransform={"capitalize"}
			className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors hover:bg-accent`}
			title={`Reasoning effort: ${label} (click to cycle)`}
		>
			Effort {label}
		</IconButton>
	);
});

const ToolsSelector: FC = React.memo(() => {
	const attachAllTools = useStore((s) => s.attachAllTools);
	const attachedTools = useStore((s) => s.attachedTools);
	const setAttachedTools = useStore((s) => s.setAttachedTools);
	const mcpServers = useStore((s) => s.mcpServers);
	const modes = useStore((s) => s.modes);
	const threadState = useStore((s) => s.getCurrentThreadState(s));

	const modeId = threadState?.modeId as string | undefined;
	const currentMode = modeId ? modes[modeId] : null;
	const isModeActive = !!currentMode;

	const connectedServers = useMemo(() => {
		const entries = Object.entries(mcpServers).filter(
			([, state]) => state.status === EMcpServerStatus.CONNECTED,
		);
		return entries as [
			string,
			{
				status: EMcpServerStatus;
				tools: { name: string; description: string; serverName: string }[];
			},
		][];
	}, [mcpServers]);

	const totalCount = useMemo(
		() => connectedServers.reduce((sum, [, s]) => sum + s.tools.length, 0),
		[connectedServers],
	);

	// Mode-active tools
	const modeToolSet = useMemo(() => {
		if (!isModeActive || !currentMode) return null;
		const s = new Set<string>();
		for (const t of currentMode.allowedTools) {
			if (typeof t === "string") continue;
			s.add(`${t.serverName}:${t.toolName}`);
		}
		return s;
	}, [isModeActive, currentMode]);

	const modeToolCount = modeToolSet ? modeToolSet.size : 0;

	const color = isModeActive
		? modeToolCount > 0
			? "var(--wc-accent-blue)"
			: "var(--wc-text-muted)"
		: attachAllTools || attachedTools.length > 0
			? "var(--wc-accent-blue)"
			: "var(--wc-text-muted)";
	const borderColor = isModeActive
		? modeToolCount > 0
			? "var(--wc-accent-blue)"
			: "var(--wc-border-default)"
		: attachAllTools || attachedTools.length > 0
			? "var(--wc-accent-blue)"
			: "var(--wc-border-default)";
	const label = isModeActive
		? modeToolCount > 0
			? `${modeToolCount} Tool(s)`
			: "Tools Off"
		: attachAllTools
			? "All Tools"
			: attachedTools.length > 0
				? `${attachedTools.length} Tools`
				: "Tools Off";

	const handleAllToolsChange = useCallback(
		(checked: boolean) => {
			if (isModeActive) return;
			if (checked) {
				setAttachedTools(true, []);
			} else {
				setAttachedTools(false, attachedTools);
			}
		},
		[attachedTools, isModeActive],
	);

	const handleToolChange = useCallback(
		async (serverName: string, toolName: string, checked: boolean) => {
			const tool: IToolAttachment = { serverName, toolName };
			if (isModeActive && currentMode) {
				// Update mode's allowedTools
				const currentTools = currentMode.allowedTools.filter(
					(t: any) => typeof t !== "string",
				) as IToolAttachment[];
				let next: IToolAttachment[];
				if (checked) {
					next = [...currentTools, tool];
				} else {
					next = currentTools.filter(
						(t) => !(t.serverName === serverName && t.toolName === toolName),
					);
				}
				try {
					const { updateMode } = await import("@/api/mode-services");
					await updateMode(currentMode.id, { allowedTools: next });
				} catch (e) {
					console.error("[ToolsSelector] Failed to update mode:", e);
				}
				return;
			}
			if (attachAllTools) return;
			let next: IToolAttachment[];
			if (checked) {
				next = [...attachedTools, tool];
			} else {
				next = attachedTools.filter(
					(t) => !(t.serverName === serverName && t.toolName === toolName),
				);
			}
			setAttachedTools(false, next);
		},
		[attachAllTools, attachedTools, isModeActive, currentMode],
	);

	return (
		<Popover.Root lazyMount unmountOnExit>
			<Popover.Trigger unstyled asChild>
				<IconButton
					variant="outline"
					size="sm"
					px="3"
					ml="1"
					borderRadius={"lg"}
					borderWidth="1px"
					borderColor={borderColor}
					_hover={{ bg: "var(--wc-bg-hover)" }}
					color={color}
					className="flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors hover:bg-accent"
					title={`Tools ${label}`}
				>
					<span style={{ fontSize: "12px" }}>{label}</span>
				</IconButton>
			</Popover.Trigger>
			<Popover.Positioner>
				<Popover.Content
					w="280px"
					maxH="70vh"
					overflow="auto"
					bg="var(--wc-bg-elevated)"
					borderWidth="1px"
					borderColor="var(--wc-border-overlay)"
					borderRadius="lg"
					shadow="0 8px 32px var(--wc-overlay-modal)"
				>
					<Popover.Body p="3">
						{totalCount === 0 ? (
							<Text
								fontSize="12px"
								color="var(--wc-text-faint)"
								textAlign="center"
								py="4"
							>
								No tools available
							</Text>
						) : (
							<VStack gap="3" align="stretch">
								{!isModeActive && (
									<HStack gap="2">
										<Switch.Root
											label="All tools"
											checked={attachAllTools}
											onCheckedChange={(details) =>
												handleAllToolsChange(details.checked)
											}
										>
											<Switch.HiddenInput />
											<Switch.Control
												css={{
													bg: attachAllTools
														? "var(--wc-accent-blue)"
														: "var(--wc-text-disabled)",
												}}
											>
												<Switch.Thumb
													css={{ bg: "var(--wc-bg-elevated)" }}
												/>
											</Switch.Control>
											<Switch.Label
												ml="2"
												fontSize="12px"
												color={
													attachAllTools
														? "var(--wc-accent-blue)"
														: "var(--wc-text-muted)"
												}
												userSelect="none"
											>
												All tools
											</Switch.Label>
										</Switch.Root>
									</HStack>
								)}
								<AccordionRoot collapsible defaultValue={[]}>
									{connectedServers.map(([serverName, state]) => {
										const activeCount = isModeActive
											? state.tools.filter((t) =>
													modeToolSet?.has(`${serverName}:${t.name}`),
												).length
											: attachedTools.filter(
													(t) => t.serverName === serverName,
												).length;
										return (
											<AccordionItemComp
												key={serverName}
												value={serverName}
												style={{ border: "none" }}
											>
												<AccordionItemTrigger
													style={{
														padding: "8px",
														borderRadius: "6px",
														background: "var(--wc-bg-card)",
														border: "none",
														cursor: "pointer",
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														width: "100%",
													}}
												>
													<Text
														fontSize="11px"
														fontWeight="600"
														color={
															activeCount
																? "var(--wc-accent-blue)"
																: "var(--wc-text-muted)"
														}
														textTransform="uppercase"
														letterSpacing="0.05em"
													>
														{serverName}
													</Text>
													<Text
														fontSize="10px"
														color={
															activeCount
																? "var(--wc-accent-blue)"
																: "var(--wc-text-faint)"
														}
													>
														{state.tools.length}
														{activeCount ? ` (${activeCount})` : ""}
													</Text>
												</AccordionItemTrigger>
												<AccordionItemContent
													pt="1"
													pb="2"
													px="2"
													style={{ border: "none" }}
												>
													<VStack gap="1.5" align="stretch">
														{state.tools.map((tool) => {
															const isSelected = isModeActive
																? !!modeToolSet?.has(
																		`${serverName}:${tool.name}`,
																	)
																: attachAllTools ||
																	attachedTools.some(
																		(t) =>
																			t.serverName ===
																				serverName &&
																			t.toolName ===
																				tool.name,
																	);
															return (
																<HStack
																	key={tool.name}
																	gap="2"
																	opacity={
																		(
																			isModeActive
																				? false
																				: attachAllTools
																		)
																			? 0.4
																			: 1
																	}
																>
																	<Switch.Root
																		label={tool.name}
																		checked={isSelected}
																		disabled={
																			!isModeActive &&
																			attachAllTools
																		}
																		onCheckedChange={(
																			details,
																		) => {
																			handleToolChange(
																				serverName,
																				tool.name,
																				details.checked,
																			);
																		}}
																	>
																		<Switch.HiddenInput />
																		<Switch.Control
																			css={{
																				bg: isSelected
																					? "var(--wc-accent-blue)"
																					: "var(--wc-text-disabled)",
																			}}
																		>
																			<Switch.Thumb
																				css={{
																					bg: "var(--wc-bg-elevated)",
																				}}
																			/>
																		</Switch.Control>
																		<Switch.Label
																			ml="0"
																			fontSize="12px"
																			color={
																				isSelected
																					? "var(--wc-text-primary)"
																					: "var(--wc-text-muted)"
																			}
																			userSelect="none"
																		>
																			{tool.name}
																		</Switch.Label>
																	</Switch.Root>
																</HStack>
															);
														})}
													</VStack>
												</AccordionItemContent>
											</AccordionItemComp>
										);
									})}
								</AccordionRoot>
							</VStack>
						)}
					</Popover.Body>
				</Popover.Content>
			</Popover.Positioner>
		</Popover.Root>
	);
});

const AgentSelector: FC = React.memo(() => {
	const agents = useStore((s) => s.agents);
	const setThreadState = useStore((s) => s.setThreadState);
	const currentThreadId = useStore((s) => s.currentThreadId);
	const modes = useStore((s) => s.modes);
	const threadState = useStore((s) => s.getCurrentThreadState(s));

	const modeId = threadState?.modeId as string | undefined;
	const currentMode = modeId ? modes[modeId] : null;
	const isModeActive = !!currentMode;

	const availableAgents = useMemo(
		() =>
			Object.values(agents) as Array<{
				id: string;
				name: string;
				tools: IToolAttachment[];
				description?: string;
			}>,
		[agents],
	);

	// Mode-active agents
	const modeAgentSet = useMemo(() => {
		if (!isModeActive || !currentMode) return null;
		return new Set(currentMode.allowedAgents || []);
	}, [isModeActive, currentMode]);

	// Thread-level agents (when no mode)
	const threadAgents = useMemo(
		() => (threadState?.activeAgents as string[]) || [],
		[threadState?.activeAgents],
	);

	const activeAgentSet = useMemo(() => {
		const validIds = new Set(availableAgents.map((a) => a.id));
		const raw = isModeActive && modeAgentSet ? modeAgentSet : new Set(threadAgents);
		// Drop ids that no longer exist (e.g. deleted agents)
		return new Set([...raw].filter((id) => validIds.has(id)));
	}, [isModeActive, modeAgentSet, threadAgents, availableAgents]);

	const activeAgentCount = activeAgentSet.size;

	const color = activeAgentCount > 0 ? "var(--wc-accent-blue)" : "var(--wc-text-muted)";
	const borderColor = activeAgentCount > 0 ? "var(--wc-accent-blue)" : "var(--wc-border-default)";
	const label = activeAgentCount > 0 ? `${activeAgentCount} Agent(s)` : "Agents Off";

	const handleAgentToggle = useCallback(
		async (agentId: string, checked: boolean) => {
			// Reconstruct from live agents so deleted agent ids are dropped
			const validIds = new Set(availableAgents.map((a) => a.id));
			if (isModeActive && currentMode) {
				const currentAgents = (currentMode.allowedAgents || []).filter((id) =>
					validIds.has(id),
				);
				let next: string[];
				if (checked) {
					next = [...currentAgents, agentId];
				} else {
					next = currentAgents.filter((n) => n !== agentId);
				}
				try {
					const { updateMode } = await import("@/api/mode-services");
					await updateMode(currentMode.id, { allowedAgents: next });
				} catch (e) {
					console.error("[AgentSelector] Failed to update mode:", e);
				}
				return;
			}
			// No mode — save to thread state
			const current = threadAgents.filter((id) => validIds.has(id));
			let next: string[];
			if (checked) {
				next = [...current, agentId];
			} else {
				next = current.filter((n) => n !== agentId);
			}
			setThreadState(currentThreadId, { activeAgents: next });
		},
		[isModeActive, currentMode, threadAgents, currentThreadId, setThreadState, availableAgents],
	);

	return (
		<Popover.Root lazyMount unmountOnExit>
			<Popover.Trigger unstyled asChild>
				<IconButton
					variant="outline"
					size="sm"
					px="3"
					ml="1"
					borderRadius="lg"
					borderWidth="1px"
					borderColor={borderColor}
					_hover={{ bg: "var(--wc-bg-hover)" }}
					color={color}
					className="flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors hover:bg-accent"
					title={`Agents ${label}`}
				>
					<span style={{ fontSize: "12px" }}>{label}</span>
				</IconButton>
			</Popover.Trigger>
			<Popover.Positioner>
				<Popover.Content
					w="280px"
					maxH="70vh"
					overflow="auto"
					bg="var(--wc-bg-elevated)"
					borderWidth="1px"
					borderColor="var(--wc-border-overlay)"
					borderRadius="lg"
					shadow="0 8px 32px var(--wc-overlay-modal)"
				>
					<Popover.Body p="3">
						{availableAgents.length === 0 ? (
							<Text
								fontSize="12px"
								color="var(--wc-text-faint)"
								textAlign="center"
								py="4"
							>
								No agents available
							</Text>
						) : (
							<VStack gap="2" align="stretch">
								{availableAgents.map((agent) => {
									const isSelected = activeAgentSet.has(agent.id);
									const toolCount = agent.tools?.length ?? 0;
									return (
										<Box
											key={agent.id}
											display="flex"
											flexDirection="column"
											gap="1"
											p="2"
											borderRadius="md"
											cursor="pointer"
											bg={
												isSelected ? "var(--wc-bg-selected)" : "transparent"
											}
											_hover={{
												bg: isSelected
													? "var(--wc-bg-selected)"
													: "var(--wc-bg-card)",
											}}
											onClick={() => handleAgentToggle(agent.id, !isSelected)}
										>
											<Box display="flex" alignItems="center" gap="1.5">
												{isSelected && (
													<CheckIcon
														size={12}
														color="var(--wc-accent-green)"
													/>
												)}
												{!isSelected && (
													<Bot
														size={13}
														color="var(--wc-text-muted)"
														flexShrink={0}
													/>
												)}
												<Text
													fontWeight="600"
													fontSize="sm"
													flex="1"
													minW="0"
												>
													{agent.name}
												</Text>
												<Box
													display="flex"
													alignItems="center"
													gap="1"
													fontSize="9px"
													color="var(--wc-text-muted)"
													bg="var(--wc-bg-subtle)"
													borderRadius="sm"
													px="1.5"
													py="0.5"
													flexShrink={0}
												>
													<Wrench size={9} />
													{toolCount} tool{toolCount === 1 ? "" : "s"}
												</Box>
											</Box>
											{agent.description && (
												<Text
													fontSize="12px"
													color="var(--wc-text-faint)"
													lineHeight="1.3"
													maxH="2.6em"
													overflow="hidden"
													pl={isSelected ? "4" : "5"}
												>
													{agent.description}
												</Text>
											)}
										</Box>
									);
								})}
							</VStack>
						)}
					</Popover.Body>
				</Popover.Content>
			</Popover.Positioner>
		</Popover.Root>
	);
});

const ComposerAction: FC<{ onStreamChange?: (stream: MediaStream | null) => void }> = React.memo(
	({ onStreamChange }) => {
		const { isValidServer, supportsMultiModal } = useContext(ServerStatusContext);
		const currentThreadId = useStore((s) => s.currentThreadId);
		const canAttach = isValidServer && supportsMultiModal;
		const aui = useAui();
		const annotations = useStore((s) => s.annotations);
		const clearAnnotations = useStore((s) => s.clearAnnotations);
		const composerDisabled = useAuiState((s) => s.composer.isEmpty || !s.composer.isEditing);
		const composerText = useAuiState((s) => s.composer.text);
		const pendingSlashCommands = useStore((s) => s.pendingSlashCommands);
		const isSendDisabled =
			composerDisabled && annotations.length === 0 && pendingSlashCommands.length === 0;

		const handleSend = useCallback(() => {
			if (isSendDisabled) return;
			// Annotation injection moved to FEApplet bridge.preCompletion hook
			// if (annotations.length > 0) {
			// 	const lines = annotations.map((a, i) => `${i + 1}. "${a.selectedText}"\n   ${a.comment}`);
			// 	const fullText = (lines.join('\n\n') + (composerText.trim() ? '\n\n' + composerText : '')).trim();
			// 	aui.composer().setText(fullText);
			// 	clearAnnotations();
			// }
			if (
				!composerText.trim() &&
				(pendingSlashCommands.length > 0 || annotations.length > 0)
			) {
				aui.composer().setText("<continue>");
			}
			aui.composer().send({ startRun: true });
		}, [
			isSendDisabled,
			annotations,
			composerText,
			clearAnnotations,
			pendingSlashCommands.length,
		]);

		return (
			<div className="aui-composer-action-wrapper relative flex items-center justify-between">
				<div className="flex items-center gap-1">
					<ComposerAddAttachment
						disabled={!canAttach}
						tooltip={canAttach ? "Add Attachment" : "Multimodal not supported"}
					/>
					<ReasoningEffortToggle />
					{/* <ToolsToggle /> */}
					<ToolsSelector />
					<AgentSelector />
					<EmbeddingToggle />
				</div>
				<div className="flex items-center gap-2">
					<VoiceInput
						threadId={currentThreadId}
						onTranscript={(text) => {
							insertComposerText(text);
						}}
						aui={aui}
						onStreamChange={onStreamChange}
					/>
					<ThreadWhisperServerSelector />
					<ThreadServerSelector threadId={currentThreadId} />
					<AuiIf condition={(s) => !s.thread.isRunning}>
						<TooltipIconButton
							onClick={handleSend}
							disabled={!isValidServer || isSendDisabled}
							tooltip={
								!isValidServer ? "Select and start a model first" : "Send message"
							}
							side="bottom"
							type="button"
							variant="outline"
							className={`${!isValidServer || isSendDisabled ? "opacity-50 cursor-not-allowed" : ""} aui-composer-send size-9`}
							aria-label={
								!isValidServer
									? "Send message - model not selected"
									: "Send message"
							}
							style={
								!isValidServer
									? {
											color: "var(--wc-text-muted)",
											borderColor: "var(--wc-border-default)",
											backgroundColor: "transparent",
										}
									: {
											color: "var(--wc-accent-blue)",
											borderColor: "var(--wc-accent-blue-border)",
											backgroundColor: "var(--wc-accent-blue-bg-8)",
										}
							}
							_hover={
								!isValidServer
									? undefined
									: {
											color: "var(--wc-accent-blue-hover)",
											borderColor: "var(--wc-accent-blue-border)",
											backgroundColor: "var(--wc-accent-blue-bg-10)",
										}
							}
						>
							<SendHorizonal className="aui-composer-send-icon size-4" />
						</TooltipIconButton>
					</AuiIf>
					<AuiIf condition={(s) => s.thread.isRunning}>
						<ComposerPrimitive.Cancel asChild>
							<Button
								type="button"
								variant="outline"
								className="aui-composer-cancel size-9"
								aria-label="Stop generating"
								color="var(--wc-text-primary)"
								borderColor="var(--wc-border-default)"
								style={{ borderColor: "var(--wc-border-default)" }}
							>
								<SquareIcon className="aui-composer-cancel-icon size-4 fill-current" />
							</Button>
						</ComposerPrimitive.Cancel>
					</AuiIf>
				</div>
			</div>
		);
	},
);

const MessageError: FC = () => {
	return (
		<MessagePrimitive.Error>
			<ErrorPrimitive.Root
				className="aui-message-error-root mt-2 rounded-md border p-3 text-sm"
				style={{
					borderColor: "var(--wc-accent-red)",
					backgroundColor: "var(--wc-accent-red-bg-8)",
					color: "var(--wc-accent-red)",
				}}
			>
				<ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
			</ErrorPrimitive.Root>
		</MessagePrimitive.Error>
	);
};

const StatsTooltip = React.memo((): React.ReactNode => {
	const custom = useAuiState((s) => (s.message.metadata as any)?.custom);
	if (!custom) return null;

	const { promptPerSecond, predictedPerSecond, predictedMs, actualTokens, finishReason } = custom;

	const stats = useMemo(() => {
		const arr: { label: string; value: string }[] = [];
		if (promptPerSecond > 0)
			arr.push({ label: "pp", value: `${promptPerSecond.toFixed(1)} t/s` });
		if (predictedPerSecond > 0)
			arr.push({ label: "tg", value: `${predictedPerSecond.toFixed(1)} t/s` });
		if (actualTokens != null && actualTokens > 0)
			arr.push({ label: "c", value: `${actualTokens} tks` });
		if (predictedMs > 0)
			arr.push({ label: "tt", value: `${(predictedMs / 1000).toFixed(1)} s` });
		if (finishReason) arr.push({ label: "fr", value: finishReason });
		return arr;
	}, [promptPerSecond, predictedPerSecond, actualTokens, predictedMs, finishReason]);

	if (stats.length === 0) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className="cursor-help p-1 rounded hover:bg-muted/50 transition-colors"
					style={{ margin: "0 8px 0 0" }}
				>
					<Timer size={16} style={{ color: "var(--wc-text-muted)" }} />
				</div>
			</TooltipTrigger>
			<TooltipContent align="start" sideOffset={4} side="bottom">
				<div
					className="text-sm"
					style={{ color: "var(--wc-special-white)", boxShadow: "0 0 10px black" }}
				>
					{stats.map((s) => (
						<span key={s.label}>
							<span style={{ color: "var(--wc-text-muted)" }}>{s.label}</span>&nbsp;
							{s.value}&nbsp;&nbsp;
						</span>
					))}
				</div>
			</TooltipContent>
		</Tooltip>
	);
});

const EmbeddingStatus: FC = React.memo(() => {
	const messageId = useAuiState((s) => s.message.id);
	const embedded = useStore((s) => s.embeddingStatusByMessage[messageId]);
	const selectedServerId = useStore((s) => s.selectedEmbeddingServerId);
	const servers = useStore((s) => s.servers);
	const applyEmbeddingEmbedded = useStore((s) => s.applyEmbeddingEmbedded);
	const removeEmbeddingStatus = useStore((s) => s.removeEmbeddingStatus);
	const [loading, setLoading] = useState(false);
	const selectedServer = selectedServerId ? servers[selectedServerId] : null;

	const handleClick = useCallback(async () => {
		if (!selectedServer || loading) return;
		setLoading(true);
		try {
			if (embedded) {
				const res = await fetch(
					`/api/chat/messages/${messageId}/embed?serverId=${encodeURIComponent(selectedServer.id)}&topic=global`,
					{ method: "DELETE" },
				);
				if (res.ok) removeEmbeddingStatus(messageId);
			} else {
				const res = await fetch(
					`/api/chat/messages/${messageId}/embed?serverId=${encodeURIComponent(selectedServer.id)}&topic=global`,
					{ method: "POST" },
				);
				if (res.ok) applyEmbeddingEmbedded(messageId);
			}
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, [
		messageId,
		embedded,
		selectedServer,
		loading,
		applyEmbeddingEmbedded,
		removeEmbeddingStatus,
	]);

	if (!selectedServer || selectedServer.status !== EServerStatus.RUNNING) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className="cursor-pointer p-1 rounded hover:bg-muted/50 transition-colors"
					style={{ margin: "0 8px 0 0", opacity: loading ? 0.5 : 1 }}
					onClick={handleClick}
				>
					<LuDatabaseZap
						size={16}
						style={{
							color: embedded ? "var(--wc-accent-purple)" : "var(--wc-text-muted)",
						}}
					/>
				</div>
			</TooltipTrigger>
			<TooltipContent align="start" sideOffset={4} side="bottom">
				<div
					className="text-sm"
					style={{ color: "var(--wc-special-white)", boxShadow: "0 0 10px black" }}
				>
					<span>{embedded ? "Embedded (click to remove)" : "Embed message"}</span>
				</div>
			</TooltipContent>
		</Tooltip>
	);
});

const ToolCallRenderer: FC = React.memo(() => {
	const part = useAuiState((s) => s.part);
	const messageId = useAuiState((s) => s.message.id);

	return (
		<ToolCallBlockCollapsible
			toolCallId={(part as any).toolCallId}
			toolName={(part as any).toolName}
			serverName={(part as any).serverName ?? "unknown"}
			args={(part as any).args}
			result={(part as any).result}
			status={mapStatusFromPart((part as any).status)}
			messageId={messageId}
		/>
	);
});

function mapStatusFromPart(status: any): "complete" | "running" | "requires-action" | "error" {
	if (!status) return "complete";
	if (status.type === "complete") return "complete";
	if (status.type === "running") return "running";
	if (status.type === "requires-action") return "requires-action";
	if (status.type === "incomplete") return "error";
	return "complete";
}

const LoadingDot: FC<{ status: { type: string } }> = React.memo(({ status }) => {
	if (status?.type !== "running") return null;
	return (
		<div className="flex items-center py-1">
			<div className="size-2 rounded-full bg-white/80 animate-pulse" />
		</div>
	);
});

const componentsMap = {
	Text: () => <MarkdownText />,
	Reasoning: () => <ReasoningBlock />,
	Empty: LoadingDot,
	tools: {
		Fallback: ToolCallRenderer,
	},
};

const AssistantMessage: FC = React.memo(() => {
	const parts = useAuiState((s) => s.message.content);
	const status = useAuiState((s) => s.message.status?.type);
	const messageId = useAuiState((s) => s.message.id);
	const startingTools = useStore((s) => s.startingToolsByMessage[messageId]);
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
	const chatFontFamily = useStore((s) => s.settings.chatFontFamily ?? "");
	// Skip rendering empty assistant messages (converted TOOL messages)
	// BUT render if status is "running" so the loading indicator appears during prompt processing
	if (parts.length === 0 && status !== "running") return null;

	return (
		<MessagePrimitive.Root
			className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full animate-in py-3 duration-150"
			data-role="assistant"
			data-message-id={messageId}
			style={{
				paddingRight: "100px",
			}}
		>
			<MessageUiSpace>
				<div
					className="aui-assistant-message-content wrap-break-word px-2 leading-relaxed"
					style={{
						color: "var(--wc-text-primary)",
						fontSize: `${chatFontSize}px`,
						fontFamily: chatFontFamily || undefined,
						padding: "15px 0 5px 15px",
						borderRadius: "15px",
					}}
				>
					<MessagePrimitive.Parts components={componentsMap} />
					{startingTools && startingTools.length > 0 && (
						<div
							className="mt-2 text-md italic"
							style={{ color: "var(--wc-text-tertiary)" }}
						>
							calling: {startingTools.join(", ")}...
						</div>
					)}
					<MessageError />
				</div>
			</MessageUiSpace>

			<div className="aui-assistant-message-footer mt-1 ml-2 flex min-h-6 items-center gap-1">
				<StatsTooltip />
				<BranchPicker />
				<AssistantActionBar />
			</div>
		</MessagePrimitive.Root>
	);
});

const ReasoningBlock: FC = React.memo(() => {
	const reasoning = useAuiState((s) => {
		const part = s.part;
		return part?.type === "reasoning" ? (part as any).reasoning : "";
	});
	const running = useAuiState((s) => {
		const part = s.part;
		return part?.type === "reasoning" ? (part as any).status?.type === "running" : false;
	});
	const [open, setOpen] = useState(false);
	if (!reasoning) return null;
	return (
		<div className={`wc-reasoning mb-1${open ? " wc-reasoning--open" : ""}`}>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="wc-reasoning__trigger"
				style={{ fontSize: "var(--chat-font-size)" }}
			>
				<ChevronDownIcon className="wc-reasoning__chevron size-3.5" />
				<span className={running ? "wc-reasoning__label--live" : undefined}>
					{running ? "Thinking" : `Thought`}{" "}
					{`${reasoning.length > 100 ? ` (${Math.ceil(reasoning.length / 4)} tks)` : ""}`}
				</span>
				{running && (
					<span className="wc-reasoning__dots">
						<span className="wc-reasoning__dot" />
						<span className="wc-reasoning__dot" />
						<span className="wc-reasoning__dot" />
					</span>
				)}
			</button>
			<div
				className="wc-reasoning__body"
				style={{ color: "var(--wc-text-secondary)", fontSize: "var(--chat-font-size)" }}
			>
				{reasoning}
			</div>
		</div>
	);
});

const ActionBarIcon: FC<{ children: React.ReactNode; onClick?: () => void }> = ({
	children,
	onClick,
}) => (
	<Box
		w="28px"
		h="28px"
		display="flex"
		alignItems="center"
		justifyContent="center"
		cursor="pointer"
		rounded="md"
		color="var(--wc-text-secondary)"
		_hover={{ bg: "var(--wc-bg-selected)", color: "var(--wc-text-heading)" }}
		onClick={onClick}
	>
		{children}
	</Box>
);

const DeleteMessageButton: FC<{ messageId: string }> = ({ messageId }) => {
	const ctx = useContext(DeleteMessageContext);
	return (
		<HStack gap="2" onClick={() => ctx?.open(messageId)}>
			<Trash2 size={14} color="var(--wc-accent-red)" />
			<Text fontSize="12px" color="var(--wc-accent-red)">
				Delete
			</Text>
		</HStack>
	);
};

const BrowserTTS = React.memo(() => {
	const [speaking, setSpeaking] = useState(false);
	const parts = useAuiState((s) => s.message.content);
	const messageText = useMemo(() => {
		if (!parts || parts.length === 0) return "";
		return parts
			.filter((p: any) => p.type === "text")
			.map((p: any) => p.text)
			.join("\n\n");
	}, [parts]);

	const handleSpeak = useCallback(() => {
		if (speaking) {
			window.speechSynthesis.cancel();
			setSpeaking(false);
			return;
		}
		if (!messageText.trim()) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(messageText);
		utterance.onend = () => setSpeaking(false);
		utterance.onerror = () => setSpeaking(false);
		setSpeaking(true);
		window.speechSynthesis.speak(utterance);
	}, [speaking, messageText]);

	return (
		<ActionBarIcon onClick={handleSpeak}>
			{speaking ? <SquareIcon size={14} /> : <Volume2 size={14} />}
		</ActionBarIcon>
	);
});

const AssistantActionBar: FC = React.memo(() => {
	const messageId = useAuiState((s) => s.message.id);
	const isCopied = useAuiState((s) => s.message.isCopied);
	const kokoroInstalled = useStore((s) => s.kokoroStatus?.installed);
	const clearAnnotations = useStore((s) => s.clearAnnotations);

	const ref = useRef<HTMLDivElement | null>(null);
	const getAnchorRect = () => ref.current!.getBoundingClientRect();

	return (
		<ActionBarPrimitive.Root
			className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1"
			style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "visible" }}
		>
			{kokoroInstalled ? <KokoroTTSButton /> : <BrowserTTS />}
			<EmbeddingStatus />
			<MessageFooterUiSpace />

			<Menu.Root positioning={{ getAnchorRect }}>
				<Menu.Trigger asChild>
					<ActionBarIcon>
						<MoreVertical size={14} ref={ref} />
					</ActionBarIcon>
				</Menu.Trigger>
				<Menu.Positioner>
					<Menu.Content>
						<ActionBarPrimitive.Reload asChild>
							<Menu.Item value="reload" onClick={clearAnnotations}>
								<HStack gap="2">
									<RefreshCwIcon size={14} />
									<Text fontSize="12px">Reload</Text>
								</HStack>
							</Menu.Item>
						</ActionBarPrimitive.Reload>
						<Menu.Separator />
						<ActionBarPrimitive.Copy asChild>
							<Menu.Item value="copy">
								<HStack gap="2">
									{isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
									<Text fontSize="12px">Copy</Text>
								</HStack>
							</Menu.Item>
						</ActionBarPrimitive.Copy>
						<ActionBarPrimitive.Edit asChild>
							<Menu.Item value="edit">
								<HStack gap="2">
									<PencilIcon size={14} />
									<Text fontSize="12px">Edit</Text>
								</HStack>
							</Menu.Item>
						</ActionBarPrimitive.Edit>
						<Menu.Separator />
						<Menu.Item value="delete">
							<DeleteMessageButton messageId={messageId} />
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Menu.Root>
		</ActionBarPrimitive.Root>
	);
});

const ToolMessage: FC = React.memo(() => {
	const parts = useAuiState((s) => s.message.content);
	const status = useAuiState((s) => s.message.status?.type);
	const messageId = useAuiState((s) => s.message.id);
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
	const chatFontFamily = useStore((s) => s.settings.chatFontFamily ?? "");
	if (parts.length === 0 && status !== "running") return null;

	return (
		<MessagePrimitive.Root
			className="aui-tool-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full animate-in py-3 duration-150"
			data-role="tool"
			data-message-id={messageId}
			style={{
				paddingRight: "100px",
			}}
		>
			<MessageUiSpace>
				<div
					className="aui-tool-message-content wrap-break-word px-2 leading-relaxed"
					style={{
						color: "var(--wc-text-primary)",
						fontSize: `${chatFontSize}px`,
						fontFamily: chatFontFamily || undefined,
						padding: "5px 15px 5px 15px",
						borderRadius: "15px",
						display: "flex",
						flexDirection: "column",
						gap: "5px",
					}}
				>
					<MessagePrimitive.Parts components={componentsMap} />
					<MessageError />
				</div>
			</MessageUiSpace>

			<div className="aui-tool-message-footer ml-2 flex min-h-6 items-center gap-1">
				<StatsTooltip />
				<BranchPicker />
				<ToolActionBar />
			</div>
		</MessagePrimitive.Root>
	);
});

const ToolActionBar: FC = React.memo(() => {
	const messageId = useAuiState((s) => s.message.id);
	const clearAnnotations = useStore((s) => s.clearAnnotations);

	const ref = useRef<HTMLDivElement | null>(null);
	const getAnchorRect = () => ref.current!.getBoundingClientRect();

	return (
		<ActionBarPrimitive.Root
			className="aui-tool-action-bar-root col-start-3 row-start-2 -ml-1"
			style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "visible" }}
		>
			<EmbeddingStatus />
			<MessageFooterUiSpace />

			<Menu.Root positioning={{ getAnchorRect }}>
				<Menu.Trigger asChild>
					<ActionBarIcon>
						<MoreVertical size={14} ref={ref} />
					</ActionBarIcon>
				</Menu.Trigger>
				<Menu.Positioner>
					<Menu.Content>
						<ActionBarPrimitive.Reload asChild>
							<Menu.Item value="reload" onClick={clearAnnotations}>
								<HStack gap="2">
									<RefreshCwIcon size={14} />
									<Text fontSize="12px">Reload</Text>
								</HStack>
							</Menu.Item>
						</ActionBarPrimitive.Reload>
						<Menu.Separator />
						<Menu.Item value="delete">
							<DeleteMessageButton messageId={messageId} />
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Menu.Root>
		</ActionBarPrimitive.Root>
	);
});

const MessageSlashCommands: FC = React.memo(() => {
	const messageId = useAuiState((s) => s.message.id);
	const messageState = useStore((s) => s.messageStates[messageId]);
	const slashCommands = messageState?.slashCommands as IExtractedSlashCommand[] | undefined;
	if (!slashCommands?.length) return null;

	return (
		<div
			className="flex flex-wrap gap-1.5 mt-2 pt-2"
			style={{ borderTop: "1px solid var(--wc-border-subtle)" }}
		>
			{slashCommands.map((cmd, i) => (
				<span
					key={i}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "4px",
						borderRadius: "6px",
						padding: "2px 6px",
						fontSize: "0.8125rem",
						fontWeight: 500,
						lineHeight: "1.4",
						background: "var(--wc-accent-purple-bg-15, rgba(167,139,250,0.15))",
						border: "1px solid var(--wc-accent-purple-border, rgba(167,139,250,0.25))",
						color: "var(--wc-text-primary)",
					}}
				>
					<span style={{ fontWeight: 700 }}>/{cmd.name}</span>
					{Object.keys(cmd.params).length > 0 && (
						<span style={{ color: "var(--wc-text-secondary)" }}>
							{Object.entries(cmd.params)
								.map(([k, v]) => `${k}=${v}`)
								.join(" ")}
						</span>
					)}
				</span>
			))}
		</div>
	);
});

const UserMessage: FC = React.memo(() => {
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
	const chatFontFamily = useStore((s) => s.settings.chatFontFamily ?? "");
	const messageId = useAuiState((s) => s.message.id);
	return (
		<MessagePrimitive.Root
			className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto flex w-full flex-col gap-2 animate-in px-2 py-3 duration-150"
			data-role="user"
			data-message-id={messageId}
		>
			<UserMessageAttachments />
			<MessageUiSpace>
				<div className="flex justify-end">
					<div
						className="aui-user-message-content wrap-break-word peer rounded-2xl bg-muted px-4 py-2.5 text-foreground empty:hidden max-w-[80%]"
						style={{
							fontSize: `${chatFontSize}px`,
							fontFamily: chatFontFamily || undefined,
							background: "var(--wc-bg-active)",
							color: "var(--wc-text-primary)",
						}}
					>
						<MessagePrimitive.Parts />
						<MessageSlashCommands />
					</div>
				</div>
			</MessageUiSpace>
			<div className="aui-user-message-footer flex min-h-6 items-center justify-end">
				<StatsTooltip />
				<UserActionBar />
				<BranchPicker className="aui-user-branch-picker" />
			</div>
		</MessagePrimitive.Root>
	);
});

const UserActionBar: FC = React.memo(() => {
	const messageId = useAuiState((s) => s.message.id);
	const kokoroInstalled = useStore((s) => s.kokoroStatus?.installed);

	const ref = useRef<HTMLDivElement | null>(null);
	const getAnchorRect = () => ref.current!.getBoundingClientRect();

	return (
		<ActionBarPrimitive.Root
			className="aui-user-action-bar-root"
			style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "visible" }}
		>
			{kokoroInstalled ? <KokoroTTSButton /> : <BrowserTTS />}
			<EmbeddingStatus />
			<MessageFooterUiSpace />

			<Menu.Root positioning={{ getAnchorRect }}>
				<Menu.Trigger asChild>
					<ActionBarIcon>
						<MoreVertical size={14} ref={ref} />
					</ActionBarIcon>
				</Menu.Trigger>
				<Menu.Positioner>
					<Menu.Content>
						<ActionBarPrimitive.Edit asChild>
							<Menu.Item value="edit">
								<HStack gap="2">
									<PencilIcon size={14} />
									<Text fontSize="12px">Edit</Text>
								</HStack>
							</Menu.Item>
						</ActionBarPrimitive.Edit>
						<Menu.Separator />
						<Menu.Item value="delete">
							<DeleteMessageButton messageId={messageId} />
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Menu.Root>
		</ActionBarPrimitive.Root>
	);
});

const EditComposer: FC = () => {
	return (
		<MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full flex-col px-2 py-3">
			<ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col bg-muted">
				<ComposerPrimitive.Input
					className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none rounded-sm"
					autoFocus
				/>
				<div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
					<ComposerPrimitive.Cancel asChild>
						<Button variant="ghost" size="sm">
							Cancel
						</Button>
					</ComposerPrimitive.Cancel>
					<ComposerPrimitive.Send asChild>
						<Button size="sm">Update</Button>
					</ComposerPrimitive.Send>
				</div>
			</ComposerPrimitive.Root>
		</MessagePrimitive.Root>
	);
};

// const BranchPickerWrapper: FC = () => {
// 	const { isValidServer } = useContext(ServerStatusContext);
// 	if (!isValidServer) return null;
// 	return <BranchPicker />;
// };

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = React.memo(({ className, ...rest }) => {
	return (
		<BranchPickerPrimitive.Root
			hideWhenSingleBranch
			className={cn(
				"aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
				className,
			)}
			{...rest}
		>
			<BranchPickerPrimitive.Previous asChild>
				<TooltipIconButton tooltip="Previous">
					<ChevronLeftIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Previous>
			<span className="aui-branch-picker-state font-medium">
				<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
			</span>
			<BranchPickerPrimitive.Next asChild>
				<TooltipIconButton tooltip="Next">
					<ChevronRightIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Next>
		</BranchPickerPrimitive.Root>
	);
});
