import { Box, Flex } from "@chakra-ui/react";
import type { IChatInferenceParams, IChatPreset } from "@warpcore/shared";
import { ChevronRight, Bot, FileText, Plug, SearchIcon } from "lucide-react";
import React, { useEffect } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { LuListTodo, LuSlidersHorizontal } from "react-icons/lu";
import { TbApps } from "react-icons/tb";
import { TiFlowSwitch } from "react-icons/ti";
import { useStore } from "@/store";
import { EChatSidebarTab } from "@/store/slices/chatSidebar";
import { EUISpaceLoc } from "@/store/slices/uiSpaces";
import { ChatConfigContentPanel } from "./ChatConfigSidebar";
import { ChatGuardrailsContentPanel } from "./ChatGuardrailsPanel";
import { ChatModesContentPanel } from "./ChatModesPanel";
import { ChatPromptsContentPanel } from "./ChatPromptsPanel";
import { ChatAgentsContentPanel } from "./ChatAgentsPanel";
import { ChatTodosContentPanel } from "./ChatTodosPanel";
import { ChatToolsContentPanel } from "./ChatToolsSidebar";
import { ThreadSearchPanel } from "./ThreadSearchPanel";
import { UiSpacePanel } from "./ui-space/UiSpacePanel";

interface IChatSidebarProps {
	configParams: IChatInferenceParams;
	configSystemPrompt: string;
	configSelectedPresetId: string | null;
	onConfigParamsChange: (params: IChatInferenceParams) => void;
	onConfigSystemPromptChange: (prompt: string) => void;
	onConfigPresetSelect: (presetId: string | null, preset: IChatPreset | null) => void;
}

