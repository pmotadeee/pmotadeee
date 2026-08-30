import { HStack } from "@chakra-ui/react";
import type { IGuardrailIssue } from "@warpcore/shared";
import { EGuardrailIssueType } from "@warpcore/shared";
import React, { useMemo } from "react";
import { GoShield, GoShieldCheck } from "react-icons/go";
import { useStore } from "@/store";

import { EMPTY_ARRAY } from "../constants";

export const MiniToolCallGuardrailIndicator = React.memo(
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
		const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);

		const entries = useMemo(() => (results ? Object.entries(results) : EMPTY_ARRAY), [results]);
		const isProcessing = useMemo(() => entries.some(([, v]) => v === false), [entries]);
		const doneEntries = useMemo(() => entries.filter(([, v]) => Array.isArray(v)), [entries]);

		const violationCount = useMemo(() => {
			let count = 0;
			for (const [, result] of doneEntries) {
				for (const item of result as IGuardrailIssue[]) {
					if (
						item.toolCallId === toolCallId &&
						item.type === EGuardrailIssueType.VIOLATION
					)
						count++;
				}
			}
			return count;
		}, [doneEntries, toolCallId]);

		const warningCount = useMemo(() => {
			let count = 0;
			for (const [, result] of doneEntries) {
				for (const item of result as IGuardrailIssue[]) {
					if (item.toolCallId === toolCallId && item.type === EGuardrailIssueType.WARNING)
						count++;
				}
			}
			return count;
		}, [doneEntries, toolCallId]);

		if (!results) return children;

		return (
			<HStack gap="1" align="center" whiteSpace="nowrap">
				{children}
				{violationCount > 0 && (
					<GoShield size={chatFontSize} color="var(--wc-accent-red)" />
				)}
				{!violationCount && warningCount > 0 && (
					<GoShield size={chatFontSize} color="var(--wc-accent-yellow)" />
				)}
				{!isProcessing && !violationCount && !warningCount && (
					<GoShieldCheck
						size={chatFontSize}
						color="var(--wc-accent-green-icon)"
						opacity={0.8}
					/>
				)}
			</HStack>
		);
	},
);
