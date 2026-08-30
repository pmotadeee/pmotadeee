import type { IBackend, IServer } from "@warpcore/shared";
import { EServerStatus } from "@warpcore/shared";
import { Router } from "express";
import { getProxyError, isProxyOnline } from "../services/modelProxy";
import { store } from "../util/store";

const SERVERS_PREFIX = "servers:";
const BACKENDS_PREFIX = "backends:";

export const summaryRouter = Router();

summaryRouter.get("/", async (_req, res) => {
	// Count running servers and servers with errors
	const servers = await store.list<IServer>(SERVERS_PREFIX);
	const running = servers.filter((s) => s.status === EServerStatus.RUNNING).length;
	const serverErrors = servers.filter((s) => s.error != null && s.error.length > 0).length;

	// Unique devices across all backends
	const backends = await store.list<IBackend>(BACKENDS_PREFIX);
	const deviceNames = new Set<string>();
	for (const backend of backends) {
		if (backend.detectedDevices) {
			for (const device of backend.detectedDevices) deviceNames.add(device.name);
		}
	}

	// Proxy error state
	const proxyError = getProxyError();

	res.json({
		ok: true,
		data: {
			servers: { running, errors: serverErrors },
			router: { online: isProxyOnline(), hasError: proxyError != null },
			devices: { unique: deviceNames.size },
		},
		error: null,
	});
});
