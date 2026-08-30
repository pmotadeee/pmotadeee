import { updateModeGuardrails as updateModeGuardrailsApi } from "@/api/mode-services";
import { useStore } from "@/store";

export const toggleActiveGuardrail = (guardrailName: string, activate: boolean) => {
	const state = useStore.getState();
	const threadId = state.currentThreadId;
	const ts = state.getCurrentThreadState(state);
	const modeId = ts?.modeId as string | undefined;
	const activeNames =
		((modeId ? state.modes[modeId]?.activeGuardrails : ts?.activeGuardrails) as string[]) || [];

	const newNames = activate
		? [...activeNames, guardrailName]
		: activeNames.filter((n) => n !== guardrailName);

	if (modeId && state.modes[modeId]) {
		updateModeGuardrailsApi(modeId, newNames);
	} else {
		state.setThreadState(threadId, { activeGuardrails: newNames });
	}
};

/* ============================================================
 * Agent Row — expandable row with editable fields
 * ============================================================ */
