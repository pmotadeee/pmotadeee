import {
	McpClientManager,
	McpConfig,
	Orchestrator,
	PermissionManager,
	type SqlitePersistence,
	SqlitePersistenceWithBroadcast,
	SseBroadcaster,
} from "@warpcore/bridge/server";
import { EventNode } from "@warpcore/realmcore";
import type {
	IBackend,
	IBackendGroup,
	IDownload,
	IServer,
	ISettings,
	IWhisperBackend,
	IWhisperServer,
	TBackendGroupId,
	TBackendId,
} from "@warpcore/shared";
import {
	DEFAULT_SETTINGS,
	EDownloadStatus,
	EServerStatus,
	SSE_CHANNELS_CHECKPOINT,
} from "@warpcore/shared";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { authMiddleware } from "./middleware/auth";
import { serveStaticApp } from "./middleware/serveStatic";
import { authRouter } from "./routes/auth";
import { agentsRouter } from "./routes/agents";
import { backendGroupsRouter } from "./routes/backendGroups";
import { backendsRouter } from "./routes/backends";
import { chatRouter } from "./routes/chat";
import { notificationsRouter } from "./routes/notifications";
import { checkpointsRouter } from "./routes/checkpoints";
import { clientLogsRouter } from "./routes/clientLogs";
import { guardrailsRouter } from "./routes/guardrails";
import { hardwareRouter } from "./routes/hardware";
import { hubRouter } from "./routes/hub";
import { kokoroRouter } from "./routes/kokoro";
import { mcpRouter } from "./routes/mcp";
import { getCachedModels, loadCachedModels, modelsRouter } from "./routes/models";
import { modesRouter } from "./routes/modes";
import { presetsRouter } from "./routes/presets";
import { promptsRouter } from "./routes/prompts";
import { proxyRouter } from "./routes/proxy";
import { recipesRouter } from "./routes/recipes";
import { releasesRouter } from "./routes/releases";
import { serversRouter } from "./routes/servers";
import { settingsRouter } from "./routes/settings";
import { summaryRouter } from "./routes/summary";
import { tokensRouter } from "./routes/tokens";
import { updateRouter } from "./routes/update";
import { whisperBackendsRouter } from "./routes/whisperBackends";
import {
	getCachedWhisperModels,
	loadCachedWhisperModels,
	whisperModelsRouter,
} from "./routes/whisperModels";
import { whisperServersRouter } from "./routes/whisperServers";
import { ChatSearchToolService } from "./services/chatSearchToolService";
import { listCheckpoints } from "./services/checkpointService";
import { CodeGraphService } from "./services/codeGraphService";
import { seedDefaults } from "./services/defaultModes";
import { getAllDownloads, getAllDownloadsRecord } from "./services/downloadManager";
import { embeddingManager } from "./services/embeddingManager";
import { initRealm } from "./services/initRealm";
import { initKokoroService } from "./services/kokoroService";
import { runMigrations } from "./services/migrationRunner";
import { getProxyStatus, startModelProxy } from "./services/modelProxy";
import { listModes } from "./services/modeStore";
import { getActiveRun, setRecipeRunnerSSE } from "./services/recipeRunner";
import { listRecipes } from "./services/recipeStore";
import { getAllServerSlots } from "./services/slotStateTracker";
import { sseManager } from "./services/sseManagerInstance";
import { getServerStats } from "./services/statsPoller";
import { TodoManager } from "./services/todoManager";
import { SubthreadService } from "./services/subthreadService";
import { ThreadStatusLineManager } from "./services/threadStatusLineManager";
import { listChatPresets } from "./util/chatPresets";
import { getDataDir } from "./util/mcpConfig";
import { store } from "./util/store";
import { bootWarpmcp } from "./warpmcpRunner";

const SETTINGS_KEY = "settings:general";

