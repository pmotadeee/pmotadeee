import type { IHardwareInfo } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface HardwareSlice {
	hardware: IHardwareInfo | null;
}
export const hardwareSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	hardware: null,
});
