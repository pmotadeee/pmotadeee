import type { IWhisperBackend, TWhisperBackendId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface WhisperBackendsSlice {
	whisperBackends: Record<TWhisperBackendId, IWhisperBackend>;
}

export const whisperBackendsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	whisperBackends: {},
});
