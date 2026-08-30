import type { IAppletFn, TAppletDefinition } from "@warpcore/realmcore";
import { EAppletHostType, EAppletScope } from "@warpcore/realmcore";
import type { ITodoItem } from "@warpcore/shared";
import { EReasoningEffort } from "@warpcore/shared";
import { Bot, FileText } from "lucide-react";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { LuListTodo } from "react-icons/lu";
import { TiFlowSwitch } from "react-icons/ti";
import { createGuardrail as createGuardrailApi } from "@/api/guardrail-services";
import { createAgent as createAgentApi } from "@/api/agent-services";
import { createMode as createModeApi } from "@/api/mode-services";
import type { TDropdownItem } from "@/pages/Chat/assistant-ui/slash-command/SlashCmdDropdown";
import { parseGuardrailValue } from "@/pages/Chat/assistant-ui/slash-command/SlashCmdGuardrails";
import { parseAgentValue } from "@/pages/Chat/assistant-ui/slash-command/SlashCmdAgentSelector";
import { parseToolValue } from "@/pages/Chat/assistant-ui/slash-command/SlashCmdToolSelector";
import { useStore } from "@/store";
import { EUISpaceLoc } from "@/store/slices/uiSpaces";
import type { IAppletAPIFE } from "../lib/types";
import { GuardrailBadge } from "../ui/GuardrailBadge";
import { ModeTabs } from "../ui/ModeTabs";
import { MonitorButton } from "../ui/MonitorButton";
import { SenderBadge } from "../ui/SenderBadge";

import { useGuardrailItems } from "./guardrails/useGuardrailItems";
import { useModeItems } from "./modes/useModeItems";
import { TodoPanel } from "./todos/TodoPanel";
import { CompactIndicator } from "./indicators/CompactIndicator";
import { ModeChangeIndicator } from "./modes/ModeChangeIndicator";
import { ModeToolViolationIndicator } from "./modes/ModeToolViolationIndicator";
import { GuardrailsPanel } from "./guardrails/GuardrailsPanel";
import { ModesPanel } from "./modes/ModesPanel";
import { PromptsPanel } from "./prompts/PromptRow";
import { GuardrailResults } from "./guardrails/GuardrailResults";
import { ToolCallGuardrailIssues } from "./guardrails/ToolCallGuardrailIssues";
import { NonToolGuardrailResults } from "./guardrails/NonToolGuardrailResults";
import { MiniToolCallGuardrailIndicator } from "./guardrails/MiniToolCallGuardrailIndicator";
import { GuardrailShieldCheck } from "./guardrails/GuardrailShieldCheck";
import { toggleActiveGuardrail } from "./guardrails/toggleActiveGuardrail";
import { AgentsPanel } from "./agents/AgentRow";
import { EMPTY_TODOS } from "./constants";

