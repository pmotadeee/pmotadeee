import type { AppState, ImmerGet, ImmerSet } from "../types";

export const agentsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	agents: {},
});
