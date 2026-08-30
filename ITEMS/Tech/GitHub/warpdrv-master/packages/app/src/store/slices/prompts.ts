import type { IChatPrompt, IChatPromptCreatePayload } from "@warpcore/shared";
import { createChatPrompt, deleteChatPrompt, updateChatPrompt } from "@/api/services";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface ChatPromptsSlice {
	chatPrompts: IChatPrompt[];
	setChatPrompts: (prompts: IChatPrompt[]) => void;
	addChatPrompt: (payload: IChatPromptCreatePayload) => Promise<void>;
	updateChatPrompt: (id: string, payload: Partial<IChatPromptCreatePayload>) => Promise<void>;
	removeChatPrompt: (id: string) => Promise<void>;
}

export const chatPromptsSlice = (
	setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	chatPrompts: [],
	setChatPrompts: (prompts: IChatPrompt[]) => {
		setState((draft) => {
			draft.chatPrompts = prompts;
		});
	},
	addChatPrompt: async (payload: IChatPromptCreatePayload) => {
		await createChatPrompt(payload);
	},
	updateChatPrompt: async (id: string, payload: Partial<IChatPromptCreatePayload>) => {
		await updateChatPrompt(id, payload);
	},
	removeChatPrompt: async (id: string) => {
		await deleteChatPrompt(id);
	},
});
