import type { ISettings, IWhisperModel } from "@warpcore/shared";
import { DEFAULT_SETTINGS } from "@warpcore/shared";
import { Router } from "express";
import { sseManager } from "../services/sseManagerInstance";
import { scanAllWhisperModelRoots } from "../services/whisperModelScanner";
import { store } from "../util/store";

const SETTINGS_KEY = "settings:general";
const WHISPER_MODELS_KEY = "whisperModels:cache";

// Cached scan results (refreshed on demand)
let cachedWhisperModels: IWhisperModel[] = [];
let lastScanAt = 0;

// Load cached whisper models from store on startup, or scan if cache is empty
export async function loadCachedWhisperModels(): Promise<void> {
	try {
		const cached = await store.get<IWhisperModel[]>(WHISPER_MODELS_KEY);
		if (cached && cached.length > 0) {
			cachedWhisperModels = cached;
			lastScanAt = Date.now();
			console.log(
				`[whisper-models] Loaded ${cachedWhisperModels.length} cached whisper models`,
			);
		} else {
			const settings = (await store.get<ISettings>(SETTINGS_KEY)) ?? DEFAULT_SETTINGS;
			if (settings.modelRoots.length > 0) {
				console.log("[whisper-models] No cache found, scanning...");
				cachedWhisperModels = await scanAllWhisperModelRoots(settings.modelRoots);
				lastScanAt = Date.now();
				await store.put(WHISPER_MODELS_KEY, cachedWhisperModels);
				console.log(
					`[whisper-models] Initial scan complete: ${cachedWhisperModels.length} models`,
				);
			}
		}
	} catch (err) {
		console.warn("[whisper-models] Failed to load cached whisper models:", err);
	}
}

export const whisperModelsRouter = Router();

// GET /api/whisper-models — list all scanned whisper models
whisperModelsRouter.get("/", async (_req, res) => {
	res.json({
		ok: true,
		data: cachedWhisperModels,
		total: cachedWhisperModels.length,
		error: null,
	});
});

// Re-scan all whisper model roots, update the cache, and broadcast via SSE.
// Exported so other services (e.g. download completion) can trigger a rescan.
export async function refreshWhisperModelsCache(): Promise<IWhisperModel[]> {
	const settings = (await store.get<ISettings>(SETTINGS_KEY)) ?? DEFAULT_SETTINGS;
	if (settings.modelRoots.length === 0) return cachedWhisperModels;

	const before = cachedWhisperModels.length;
	cachedWhisperModels = await scanAllWhisperModelRoots(settings.modelRoots);
	lastScanAt = Date.now();
	await store.put(WHISPER_MODELS_KEY, cachedWhisperModels);

	const changed = cachedWhisperModels.length - before;
	const changeMsg = changed > 0 ? ` (+${changed})` : changed < 0 ? ` (${changed})` : "";
	console.log(`[whisper-models] Scan complete: ${cachedWhisperModels.length} models${changeMsg}`);

	sseManager.emit("whisperModels:init", cachedWhisperModels);
	return cachedWhisperModels;
}

// POST /api/whisper-models/scan — trigger a fresh scan
whisperModelsRouter.post("/scan", async (_req, res) => {
	const settings = (await store.get<ISettings>(SETTINGS_KEY)) ?? DEFAULT_SETTINGS;

	if (settings.modelRoots.length === 0) {
		res.json({ ok: true, data: [], total: 0, error: "No model directories configured" });
		return;
	}

	const data = await refreshWhisperModelsCache();
	res.json({ ok: true, data, total: data.length, error: null });
});

// GET /api/whisper-models/cache
whisperModelsRouter.get("/cache", async (_req, res) => {
	res.json({
		ok: true,
		data: cachedWhisperModels,
		total: cachedWhisperModels.length,
		error: null,
	});
});

// GET /api/whisper-models/scan-status
whisperModelsRouter.get("/scan-status", (_req, res) => {
	res.json({
		ok: true,
		data: {
			modelCount: cachedWhisperModels.length,
			lastScanAt,
		},
		error: null,
	});
});

export function getCachedWhisperModels(): IWhisperModel[] {
	return cachedWhisperModels;
}
