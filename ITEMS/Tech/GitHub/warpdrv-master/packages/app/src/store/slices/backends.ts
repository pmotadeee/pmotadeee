import type { IBackend, IBackendGroup, TBackendGroupId, TBackendId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface BackendsSlice {
	backends: Record<TBackendId, IBackend>;
	backendGroups: Record<TBackendGroupId, IBackendGroup>;
}

export const backendsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	backends: {},
	backendGroups: {},
});
