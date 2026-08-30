import type { IProxyStatus, IStickyRouteInfo } from "@/api/services";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface ProxySlice {
	proxyStatus: IProxyStatus | null;
	proxyRoutes: IStickyRouteInfo[];
}

export const proxySlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	proxyStatus: null,
	proxyRoutes: [],
});
