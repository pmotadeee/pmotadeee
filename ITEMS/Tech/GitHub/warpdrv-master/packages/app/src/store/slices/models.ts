import type { IModel, TModelId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface ModelsSlice {
	models: Record<TModelId, IModel>;
}

export const modelsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	models: {},
});
