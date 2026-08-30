import type { AppState, ImmerGet, ImmerSet } from "../types";

export enum EChatSidebarTab {
	CONFIG = "config",
	TOOLS = "tools",
	SEARCH = "search",
	RIGHT_PANEL = "right-panel",
	GUARDRAILS_PANEL = "guardrails_panel",
	TODOS_PANEL = "todos_panel",
	MODES_PANEL = "modes_panel",
	PROMPTS_PANEL = "prompts_panel",
	AGENTS_PANEL = "agents_panel",
}

export function chatSidebarSlice(set: ImmerSet<AppState>, get: ImmerGet<AppState>) {
	return {
		chatSidebarOpen: false as boolean,
		chatSidebarTab: EChatSidebarTab.CONFIG,
		setChatSidebarOpen: (v: boolean) =>
			set((s) => {
				s.chatSidebarOpen = v;
			}),
		setChatSidebarTab: (tab: EChatSidebarTab) =>
			set((s) => {
				s.chatSidebarTab = tab;
			}),
		openChatSidebarTab: (tab: EChatSidebarTab) =>
			set((s) => {
				s.chatSidebarTab = tab;
				s.chatSidebarOpen = true;
			}),
	};
}
