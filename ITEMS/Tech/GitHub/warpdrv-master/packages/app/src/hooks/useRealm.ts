import {
	AppletManager,
	EAppletHostType,
	EAppletScope,
	EventNode,
	RemoteNode,
	WSTransport,
} from "@warpcore/realmcore";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { AppletHostFE, feApplets } from "@/applets";

export function useRealm(currentThreadId: string | null) {
	const realmRef = useRef<{
		eventNode: EventNode;
		remoteNode: RemoteNode;
		nodeId: string;
		socket: Socket;
		appletMgr: AppletManager;
	}>(null);

	const [isParentAttached, setParentAttached] = useState<boolean>(false);

	if (!realmRef.current) {
		console.log(`[Realm] Loading..`);

		const nodeId = `chat-${nanoid(6)}`;
		const chatNode = new EventNode(nodeId, false, () => setParentAttached(true));
		(window as any).eventNode = chatNode;

		const appletMgr = new AppletManager(
			chatNode,
			EAppletScope.GLOBAL,
			undefined,
			{ [EAppletHostType.FE]: AppletHostFE },
			feApplets,
			{ FEApplet: true },
		);

		const socket = io({
			path: "/api/realm/",
			query: { nodeId },
			transports: ["websocket"],
			upgrade: false,
		});

		const remoteNode = new RemoteNode("warpcore", chatNode, new WSTransport(socket));

		socket.on("connect", () => {
			console.log(`[Realm] ✅ Connected as ${nodeId}.`);
			setTimeout(
				() =>
					chatNode.sub("../", "console-log", (api) => {
						console.log("[console-log]", api.payload);
					}),
				100,
			);
		});

		socket.on("disconnect", () => {
			console.error(`[Realm] Disconnected!`);
			setParentAttached(false);
		});

		socket.io.on("error", (err) => {
			console.error(`[Realm] Manager error:`, err.message);
		});

		realmRef.current = {
			eventNode: chatNode,
			remoteNode,
			nodeId,
			socket,
			appletMgr,
		};
	}

	useEffect(() => {
		if (!isParentAttached) return;
		realmRef.current?.appletMgr.initializeAll();

		return () => {
			realmRef.current?.appletMgr.terminateAll();
		};
	}, [isParentAttached]);

	// useEffect(() => {
	// 	if (!isParentAttached) return;
	// 	realmRef.current?.appletMgr.updateScopeValue(currentThreadId ?? undefined);
	// }, [currentThreadId, isParentAttached]);

	useEffect(() => {
		const socket = realmRef.current?.socket;
		if (socket && !socket.connected) socket.connect();

		return () => {
			socket?.disconnect();
		};
	}, []);

	return realmRef.current;
}
