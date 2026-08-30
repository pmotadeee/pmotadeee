import type { IKokoroStatus } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface KokoroSlice {
	kokoroStatus: IKokoroStatus | null;
	setKokoroStatus: (status: IKokoroStatus | null) => void;
}
export const kokoroSlice = (
	setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	kokoroStatus: null,
	setKokoroStatus: (status) => {
		setState((draft) => {
			draft.kokoroStatus = status;
		});
	},
});
