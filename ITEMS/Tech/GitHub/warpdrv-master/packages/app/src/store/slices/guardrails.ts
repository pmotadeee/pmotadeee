import type { AppState, ImmerGet, ImmerSet } from "../types";

export const guardrailsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	guardrails: {},
});
