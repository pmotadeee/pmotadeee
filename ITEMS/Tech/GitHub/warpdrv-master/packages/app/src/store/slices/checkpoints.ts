import type { ICheckpoint, TCheckpointId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface CheckpointsSlice {
	checkpoints: Record<TCheckpointId, ICheckpoint>;
}

export const checkpointsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	checkpoints: {},
});
