import type { IRecipe, IRecipeRunState, TRecipeId, TStepId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface RecipesSlice {
	recipes: Record<TRecipeId, IRecipe>;
	activeRun: IRecipeRunState | null;
	stepOutputs: Record<TStepId, string>;
}

export const recipesSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	recipes: {},
	activeRun: null,
	stepOutputs: {},
});
