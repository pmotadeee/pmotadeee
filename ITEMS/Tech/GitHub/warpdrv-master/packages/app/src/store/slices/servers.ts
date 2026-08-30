import type { IServer, IServerSlotsState, IServerStats, TServerId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface ServersSlice {
	servers: Record<TServerId, IServer>;
	serverStats: Record<TServerId, IServerStats>;
	serverLogs: Record<TServerId, string[]>;
	serverSlots: Record<TServerId, IServerSlotsState>;
}

export const serversSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	servers: {},
	serverStats: {},
	serverLogs: {},
	serverSlots: {},
});
