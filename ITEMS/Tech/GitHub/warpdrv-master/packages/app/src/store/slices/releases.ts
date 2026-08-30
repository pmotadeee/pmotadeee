import type { IBackendAsset } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface ReleasesSlice {
	llamaReleases: Record<string, IBackendAsset>;
	whisperReleases: Record<string, IBackendAsset>;
}
export const releasesSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	llamaReleases: {},
	whisperReleases: {},
});
