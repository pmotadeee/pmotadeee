import { EReasoningEffort, type IChatInferenceParams } from "@warpcore/shared";
import { useCallback, useEffect, useRef } from "react";
import { fetchThreadConfig, updateThreadConfig } from "@/api";
import { fetchWorkspaceState } from "@/api/services";
//import { DEFAULT_INFERENCE_PARAMS } from "@/pages/Chat/ChatConfigSidebar";
import { useStore } from "../store";

export function useThreadConfig(selectedPresetId: string | null) {
	const currentThreadId = useStore((s) => s.currentThreadId);
	const currentSystemPrompt = useStore((s) => s.currentSystemPrompt);
	const currentInferenceParams = useStore(
		(s) => s.currentInferenceParams as unknown as IChatInferenceParams,
	);
	//const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);

	// Actions
	const setCurrentSystemPrompt = useStore((s) => s.setCurrentSystemPrompt);
	const setCurrentInferenceParams = useStore((s) => s.setCurrentInferenceParams);

	// Debounced save
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const saveValuesRef = useRef<{
		currentThreadId: string;
		presetId: string | null;
		systemPrompt: string;
		params: string;
	} | null>(null);

	const flushChanges = useCallback(() => {
		const { currentThreadId, ...saveObj } = saveValuesRef.current!;
		updateThreadConfig(currentThreadId, saveObj);
	}, []);

	const debounceChange = useCallback(
		(newParams?: any, newPrompt?: any) => {
			if (!currentThreadId) return;
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

			saveValuesRef.current = {
				currentThreadId: currentThreadId!,
				presetId: selectedPresetId,
				systemPrompt: newPrompt !== undefined ? newPrompt : currentSystemPrompt,
				params: JSON.stringify(newParams || currentInferenceParams),
			};

			saveTimerRef.current = setTimeout(flushChanges, 400);
		},
		[
			currentThreadId,
			selectedPresetId,
			currentSystemPrompt,
			currentInferenceParams,
			flushChanges,
		],
	);

	const handleParamsChange = useCallback(
		(newParams: Partial<IChatInferenceParams>) => {
			setCurrentInferenceParams(newParams as unknown as Record<string, unknown>);
			debounceChange(newParams);
		},
		[debounceChange],
	);

	const handleSystemPromptChange = useCallback(
		(newPrompt: string) => {
			setCurrentSystemPrompt(newPrompt);
			debounceChange(undefined, newPrompt);
		},
		[debounceChange],
	);

	const flushPendingSaves = useCallback(() => {
		if (!saveTimerRef.current) return;
		clearTimeout(saveTimerRef.current);
		saveTimerRef.current = null;
		flushChanges();
	}, [flushChanges]);

	// Load workspace state from store or fetch
	const loadWorkspaceState = async (wsId: string) => {
		const store = useStore.getState();
		let wsState = store.workspaceStates[wsId];
		if (!wsState || Object.keys(wsState).length === 0) {
			const res = await fetchWorkspaceState(wsId);
			if (res.ok && res.data) {
				store.initWorkspaceState(wsId, res.data);
				wsState = res.data;
			}
		}
		return wsState;
	};

	// Apply workspace defaults
	const setWorkspaceDefaults = (wsState: Record<string, unknown>) => {
		const store = useStore.getState();
		if (wsState.defaultServerId) {
			store.setTempThreadServerId(wsState.defaultServerId as string);
		}
		if (wsState.defaultPresetId) {
			const preset = store.chatPresets.find((p) => p.id === wsState.defaultPresetId);
			if (preset) store.setCurrentSystemPrompt(preset.systemPrompt);
		}
		if (wsState.defaultModeId) {
			store.setThreadState(null, { modeId: wsState.defaultModeId as string });
		}
		const effort = (wsState.defaultReasoningEffort as string) ?? EReasoningEffort.NONE;
		store.setCurrentInferenceParams({
			reasoningEffort: effort,
			enableThinking: effort !== "none",
		} as unknown as Record<string, unknown>);
	};

	// Standard defaults (no workspace)
	const setDefaults = () => {
		setCurrentInferenceParams({
			reasoningEffort: EReasoningEffort.NONE,
			enableThinking: false,
		});
		setCurrentSystemPrompt("");
	};

	const loadConfig = useCallback(async (threadId: string | null) => {
		const store = useStore.getState();
		const wsId = store.activeWorkspaceId;

		const resolveDefaults = async () => {
			if (wsId) {
				const wsState = await loadWorkspaceState(wsId);
				if (wsState) {
					setWorkspaceDefaults(wsState);
				} else {
					setDefaults();
				}
			} else {
				setDefaults();
			}
		};

		if (!threadId) {
			await resolveDefaults();
			return;
		}

		const res = await fetchThreadConfig(threadId);
		if (!res.ok || !res.data) {
			await resolveDefaults();
			return;
		}

		const parsedParams = res.data.params ? JSON.parse(res.data.params) : {};
		setCurrentSystemPrompt(res.data.systemPrompt ?? "");
		setCurrentInferenceParams(parsedParams);
	}, []);

	useEffect(() => {
		flushPendingSaves();
		loadConfig(currentThreadId);
	}, [currentThreadId, flushPendingSaves, loadConfig]);

	return {
		handleParamsChange,
		handleSystemPromptChange,
		currentThreadId,
		currentSystemPrompt,
		currentInferenceParams,
	};
}
