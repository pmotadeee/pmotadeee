import { useAuiState } from "@assistant-ui/react";
import type { IGuardrailIssue } from "@warpcore/shared";
import { EGuardrailIssueType } from "@warpcore/shared";
import React, { useMemo } from "react";
import { GoShieldCheck } from "react-icons/go";
import { useStore } from "@/store";

import { EMPTY_ARRAY } from "../constants";

export const GuardrailShieldCheck = React.memo(() => {
	const messageId = useAuiState((s) => s.message.id);
	const role = useAuiState((s) => s.message.role);
	const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);

	const results = useStore((s) => s.messageStates[messageId]?.guardrailResults) as Record<
		string,
		IGuardrailIssue[] | boolean
	>;

	const entries = useMemo(() => (results ? Object.entries(results) : EMPTY_ARRAY), [results]);
	const isProcessing = useMemo(() => entries.some(([, v]) => v === false), [entries]);
	const doneEntries = useMemo(() => entries.filter(([, v]) => Array.isArray(v)), [entries]);

	const totalIssues = useMemo(() => {
		let count = 0;
		for (const [, result] of doneEntries) {
			for (const item of result as IGuardrailIssue[]) {
				if (
					item.type === EGuardrailIssueType.VIOLATION ||
					item.type === EGuardrailIssueType.WARNING
				)
					count++;
			}
		}
		return count;
	}, [doneEntries]);

	const allClear = !isProcessing && doneEntries.length > 0 && totalIssues === 0;

	if (role !== "assistant" || !results || !allClear) return null;
	return <GoShieldCheck size={chatFontSize} color="var(--wc-accent-green-icon)" opacity={0.8} />;
});