const fn: IAppletFn<IAppletAPIFE> = async (api) => {
	console.log("[FEApplet] Started!");

	api.onReady(() => {
		console.log("[FEApplet] OnReady!");

		api.registerSlashCommand({
			name: "compact",
			description:
				"Compact the conversation thread. Add a message in chat for custom instructions.",
			params: {},
			consumesInput: true,
			inputPlaceholder: "Compact instructions...",
			execute: async (api, params) => {
				console.log("[FEApplet] /compact executed");
			},
		});

		api.registerSlashCommand({
			name: "create_guardrail",
			description: "Create a custom guardrail",
			params: {
				name: { type: "string", description: "Guardrail name", index: 0 },
				tools: {
					type: "message_type",
					description: "Trigger only on specific tool calls (empty = all messages)",
					index: 1,
				},
				server: {
					type: "server",
					description: "Server used for processing (empty = same as chat server)",
					index: 2,
				},
				prompt: {
					type: "dropdown",
					description: "Saved prompt to use (optional)",
					index: 3,
					props: {
						items: usePromptIdItems,
					},
				},
			},
			consumesInput: true,
			inputPlaceholder: "Guardrail prompt...",
			execute: async (_api, params, extraParams) => {
				const created = await createGuardrailApi({
					name: params.name!,
					serverId: params.server || "",
					promptId: params.prompt || undefined,
					prompt: extraParams?.prompt,
					triggerOnTools: parseToolValue(params.tools || ""),
				});
				toggleActiveGuardrail(created.id, true);
			},
		});

		api.registerSlashCommand({
			name: "guardrail",
			description: "Activate or deactivate a guardrail",
			params: {
				name: {
					type: "dropdown",
					description: "Guardrail name",
					index: 0,
					props: {
						items: useGuardrailItems,
					},
				},
				action: {
					type: "dropdown",
					description: "on/off",
					index: 1,
					props: {
						items: [
							{ label: "on", value: "on" },
							{ label: "off", value: "off" },
						],
					},
				},
			},
			execute: async (_api, params) => {
				toggleActiveGuardrail(params.name!, params.action === "on");
			},
		});

		api.registerSlashCommand({
			name: "todo",
			description: "Add a new todo item",
			params: {},
			consumesInput: true,
			inputPlaceholder: "Todo item text...",
			execute: async (_api, _params, extraParams) => {
				const text = extraParams?.prompt;
				if (!text) return;
				const state = api.useStore.getState();
				const threadId = state.currentThreadId;
				const ts = state.getCurrentThreadState(state);
				const todos = (ts?.todos || EMPTY_TODOS) as ITodoItem[];
				state.setThreadState(threadId, {
					todos: [...todos, { text, status: "pending" }],
					todoEtag: nanoid(6),
				});
			},
		});

		api.registerSlashCommand({
			name: "set_project_root",
			description: "Set the project root directory for this thread",
			params: {
				path: {
					type: "directory",
					description: "Path to project root directory",
					index: 0,
				},
			},
			execute: async (_api, params) => {
				const state = api.useStore.getState();
				const threadId = state.currentThreadId;
				if (!threadId) return;
				state.setThreadState(threadId, { projectRoot: params.path });
			},
		});

		api.registerSlashCommand({
			name: "create_mode",
			description: "Create a new mode with allowed tools, agents, and optional tail prompt",
			params: {
				name: { type: "string", description: "Mode name", index: 0 },
				color: { type: "color", description: "Mode color", index: 1 },
				tools: { type: "tools", description: "Allowed tools", index: 2 },
				agents: { type: "agents", description: "Allowed agents", index: 3 },
				guardrails: { type: "guardrails", description: "Active guardrails", index: 4 },
				prompt: {
					type: "dropdown",
					description: "Saved prompt to use (optional)",
					index: 5,
					props: {
						items: usePromptIdItems,
					},
				},
			},
			consumesInput: true,
			inputPlaceholder: "More instructions.",
			execute: async (_api, params, extraParams) => {
				await createModeApi({
					id: nanoid(6),
					name: params.name!,
					scope: "global",
					color: params.color || "#a78bfa",
					promptId: params.prompt || undefined,
					prompt: extraParams?.prompt || undefined,
					allowedTools: parseToolValue(params.tools || ""),
					allowedAgents: parseAgentValue(params.agents || ""),
					activeGuardrails: parseGuardrailValue(params.guardrails || ""),
				});
			},
		});

		api.registerSlashCommand({
			name: "mode",
			description: "Set or clear a mode for this thread",
			params: {
				action: {
					type: "dropdown",
					description: "set or clear",
					index: 0,
					props: {
						items: [
							{ label: "set", value: "set" },
							{ label: "clear", value: "clear" },
						],
					},
				},
				name: {
					type: "dropdown",
					description: "Mode name",
					index: 1,
					props: {
						items: useModeItems,
					},
				},
			},
			execute: async (_api, params) => {
				const state = api.useStore.getState();
				const threadId = state.currentThreadId;
				if (params.action === "clear") {
					state.setThreadState(threadId, { modeId: null });
				} else {
					state.setThreadState(threadId, { modeId: params.name });
				}
			},
		});

		// Chat Prompts
		function usePromptItems(): TDropdownItem[] {
			const prompts = useStore((s) => s.chatPrompts);
			return useMemo(() => prompts.map((p) => ({ label: p.name, value: p.name })), [prompts]);
		}

		function usePromptIdItems(): TDropdownItem[] {
			const prompts = useStore((s) => s.chatPrompts);
			return useMemo(() => prompts.map((p) => ({ label: p.name, value: p.id })), [prompts]);
		}

		api.registerSlashCommand({
			name: "prompt",
			description: "Inject a saved prompt into your message",
			params: {
				name: {
					type: "dropdown",
					description: "Prompt name",
					index: 0,
					props: {
						items: usePromptItems,
					},
				},
			},
			consumesInput: true,
			inputPlaceholder: "Additional context...",
			execute: async (_api, _params) => {
				// Injection happens in bridge.preCompletion hook
			},
		});

		api.registerSlashCommand({
			name: "create_prompt",
			description: "Create a saved prompt",
			params: {
				name: { type: "string", description: "Prompt name", index: 0 },
			},
			consumesInput: true,
			inputPlaceholder: "Prompt content...",
			execute: async (_api, params, extraParams) => {
				const content = extraParams?.prompt;
				if (!content) return;
				await api.useStore.getState().addChatPrompt({ name: params.name!, content });
			},
		});

		api.registerSlashCommand({
			name: "create_agent",
			description:
				"Create a new agent with server, prompt, tools, and auto-approve permissions",
			params: {
				name: { type: "string", description: "Agent name", index: 0 },
				server: { type: "server", description: "Server for the agent", index: 1 },
				prompt: {
					type: "dropdown",
					description: "Saved prompt (optional)",
					index: 2,
					props: {
						items: usePromptIdItems,
					},
				},
				tools: { type: "tools", description: "Tools the agent can use", index: 3 },
				// autoApprove: { type: "tools", description: "Tools to auto-approve", index: 4 },
				guardrails: { type: "guardrails", description: "Guardrails to attach", index: 4 },
				reasoningLevel: {
					type: "dropdown",
					description: "Reasoning level (none/low/medium/high)",
					index: 5,
					props: {
						items: [
							{ label: "none", value: EReasoningEffort.NONE },
							{ label: "low", value: EReasoningEffort.LOW },
							{ label: "medium", value: EReasoningEffort.MEDIUM },
							{ label: "high", value: EReasoningEffort.HIGH },
						],
					},
				},
			},
			consumesInput: true,
			inputPlaceholder: "Agent description...",
			execute: async (_api, params, extraParams) => {
				await createAgentApi({
					name: params.name!,
					serverId: params.server || "",
					promptId: params.prompt || undefined,
					tools: parseToolValue(params.tools || ""),
					// autoApproveTools: parseToolValue(params.autoApprove || ""),
					autoApproveTools: parseToolValue(params.tools || ""),
					description: extraParams?.prompt || "",
					reasoningEffort: params.reasoningLevel,
					guardrails: parseGuardrailValue(params.guardrails || ""),
				});
			},
		});

		api.registerUiSpaceComponent(EUISpaceLoc.TODOS_PANEL, TodoPanel, {
			label: "To-Do",
			icon: LuListTodo,
		});
		api.registerUiSpaceComponent(EUISpaceLoc.GUARDRAILS_PANEL, GuardrailsPanel, {
			label: "Guardrails",
			icon: FaShieldAlt,
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MODES_PANEL, ModesPanel, {
			label: "Modes",
			icon: TiFlowSwitch,
		});
		api.registerUiSpaceComponent(EUISpaceLoc.PROMPTS_PANEL, PromptsPanel, {
			label: "Prompts",
			icon: FileText,
		});
		api.registerUiSpaceComponent(EUISpaceLoc.AGENTS_PANEL, AgentsPanel, {
			label: "Agents",
			icon: Bot,
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MESSAGE, CompactIndicator, {
			label: "Compact Indicator",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MESSAGE, ModeChangeIndicator, {
			label: "ModeChangeIndicator",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MESSAGE, ModeToolViolationIndicator, {
			label: "ModeToolViolationIndicator",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.TOOL_CALL, ToolCallGuardrailIssues, {
			label: "ToolCallGuardrailIssues",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.PENDING_TOOL_CALL, ToolCallGuardrailIssues, {
			label: "ToolCallGuardrailIssues",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.PENDING_TOOL_CALL, NonToolGuardrailResults, {
			label: "NonToolGuardrailResults",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MINI_TOOL_CALL, MiniToolCallGuardrailIndicator, {
			label: "MiniToolCallGuardrailIndicator",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MESSAGE, GuardrailResults, {
			label: "GuardrailResults",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MESSAGE, SenderBadge, {
			label: "SenderBadge",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.MESSAGE_FOOTER, GuardrailShieldCheck, {
			label: "GuardrailShieldCheck",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.COMPOSER, ModeTabs, {
			label: "Mode",
			align: "start",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.COMPOSER, GuardrailBadge, {
			label: "Guardrails",
			align: "end",
		});
		api.registerUiSpaceComponent(EUISpaceLoc.COMPOSER, MonitorButton, {
			label: "Monitor",
			align: "end",
		});

		const blockingSlashCommands = [
			"guardrail",
			"create_guardrail",
			"todo",
			"create_mode",
			"mode",
			"set_project_root",
			"create_prompt",
			"create_agent",
		];

		// Prompt injection hook: /prompt <name> prepends saved prompt content to message
		api.eventNode.hook("..", "bridge.preCompletion", async (eventApi) => {
			const payload = eventApi.payload as {
				slashCommands: Array<{ name: string; params: Record<string, string> }>;
				body: { userMessage: { content: string } };
			};
			const promptCmd = payload.slashCommands.find((cmd) => cmd.name === "prompt");
			if (promptCmd) {
				const state = useStore.getState();
				const prompt = state.chatPrompts.find((p) => p.name === promptCmd.params.name);
				if (prompt) {
					const existing = payload.body.userMessage.content.trim();
					if (existing) {
						payload.body.userMessage.content = prompt.content + "\n\n" + existing;
					} else {
						payload.body.userMessage.content = prompt.content;
					}
					// Remove processed /prompt commands so duplicate hook copies don't re-inject
					payload.slashCommands = payload.slashCommands.filter(
						(cmd) => cmd.name !== "prompt",
					);
				}
			}
			return eventApi.result;
		});

		// Compact hook
		api.eventNode.hook("..", "bridge.preCompletion", async (eventApi) => {
			const payload = eventApi.payload as {
				slashCommands: Array<{ name: string }>;
				body: { userMessage: { content: string } };
			};
			const hasCompact = payload.slashCommands.some((cmd) => cmd.name === "compact");
			if (hasCompact && !payload.body.userMessage.content.trim()) {
				payload.body.userMessage.content = "Continue";
			}
			return eventApi.result;
		});

		api.eventNode.hook("..", "bridge.preCompletion", async (eventApi) => {
			const payload = eventApi.payload as {
				slashCommands: Array<{ name: string }>;
				body: { userMessage: { content: string } };
			};
			const hasBlocking = payload.slashCommands.some((cmd) =>
				blockingSlashCommands.includes(cmd.name),
			);
			if (!hasBlocking) {
				const state = useStore.getState();
				const annotations = state.annotations;
				if (annotations.length > 0) {
					const lines = annotations.map(
						(a, i) => `${i + 1}. "${a.selectedText}"\n   ${a.comment}`,
					);
					const fullText = (
						lines.join("\n\n") +
						(payload.body.userMessage.content.trim()
							? "\n\n" + payload.body.userMessage.content
							: "")
					).trim();
					payload.body.userMessage.content = fullText;
					state.clearAnnotations();
				}
			}
			return eventApi.result;
		});

		api.eventNode.hook("..", "bridge.preCompletion", async (eventApi) => {
			const payload = eventApi.payload as { slashCommands: Array<{ name: string }> };
			for (const cmd of payload.slashCommands) {
				if (blockingSlashCommands.includes(cmd.name)) {
					console.log("Skip cmd hook - aborting send!");
					return false;
				}
			}
			return eventApi.result;
		});
	});
};

export const FEApplet: TAppletDefinition<IAppletAPIFE> = {
	name: "FEApplet",
	description: "Frontend applet",
	fn,
	hostType: EAppletHostType.FE,
	scope: EAppletScope.GLOBAL,
};
