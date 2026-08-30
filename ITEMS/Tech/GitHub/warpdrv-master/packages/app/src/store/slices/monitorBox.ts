import type { AppState, ImmerGet, ImmerSet } from "../types";

interface MonitorBoxSlice {
	monitorBoxOpen: boolean;
	setMonitorBoxOpen: (open: boolean) => void;
}

export function monitorBoxSlice(
	_set: ImmerSet<AppState>,
	_get: ImmerGet<AppState>,
): Partial<MonitorBoxSlice> {
	return {
		monitorBoxOpen: false,
		setMonitorBoxOpen: (open: boolean) => {
			// Intentionally simple — no side effects needed.
			_set((draft) => {
				(draft as any).monitorBoxOpen = open;
			});
		},
	};
}