export const ChatSidebar = React.memo(
	({
		configParams,
		configSystemPrompt,
		configSelectedPresetId,
		onConfigParamsChange,
		onConfigSystemPromptChange,
		onConfigPresetSelect,
	}: IChatSidebarProps) => {
		const chatSidebarOpen = useStore((s) => s.chatSidebarOpen);
		const chatSidebarTab = useStore((s) => s.chatSidebarTab);
		const setChatSidebarOpen = useStore((s) => s.setChatSidebarOpen);
		const openChatSidebarTab = useStore((s) => s.openChatSidebarTab);
		const currentThreadId = useStore((s) => s.currentThreadId);
		const rightPanelComponents = useStore(
			(s) => s.uiSpaceComponentsByLocation[EUISpaceLoc.RIGHT_PANEL],
		);

		// ESC to close sidebar when in search mode
		useEffect(() => {
			if (!chatSidebarOpen || chatSidebarTab !== EChatSidebarTab.SEARCH) return;
			const handler = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					e.preventDefault();
					setChatSidebarOpen(false);
				}
			};
			document.addEventListener("keydown", handler);
			return () => document.removeEventListener("keydown", handler);
		}, [chatSidebarOpen, chatSidebarTab, setChatSidebarOpen]);

		const toggleTab = (tab: EChatSidebarTab) => {
			if (chatSidebarTab === tab && chatSidebarOpen) {
				setChatSidebarOpen(false);
			} else {
				openChatSidebarTab(tab);
			}
		};

		return (
			<Flex
				direction="row"
				h="100%"
				borderLeftWidth="1px"
				borderColor="var(--wc-border-subtle)"
			>
				{/* Content panel (conditional) */}
				{chatSidebarOpen && (
					<Box
						w="300px"
						overflowY="auto"
						css={{
							"&::-webkit-scrollbar": { width: "4px" },
							"&::-webkit-scrollbar-thumb": {
								background: "var(--wc-text-disabled)",
								borderRadius: "2px",
							},
						}}
					>
						{(() => {
							if (chatSidebarTab === EChatSidebarTab.CONFIG)
								return (
									<ChatConfigContentPanel
										params={configParams}
										systemPrompt={configSystemPrompt}
										selectedPresetId={configSelectedPresetId}
										onParamsChange={onConfigParamsChange}
										onSystemPromptChange={onConfigSystemPromptChange}
										onPresetSelect={onConfigPresetSelect}
									/>
								);
							if (chatSidebarTab === EChatSidebarTab.TOOLS)
								return <ChatToolsContentPanel threadId={currentThreadId} />;
							if (chatSidebarTab === EChatSidebarTab.SEARCH)
								return <ThreadSearchPanel threadId={currentThreadId} />;
							if (chatSidebarTab === EChatSidebarTab.RIGHT_PANEL)
								return <UiSpacePanel location={EUISpaceLoc.RIGHT_PANEL} />;
							if (chatSidebarTab === EChatSidebarTab.GUARDRAILS_PANEL)
								return <ChatGuardrailsContentPanel />;
							if (chatSidebarTab === EChatSidebarTab.TODOS_PANEL)
								return <ChatTodosContentPanel />;
							if (chatSidebarTab === EChatSidebarTab.MODES_PANEL)
								return <ChatModesContentPanel />;
							if (chatSidebarTab === EChatSidebarTab.PROMPTS_PANEL)
								return <ChatPromptsContentPanel />;
							if (chatSidebarTab === EChatSidebarTab.AGENTS_PANEL)
								return <ChatAgentsContentPanel />;
							return null;
						})()}
					</Box>
				)}

				{/* Tab strip (always visible on right edge) */}
				<Flex
					w="60px"
					borderLeftWidth="1px"
					borderColor="var(--wc-border-subtle)"
					flexDirection="column"
					alignItems="center"
					pt="2"
				>
					{/* Search tab */}
					<Flex
						onClick={() => toggleTab(EChatSidebarTab.SEARCH)}
						px="3"
						py="2.5"
						borderRadius="lg"
						title="Search in Chat"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.SEARCH && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.SEARCH && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<SearchIcon
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.SEARCH && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Applets tab */}
					{rightPanelComponents && Object.keys(rightPanelComponents).length > 0 && (
						<Flex
							mt="1"
							onClick={() => toggleTab(EChatSidebarTab.RIGHT_PANEL)}
							px="3"
							py="2.5"
							title="Applets"
							borderRadius="lg"
							cursor="pointer"
							transition="all 0.15s"
							bg={
								chatSidebarTab === EChatSidebarTab.RIGHT_PANEL && chatSidebarOpen
									? "var(--wc-bg-card)"
									: "transparent"
							}
							borderWidth="1px"
							borderColor={
								chatSidebarTab === EChatSidebarTab.RIGHT_PANEL && chatSidebarOpen
									? "var(--wc-border-default)"
									: "transparent"
							}
							_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
						>
							<TbApps
								size={18}
								color={
									chatSidebarTab === EChatSidebarTab.RIGHT_PANEL &&
									chatSidebarOpen
										? "var(--wc-text-primary)"
										: "var(--wc-text-muted)"
								}
							/>
						</Flex>
					)}

					{/* Guardrails tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.GUARDRAILS_PANEL)}
						px="3"
						py="2.5"
						borderRadius="lg"
						title="Guardrails"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.GUARDRAILS_PANEL && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.GUARDRAILS_PANEL && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<FaShieldAlt
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.GUARDRAILS_PANEL &&
								chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Todos tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.TODOS_PANEL)}
						px="3"
						py="2.5"
						borderRadius="lg"
						title="Todos"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.TODOS_PANEL && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.TODOS_PANEL && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<LuListTodo
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.TODOS_PANEL && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Modes tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.MODES_PANEL)}
						px="3"
						py="2.5"
						title="Modes"
						borderRadius="lg"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.MODES_PANEL && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.MODES_PANEL && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<TiFlowSwitch
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.MODES_PANEL && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Prompts tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.PROMPTS_PANEL)}
						px="3"
						py="2.5"
						title="Prompts"
						borderRadius="lg"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.PROMPTS_PANEL && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.PROMPTS_PANEL && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<FileText
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.PROMPTS_PANEL && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Agents tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.AGENTS_PANEL)}
						px="3"
						py="2.5"
						borderRadius="lg"
						title="Agents"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.AGENTS_PANEL && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.AGENTS_PANEL && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<Bot
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.AGENTS_PANEL && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* MCP tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.TOOLS)}
						px="3"
						py="2.5"
						borderRadius="lg"
						title="Permissions"
						cursor="pointer"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.TOOLS && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.TOOLS && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<Plug
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.TOOLS && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Config tab */}
					<Flex
						mt="1"
						onClick={() => toggleTab(EChatSidebarTab.CONFIG)}
						px="3"
						py="2.5"
						borderRadius="lg"
						cursor="pointer"
						title="Config"
						transition="all 0.15s"
						bg={
							chatSidebarTab === EChatSidebarTab.CONFIG && chatSidebarOpen
								? "var(--wc-bg-card)"
								: "transparent"
						}
						borderWidth="1px"
						borderColor={
							chatSidebarTab === EChatSidebarTab.CONFIG && chatSidebarOpen
								? "var(--wc-border-default)"
								: "transparent"
						}
						_hover={{ bg: "var(--wc-bg-card)", color: "var(--wc-text-primary)" }}
					>
						<LuSlidersHorizontal
							size={18}
							color={
								chatSidebarTab === EChatSidebarTab.CONFIG && chatSidebarOpen
									? "var(--wc-text-primary)"
									: "var(--wc-text-muted)"
							}
						/>
					</Flex>

					{/* Close button (only when open) */}
					{chatSidebarOpen && (
						<Flex
							mt="auto"
							mb="2"
							px="3"
							py="2.5"
							borderRadius="lg"
							cursor="pointer"
							transition="all 0.15s"
							borderWidth="1px"
							borderColor="transparent"
							_hover={{ bg: "var(--wc-bg-card)" }}
							onClick={() => setChatSidebarOpen(false)}
						>
							<ChevronRight size={18} color="var(--wc-text-muted)" />
						</Flex>
					)}
				</Flex>
			</Flex>
		);
	},
);
