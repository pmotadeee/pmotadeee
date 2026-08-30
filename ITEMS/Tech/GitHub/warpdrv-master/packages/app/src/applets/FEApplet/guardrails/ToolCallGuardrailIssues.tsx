import type { IGuardrailIssue } from "@warpcore/shared";
import { EGuardrailIssueType } from "@warpcore/shared";
import React, { useMemo } from "react";
import { useStore } from "@/store";

import { GuardrailAccordion } from "./GuardrailAccordion";
import { EMPTY_ARRAY } from "../constants";

export const ToolCallGuardrailIssues = React.memo(
	({
		children,
		toolCallId,
		messageId,
	}: {
		children: React.ReactNode;
		toolCallId: string;
		messageId: string;
	}) => {
		const results = useStore((s) => s.messageStates[messageId]?.guardrailResults) as Record<
			string,
			IGuardrailIssue[] | boolean
		>;

		const entries = useMemo(() => (results ? Object.entries(results) : EMPTY_ARRAY), [results]);
		const processingNames = useMemo(
			() => entries.filter(([, v]) => v === false).map(([name]) => name),
			[entries],
		);
		const doneEntries = useMemo(() => entries.filter(([, v]) => Array.isArray(v)), [entries]);
		const isProcessing = processingNames.length > 0;

		const issues = useMemo(() => {
			const collected: TGuardrailIssueEntry[] = [];
			for (const [name, result] of doneEntries) {
				for (const item of result as IGuardrailIssue[]) {
					if (item.toolCallId === toolCallId) {
						collected.push({ guardrailName: name, issue: item });
					}
				}
			}
			const violations = collected
				.filter((i) => i.issue.type === EGuardrailIssueType.VIOLATION)
				.sort((a, b) => a.guardrailName.localeCompare(b.guardrailName));
			const warnings = collected
				.filter((i) => i.issue.type === EGuardrailIssueType.WARNING)
				.sort((a, b) => a.guardrailName.localeCompare(b.guardrailName));
			return [...violations, ...warnings];
		}, [doneEntries, toolCallId]);

		if (!results) return children;

		return (
			<GuardrailAccordion
				issues={issues}
				isProcessing={isProcessing}
				processingNames={processingNames}
			>
				{children}
			</GuardrailAccordion>
		);
	},
);
