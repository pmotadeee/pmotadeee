import type { IWhisperModel, IWhisperServer, TWhisperServerId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface WhisperServersSlice {
	whisperServers: Record<TWhisperServerId, IWhisperServer>;
	whisperServerLogs: Record<TWhisperServerId, string[]>;
	whisperModels: Record<string, IWhisperModel>;
}

export const whisperServersSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	whisperServers: {},
	whisperServerLogs: {},
	whisperModels: {},
});
