import type { IChatPreset, IChatPresetCreatePayload } from "@warpcore/shared";
import { createChatPreset, deleteChatPreset } from "@/api/services";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface ChatPresetsSlice {
	chatPresets: IChatPreset[];
	setChatPresets: (presets: IChatPreset[]) => void;
	addChatPreset: (payload: IChatPresetCreatePayload) => Promise<void>;
	removeChatPreset: (id: string) => Promise<void>;
}

export const chatPresetsSlice = (
	setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	chatPresets: [],
	setChatPresets: (presets: IChatPreset[]) => {
		setState((draft) => {
			draft.chatPresets = presets;
		});
	},
	addChatPreset: async (payload: IChatPresetCreatePayload) => {
		await createChatPreset(payload);
	},
	removeChatPreset: async (id: string) => {
		await deleteChatPreset(id);
	},
});
