import type { IDevice } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface DevicesSlice {
	devices: IDevice[];
}

export const devicesSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	devices: [],
});
