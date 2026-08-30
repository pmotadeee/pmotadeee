import { useEffect } from "react";
import { fetchWorkspaceState } from "@/api/services";
import { useStore } from "../store";

function applyDefaults(wsState: Record<string, unknown>) {
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
	if (wsState.defaultReasoningEffort) {
		const effort = wsState.defaultReasoningEffort as string;
		store.setCurrentInferenceParams({
			reasoningEffort: effort,
			enableThinking: effort !== "none",
		} as unknown as Record<string, unknown>);
	}
}

export function useWorkspace() {
	const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);
	const currentThread = useStore((s) =>
		s.currentThreadId ? s.threads[s.currentThreadId] : undefined,
	);

	useEffect(() => {
		if (!activeWorkspaceId) return;

		const isNewThread = !currentThread;
		const store = useStore.getState();
		const wsState = store.workspaceStates[activeWorkspaceId];

		if (wsState && Object.keys(wsState).length > 0) {
			if (isNewThread) {
				setTimeout(() => applyDefaults(wsState), 1);
			}
			return;
		}

		(async () => {
			const res = await fetchWorkspaceState(activeWorkspaceId);
			if (res.ok && res.data !== null && res.data !== undefined) {
				useStore.getState().initWorkspaceState(activeWorkspaceId, res.data);
				const state = useStore.getState();
				const thread = state.currentThreadId
					? state.threads[state.currentThreadId]
					: undefined;
				if (!thread) {
					setTimeout(() => applyDefaults(res.data), 1);
				}
			}
		})();
	}, [activeWorkspaceId, currentThread]);
}
