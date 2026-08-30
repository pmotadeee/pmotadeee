import { useAuiState } from "@assistant-ui/react";
import type { IGuardrailError, IGuardrailIssue } from "@warpcore/shared";
import { EGuardrailIssueType } from "@warpcore/shared";
import React, { useMemo } from "react";
import { useStore } from "@/store";
import type { TUiSpaceComponentDef } from "@/store/slices/uiSpaces";

import { GuardrailAccordion } from "./GuardrailAccordion";
import { EMPTY_ARRAY } from "../constants";

export const GuardrailResults = React.memo(
	({ def, children }: { def: TUiSpaceComponentDef; children: React.ReactNode }) => {
		const messageId = useAuiState((s) => s.message.id);
		const role = useAuiState((s) => s.message.role);
		const results = useStore((s) => s.messageStates[messageId]?.guardrailResults) as Record<
			string,
			IGuardrailIssue[] | boolean
		>;
		const errors = useStore((s) => s.messageStates[messageId]?.guardrailErrors) as Record<
			string,
			IGuardrailError
		>;

		const entries = useMemo(() => (results ? Object.entries(results) : EMPTY_ARRAY), [results]);
		const processingNames = useMemo(
			() => entries.filter(([, v]) => v === false).map(([name]) => name),
			[entries],
		);
		const doneEntries = useMemo(() => entries.filter(([, v]) => Array.isArray(v)), [entries]);
		const isProcessing = processingNames.length > 0;

		const errorEntries = useMemo(() => {
			if (!errors) return EMPTY_ARRAY;
			return Object.entries(errors).filter(([name]) => {
				// Only include errors for guardrails that are in the results (meaning they were active)
				return results && name in results;
			});
		}, [errors, results]);

		const allIssues = useMemo(() => {
			const collected: TGuardrailIssueEntry[] = [];
			for (const [name, result] of doneEntries) {
				for (const item of result as IGuardrailIssue[]) {
					collected.push({ guardrailName: name, issue: item });
				}
			}
			const violations = collected
				.filter((i) => i.issue.type === EGuardrailIssueType.VIOLATION)
				.sort((a, b) => a.guardrailName.localeCompare(b.guardrailName));
			const warnings = collected
				.filter((i) => i.issue.type === EGuardrailIssueType.WARNING)
				.sort((a, b) => a.guardrailName.localeCompare(b.guardrailName));
			return [...violations, ...warnings];
		}, [doneEntries]);

		if (role !== "assistant" || !results) return children;
		else if (allIssues.length === 0 && errorEntries.length === 0) return children;

		return (
			<GuardrailAccordion
				issues={allIssues}
				isProcessing={isProcessing}
				processingNames={processingNames}
				errorEntries={errorEntries}
			>
				{children}
			</GuardrailAccordion>
		);
	},
);