// Bridge components - exported for routes to use
export let persistence: SqlitePersistence;
export let mcpClient: McpClientManager;
export let orchestrator: Orchestrator;
export let mcpConfig: McpConfig;
export let broadcaster: SseBroadcaster;
export let todoManager: TodoManager;
export { getProjectRoot } from "./services/projectRoot";
export let codeGraphService: CodeGraphService;
export let chatSearchToolService: ChatSearchToolService;
export let subthreadService: SubthreadService;
export let threadStatusLineManager: ThreadStatusLineManager;

import { execSync } from "child_process";
import { createServer } from "http";
import { launchAutoStartServers, reconcileServers } from "./services/processManager";
import {
	launchAutoStartWhisperServers,
	reconcileWhisperServers,
} from "./services/whisperProcessManager";

function resolveShellPath(): string | null {
	try {
		const shell = process.env.SHELL || "/bin/bash";
		const out = execSync(`${shell} -ilc 'echo $PATH'`, {
			encoding: "utf8",
			timeout: 3000,
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
		return out || null;
	} catch {
		return null;
	}
}

async function main() {
	const shellPath = resolveShellPath();
	if (shellPath && shellPath !== process.env.PATH) {
		// console.log('[debug] resolved shell PATH:', shellPath);
		process.env.PATH = shellPath;
	}

	// console.log('[debug] PATH:', process.env.PATH || '(not set)');
	console.log("[debug] HOME:", process.env.HOME || "(not set)");
	console.log("[debug] RESOURCE_DIR:", process.env.RESOURCE_DIR);
	console.log("[debug] execPath:", process.execPath);
	console.log("[debug] pkg:", (process as any).pkg);
	await runMigrations();

	// Ensure default settings exist
	const settings = await store.get<ISettings>(SETTINGS_KEY);
	if (!settings) await store.put(SETTINGS_KEY, DEFAULT_SETTINGS);

	// Reconcile any servers that were running before restart
	await reconcileServers();

	// Initialize bridge persistence
	const dataDir = getDataDir();
	broadcaster = new SseBroadcaster();
	persistence = new SqlitePersistenceWithBroadcast(
		path.join(dataDir, "chat.db"),
		{},
		broadcaster,
	);
	await persistence.init();
	await seedDefaults().catch((err) =>
		console.error("[seed] Failed to seed default modes/guardrails:", err),
	);
	todoManager = new TodoManager(persistence);
	threadStatusLineManager = new ThreadStatusLineManager(persistence);
	codeGraphService = new CodeGraphService(persistence);
	chatSearchToolService = new ChatSearchToolService(persistence);

	// Initialize MCP
	mcpConfig = new McpConfig(path.join(dataDir, "mcp.json"));
	mcpClient = new McpClientManager(undefined, broadcaster);
	const permissions = new PermissionManager(persistence);
	const eventNode = new EventNode("warpcore", true);
	orchestrator = new Orchestrator({
		mcpClient,
		permissions,
		persistence,
		broadcaster,
		eventNode,
	});
	subthreadService = new SubthreadService(persistence, orchestrator, broadcaster, eventNode);

	// Initialize embedding manager
	await embeddingManager.initialize(persistence, broadcaster, dataDir);

	// Connect MCP servers in parallel (non-blocking)
	const mcpCfg = mcpConfig.read();
	const mcpConnectResults = Object.entries(mcpCfg.mcpServers).map(([name, entry]) =>
		mcpClient.connect(name, entry),
	);
	Promise.allSettled(mcpConnectResults).then((results) => {
		const failures = results.filter((r) => r.status === "rejected");
		if (failures.length) {
			console.log(`[MCP] ${failures.length} server(s) failed to connect`);
		}
		console.log(`[MCP] Initial connection phase complete`);
	});
	bootWarpmcp().catch((err) => console.error("[warpmcp] Failed to start:", err));
	initKokoroService().catch((err) =>
		console.error("[kokoro] Failed to initialize Kokoro TTS service:", err),
	);

	// Pending approvals will be handled by the orchestrator on next completion

	// Load cached model scan results
	await loadCachedModels();

	// Load cached whisper model scan results
	await loadCachedWhisperModels();

	// Launch auto-start servers after all data has loaded
	await launchAutoStartServers();

	// Reconcile and launch auto-start whisper servers
	await reconcileWhisperServers();
	await launchAutoStartWhisperServers();

	const app = express();

	// Cross-origin isolation for Web Worker SharedArrayBuffer
	app.use((req, res, next) => {
		res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
		next();
	});

	app.use(cors());
	app.use(express.json({ limit: "50mb" }));
	app.use(cookieParser());
	// Auth routes (no middleware - public endpoints)
	app.use("/api/auth", authRouter);
	// Client log route (no auth — server may not be up when errors occur)
	app.use("/api/client-log", clientLogsRouter);
	// Token routes (require admin auth)
	app.use("/api/tokens", authMiddleware, tokensRouter);
	// API routes with auth middleware
	app.use("/api/agents", authMiddleware, agentsRouter);
	app.use("/api/settings", authMiddleware, settingsRouter);
	app.use("/api/backends", authMiddleware, backendsRouter);
	app.use("/api/hardware", authMiddleware, hardwareRouter);
	app.use("/api/releases", authMiddleware, releasesRouter);
	app.use("/api/kokoro", authMiddleware, kokoroRouter);
	app.use("/api/backend-groups", authMiddleware, backendGroupsRouter);
	app.use("/api/models", authMiddleware, modelsRouter);
	app.use("/api/servers", authMiddleware, serversRouter);
	app.use("/api/presets", authMiddleware, presetsRouter);
	app.use("/api/prompts", authMiddleware, promptsRouter);
	app.use("/api/hub", authMiddleware, hubRouter);
	app.use("/api/update", authMiddleware, updateRouter);
	app.use("/api/proxy", authMiddleware, proxyRouter);
	app.use("/api/chat", authMiddleware, chatRouter);
	app.use("/api/chat/notifications", authMiddleware, notificationsRouter);
	app.use("/api/mcp", authMiddleware, mcpRouter);
	app.use("/api/summary", authMiddleware, summaryRouter);
	app.use("/api/recipes", authMiddleware, recipesRouter);
	app.use("/api/modes", authMiddleware, modesRouter);
	app.use("/api/guardrails", authMiddleware, guardrailsRouter);
	app.use("/api/checkpoints", authMiddleware, checkpointsRouter);
	app.use("/api/whisper-backends", authMiddleware, whisperBackendsRouter);
	app.use("/api/whisper-servers", authMiddleware, whisperServersRouter);
	app.use("/api/whisper-models", authMiddleware, whisperModelsRouter);
	// SSE endpoint (protected by auth)
	app.get("/api/events", authMiddleware, async (req, res) => {
		console.log("[SSE] New client");
		await sseManager.handleConnection(req, res, () => {
			console.log("[SSE] Client disconnected");
		});
	});

	// Stats endpoint — returns live stats for a running server (protected by auth)
	app.get("/api/servers/:id/stats", authMiddleware, (req, res) => {
		const { getServerStats } = require("./services/statsPoller");
		const stats = getServerStats(req.params.id);
		res.json({ ok: true, data: stats, error: null });
	});

	// Static frontend serving (production only)
	serveStaticApp(app);

	// Health check
	app.get("/api/health", (_req, res) => {
		res.json({ ok: true, version: "0.1.0" });
	});

	const currentSettings = (await store.get<ISettings>(SETTINGS_KEY)) ?? DEFAULT_SETTINGS;

	// Port: env var overrides settings, defaults to 4400
	const envPort = process.env.CONTROL_API_PORT;
	const port = envPort
		? parseInt(envPort, 10)
		: (currentSettings.apiPort ?? DEFAULT_SETTINGS.apiPort);
	if (isNaN(port) || port < 1 || port > 65535) {
		console.error(`[WarpCore] Invalid CONTROL_API_PORT: ${envPort}. Using default 4400.`);
	}

	const host = currentSettings.apiHost ?? DEFAULT_SETTINGS.apiHost;

	// Register SSE channels
	function registerSSEChannels(): void {
		console.log("[SSE] Start channels..");

		// Phase 1: Servers
		const SERVERS_PREFIX = "servers:";

		sseManager.onConnect("servers:list", async () => {
			const servers = await store.list<IServer>(`${SERVERS_PREFIX}`);
			const result: Record<string, IServer> = {};
			for (const s of servers) {
				result[s.id] = {
					...s,
					stats:
						s.status === EServerStatus.RUNNING || s.status === EServerStatus.LOADING
							? getServerStats(s.id)
							: null,
				};
			}
			return result;
		});

		// sseManager.onInterval('servers:stats', () => {
		// 	const stats = getAllServerStats();
		// 	return Object.keys(stats).length > 0 ? stats : null;
		// }, 1500);
		sseManager.onConnect(SSE_CHANNELS_CHECKPOINT.SERVER_SLOTS_SNAPSHOT, async () => {
			const all = getAllServerSlots();
			return Object.keys(all).length > 0 ? all : undefined;
		});

		sseManager.onConnect(SSE_CHANNELS_CHECKPOINT.CHECKPOINTS_INIT, async () => {
			const checkpoints = await listCheckpoints({ serverId: null, threadId: null });
			const result: Record<string, (typeof checkpoints)[number]> = {};
			for (const cp of checkpoints) result[cp.id] = cp;
			return result;
		});

		// Phase 1: Proxy
		sseManager.onConnect("proxy:init", async () => {
			return await getProxyStatus();
		});

		// Phase 1: Downloads
		sseManager.onConnect("downloads:init", async () => {
			const downloads = await getAllDownloads();
			return downloads.reduce(
				(acc, dl) => {
					acc[dl.id] = dl;
					return acc;
				},
				{} as Record<string, IDownload>,
			);
		});

		sseManager.onInterval(
			"downloads:progress",
			() => {
				const all = getAllDownloadsRecord();
				const active: Record<string, IDownload> = {};
				for (const id of Object.keys(all)) {
					const dl = all[id];
					if (!dl) continue;
					if (
						dl.status === EDownloadStatus.DOWNLOADING ||
						dl.status === EDownloadStatus.PAUSED
					) {
						active[id] = dl;
					}
				}
				return Object.keys(active).length > 0 ? active : null;
			},
			1000,
		);

		// Phase 1: Devices
		const BACKENDS_PREFIX = "backends:";

		sseManager.onConnect("devices:init", async () => {
			const backends = await store.list<IBackend>(BACKENDS_PREFIX);
			return backends.flatMap((b) => b.detectedDevices ?? []);
		});

		sseManager.onInterval(
			"devices:vram",
			async () => {
				const backends = await store.list<IBackend>(BACKENDS_PREFIX);
				const devices = backends.flatMap((b) => b.detectedDevices ?? []);
				return devices.length > 0 ? devices : [];
			},
			5000,
		);

		// Phase 2: MCP
		sseManager.onConnect("mcp:init", async () => {
			return mcpClient.getAllServerStates();
		});

		sseManager.onInterval(
			"mcp:servers",
			() => {
				const states = mcpClient.getAllServerStates();
				return Object.keys(states).length > 0 ? states : null;
			},
			1000,
		);

		sseManager.onConnect("mcp:permissions:init", async () => ({
			servers: await persistence.getAllServerPermissions(),
			tools: await persistence.getAllToolPermissions(),
		}));

		// Phase 1: Backends
		sseManager.onConnect("backends:init", async () => {
			const backends = await store.list<IBackend>(BACKENDS_PREFIX);
			return backends.reduce(
				(acc, b) => {
					acc[b.id] = b;
					return acc;
				},
				{} as Record<TBackendId, IBackend>,
			);
		});

		// Phase 1: Backend Groups
		const BACKEND_GROUPS_PREFIX = "backendGroups:";

		sseManager.onConnect("backend-groups:init", async () => {
			const groups = await store.list<IBackendGroup>(BACKEND_GROUPS_PREFIX);
			return groups.reduce(
				(acc, g) => {
					acc[g.id] = g;
					return acc;
				},
				{} as Record<TBackendGroupId, IBackendGroup>,
			);
		});

		// Models
		sseManager.onConnect("models:init", async () => {
			return getCachedModels();
		});

		// Settings
		sseManager.onConnect("settings:init", async () => {
			const settings = await store.get<ISettings>(SETTINGS_KEY);
			return settings;
		});

		// Whisper Backends
		const WHISPER_BACKENDS_PREFIX = "whisperBackends:";

		sseManager.onConnect("whisperBackends:init", async () => {
			const backends = await store.list<IWhisperBackend>(WHISPER_BACKENDS_PREFIX);
			return backends.reduce(
				(acc, b) => {
					acc[b.id] = b;
					return acc;
				},
				{} as Record<string, IWhisperBackend>,
			);
		});

		// Whisper Servers
		const WHISPER_SERVERS_PREFIX = "whisperServers:";

		sseManager.onConnect("whisperServers:init", async () => {
			const servers = await store.list<IWhisperServer>(WHISPER_SERVERS_PREFIX);
			return servers.reduce(
				(acc, s) => {
					acc[s.id] = s;
					return acc;
				},
				{} as Record<string, IWhisperServer>,
			);
		});

		// Whisper Models
		sseManager.onConnect("whisperModels:init", async () => {
			return getCachedWhisperModels();
		});
	}

	registerSSEChannels();

	setRecipeRunnerSSE(sseManager);

	sseManager.onConnect("embedding:init", async () => {
		return { serverId: embeddingManager.getCurrentServerId() };
	});

	sseManager.onConnect("recipes:init", async () => {
		const recipes = await listRecipes();
		const recipesMap: Record<string, (typeof recipes)[number]> = {};
		for (const r of recipes) recipesMap[r.id] = r;
		return { recipes: recipesMap, activeRun: getActiveRun() };
	});

	sseManager.onConnect("modes:init", async () => {
		const modes = await listModes();
		const modesMap: Record<string, (typeof modes)[number]> = {};
		for (const m of modes) modesMap[m.id] = m;
		return modesMap;
	});

	sseManager.onConnect("guardrails:init", async () => {
		const guardrails = await persistence.listGuardrails();
		const result: Record<string, (typeof guardrails)[string]> = {};
		for (const [id, g] of Object.entries(guardrails)) {
			result[id] = g;
		}
		return result;
	});

	sseManager.onConnect("chatPresets:init", async () => {
		return listChatPresets();
	});

	sseManager.onConnect("prompts:init", async () => {
		return persistence.listChatPrompts();
	});

	sseManager.onConnect("agents:init", async () => {
		const agents = await persistence.listAgents();
		const agentsMap: Record<string, (typeof agents)[number]> = {};
		for (const a of agents) agentsMap[a.id] = a;
		return agentsMap;
	});

	sseManager.onConnect("threads:init", async () => {
		const threads = await persistence.listThreads({});
		const result: Record<string, (typeof threads)[number]> = {};
		for (const t of threads) result[t.id] = t;
		return result;
	});

	sseManager.onConnect("folders:init", async () => {
		const folders = await persistence.listFolders();
		return folders;
	});

	const httpServer = createServer(app);

	// Initialize realm events
	await initRealm(httpServer, eventNode);

	// Start server
	httpServer.listen(port, host, () => {
		console.log(`[WarpCore] API server listening on ${host}:${port}`);
		if (envPort) {
			console.log(`[WarpCore] Port set via CONTROL_API_PORT environment variable`);
		}
	});

	process.on("exit", () => {
		mcpClient.disconnectAll();
	});

	// Start model proxy if enabled in settings
	if (currentSettings.proxyEnabled) {
		await startModelProxy();
	}
}

main().catch((err) => {
	console.error("[WarpCore] Fatal error:", err);
	process.exit(1);
});
