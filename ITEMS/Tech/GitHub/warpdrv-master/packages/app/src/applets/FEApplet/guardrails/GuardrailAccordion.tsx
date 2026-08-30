import {
	AccordionItem as AccordionItemComp,
	AccordionItemContent,
	AccordionItemTrigger,
	AccordionRoot,
	Badge,
	Box,
	HStack,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { IGuardrailError } from "@warpcore/shared";
import { EGuardrailIssueType } from "@warpcore/shared";
import { ChevronDown } from "lucide-react";
import React, { useMemo } from "react";
import { GoShield, GoShieldCheck } from "react-icons/go";
import { useStore } from "@/store";

import { GuardrailErrorItem, TGuardrailIssueEntry } from "./GuardrailErrorItem";
import { GuardrailIssueItem } from "./GuardrailIssueItem";

export const GuardrailAccordion = React.memo(
	({
		children,
		issues,
		isProcessing,
		processingNames,
		errorEntries,
	}: {
		children: React.ReactNode;
		issues: TGuardrailIssueEntry[];
		isProcessing: boolean;
		processingNames: string[];
		errorEntries?: Array<[string, IGuardrailError]>;
	}) => {
		const chatFontSize = useStore((s) => s.settings.chatFontSize ?? 14);
		const totalViolations = useMemo(
			() => issues.filter((i) => i.issue.type === EGuardrailIssueType.VIOLATION).length,
			[issues],
		);
		const totalWarnings = useMemo(
			() => issues.filter((i) => i.issue.type === EGuardrailIssueType.WARNING).length,
			[issues],
		);
		const totalErrors = (errorEntries || []).length;
		const allClear = !isProcessing && issues.length === 0 && totalErrors === 0;

		return (
			<>
				{children}
				<Box mx="15px" mt="1" mb="2">
					<AccordionRoot collapsible>
						<AccordionItemComp
							value="guardrails"
							borderRadius="10px"
							borderWidth="1px"
							borderColor="var(--wc-border-subtle)"
						>
							<AccordionItemTrigger
								style={{
									borderRadius: "10px 10px 0 0",
									background: "var(--wc-bg-card)",
									border: "none",
									cursor: "pointer",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									width: "100%",
								}}
								px="2.5"
								py="1.5"
								_hover={{ bg: "var(--wc-bg-subtle)" }}
								css={{
									"&[data-state=open] .chevron": { transform: "rotate(180deg)" },
								}}
							>
								<HStack gap="2">
									{(totalViolations > 0 || totalErrors > 0) && (
										<GoShield
											size={chatFontSize}
											color="var(--wc-accent-red)"
										/>
									)}
									{!totalViolations && !totalErrors && totalWarnings > 0 && (
										<GoShield
											size={chatFontSize}
											color="var(--wc-accent-yellow)"
										/>
									)}
									{isProcessing && (
										<Spinner size="xs" color="var(--wc-text-muted)" />
									)}
									{allClear && (
										<GoShieldCheck
											size={chatFontSize}
											color="var(--wc-accent-green-icon)"
											opacity={0.8}
										/>
									)}
									{(totalViolations > 0 || totalErrors > 0) && (
										<Badge
											color="var(--wc-accent-red)"
											bg="var(--wc-accent-red-bg-8)"
											px="1.5"
											py="0.5"
											fontSize="11px"
										>
											{totalViolations + totalErrors} Issue
											{totalViolations + totalErrors !== 1 ? "s" : ""}
										</Badge>
									)}
									{totalWarnings > 0 && (
										<Badge
											color="var(--wc-accent-yellow)"
											bg="var(--wc-accent-yellow-bg-8)"
											px="1.5"
											py="0.5"
											fontSize="11px"
										>
											{totalWarnings} Warnings
										</Badge>
									)}
								</HStack>
								<HStack gap="2" align="center">
									<ChevronDown
										size={16}
										color="var(--wc-text-muted)"
										className="chevron"
										css={{ transition: "transform 0.15s ease" }}
									/>
								</HStack>
							</AccordionItemTrigger>
							<AccordionItemContent>
								<Box p="2.5">
									{allClear ? (
										<Text fontSize="sm" color="var(--wc-accent-green)">
											All clear
										</Text>
									) : (
										<VStack gap="2" align="stretch">
											{processingNames.map((name) => (
												<HStack key={name} gap="2">
													<Spinner size="sm" />
													<Text
														fontSize="sm"
														color="var(--wc-text-muted)"
													>
														Processing {name}...
													</Text>
												</HStack>
											))}
											{errorEntries?.map(([name, error], i) => (
												<GuardrailErrorItem
													key={`error-${i}`}
													guardrailName={name}
													error={error}
												/>
											))}
											{issues.map(({ guardrailName, issue }, i) => (
												<GuardrailIssueItem
													key={i}
													guardrailName={guardrailName}
													item={issue}
												/>
											))}
										</VStack>
									)}
								</Box>
							</AccordionItemContent>
						</AccordionItemComp>
					</AccordionRoot>
				</Box>
			</>
		);
	},
);
