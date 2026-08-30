import {
	Box,
	Button,
	Flex,
	Input,
	SegmentGroup,
	Switch,
	Text,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import type { IGuardrailDefinition } from "@warpcore/shared";
import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	deleteGuardrail as deleteGuardrailApi,
	updateGuardrail as updateGuardrailApi,
} from "@/api/guardrail-services";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { PromptPicker } from "@/components/PromptPicker";
import { ServerPicker } from "@/components/ServerPicker";
import { useDependantState } from "@/hooks/useDependantState";

import { GuardrailToolPicker } from "./GuardrailToolPicker";

export const GuardrailRow = React.memo(({ guardrail }: { guardrail: IGuardrailDefinition }) => {
	const [expanded, setExpanded] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [draftName, setDraftName] = useDependantState(guardrail.name);
	const [draftPrompt, setDraftPrompt] = useDependantState(guardrail.prompt || "");
	const [draftMessagesCount, setDraftMessagesCount] = useDependantState(
		guardrail.messagesCount ?? 0,
	);
	const nameSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const promptSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const updateGuardrail = useCallback(
		async (patch: Partial<IGuardrailDefinition>) => {
			try {
				await updateGuardrailApi(guardrail.id, { ...guardrail, ...patch });
			} catch (e) {
				console.error("Failed to update guardrail:", e);
			}
		},
		[guardrail],
	);

	const flushName = useCallback(async () => {
		if (draftName === guardrail.name) return;
		try {
			await updateGuardrailApi(guardrail.id, { ...guardrail, name: draftName });
		} catch (e) {
			console.error("Failed to rename guardrail:", e);
		}
	}, [draftName, guardrail]);

	const handleNameBlur = useCallback(() => {
		setEditingName(false);
		if (nameSaveTimerRef.current) clearTimeout(nameSaveTimerRef.current);
		nameSaveTimerRef.current = setTimeout(flushName, 200);
	}, [flushName]);

	const flushPrompt = useCallback(() => {
		updateGuardrail({ prompt: draftPrompt });
	}, [draftPrompt, updateGuardrail]);

	const handlePromptBlur = useCallback(() => {
		if (promptSaveTimerRef.current) clearTimeout(promptSaveTimerRef.current);
		promptSaveTimerRef.current = setTimeout(flushPrompt, 200);
	}, [flushPrompt]);

	useEffect(() => {
		return () => {
			if (nameSaveTimerRef.current) clearTimeout(nameSaveTimerRef.current);
			if (promptSaveTimerRef.current) clearTimeout(promptSaveTimerRef.current);
		};
	}, []);

	const handleDelete = async () => {
		try {
			await deleteGuardrailApi(guardrail.id);
		} catch (e) {
			console.error("Failed to delete guardrail:", e);
		}
	};

	return (
		<Box
			borderWidth="1px"
			borderColor="var(--wc-border-subtle)"
			borderRadius="md"
			bg="var(--wc-bg-subtle)"
			overflow="visible"
		>
			<Flex
				align="center"
				gap="2"
				p="2.5"
				cursor="pointer"
				onClick={() => setExpanded(!expanded)}
			>
				{expanded ? (
					<ChevronDown size={14} color="var(--wc-text-muted)" />
				) : (
					<ChevronRight size={14} color="var(--wc-text-muted)" />
				)}
				{editingName ? (
					<Input
						size="xs"
						fontSize="xs"
						fontWeight="600"
						value={draftName}
						onChange={(e) => setDraftName(e.target.value)}
						onBlur={handleNameBlur}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleNameBlur();
						}}
						onClick={(e) => e.stopPropagation()}
						flex="1"
						minW="0"
					/>
				) : (
					<Flex align="center" gap="1.5" flex="1" minW="0">
						<Text
							fontSize="xs"
							fontWeight="600"
							color="var(--wc-text-primary)"
							textOverflow="ellipsis"
							overflow="hidden"
						>
							{draftName}
						</Text>

						<Edit2
							size={10}
							color="var(--wc-text-faint)"
							style={{ cursor: "pointer", flexShrink: 0 }}
							onClick={(e) => {
								e.stopPropagation();
								setEditingName(true);
							}}
						/>
					</Flex>
				)}
			</Flex>

			{expanded && (
				<VStack gap="2.5" px="2.5" pb="2.5" pt="0" align="stretch">
					<Box>
						<Text
							fontSize="9px"
							fontWeight="600"
							color="var(--wc-text-muted)"
							textTransform="uppercase"
							letterSpacing="0.04em"
							mb="1"
						>
							Server
						</Text>
						<ServerPicker
							value={guardrail.serverId}
							onChange={(id) => updateGuardrail({ serverId: id })}
						/>
					</Box>

					<Box>
						<Text
							fontSize="9px"
							fontWeight="600"
							color="var(--wc-text-muted)"
							textTransform="uppercase"
							letterSpacing="0.04em"
							mb="1"
						>
							Trigger only on tool calls
						</Text>
						<GuardrailToolPicker
							value={guardrail.triggerOnTools || []}
							onChange={(tools) => updateGuardrail({ triggerOnTools: tools })}
							onClick={(e) => e.stopPropagation()}
						/>
					</Box>

					<Flex gap="2" align="center">
						<Switch.Root
							size="sm"
							checked={guardrail.inferenceParams?.enableThinking as boolean}
							onCheckedChange={(details) => {
								const newParams = {
									...(guardrail.inferenceParams || {}),
									enableThinking: details.checked,
								};
								updateGuardrail({ inferenceParams: newParams });
							}}
							onClick={(e) => e.stopPropagation()}
						>
							<Switch.HiddenInput />
							<Switch.Control
								css={{
									bg: (guardrail.inferenceParams?.enableThinking as boolean)
										? "var(--wc-switch-active)"
										: "var(--wc-bg-active)",
								}}
							>
								<Switch.Thumb css={{ bg: "var(--wc-special-switch-thumb)" }} />
							</Switch.Control>
						</Switch.Root>
						<Text fontSize="xs" color="var(--wc-text-primary)">
							Enable thinking
						</Text>
					</Flex>

					{!!guardrail.inferenceParams?.enableThinking && (
						<Box>
							<Text
								fontSize="9px"
								fontWeight="600"
								color="var(--wc-text-muted)"
								textTransform="uppercase"
								letterSpacing="0.04em"
								mb="1"
							>
								Reasoning effort
							</Text>
							<SegmentGroup.Root
								value={
									(guardrail.inferenceParams?.reasoningEffort as string) ||
									"medium"
								}
								onValueChange={(details) => {
									const newParams = {
										...(guardrail.inferenceParams || {}),
										reasoningEffort: details.value,
									};
									updateGuardrail({ inferenceParams: newParams });
								}}
							>
								<SegmentGroup.Indicator />
								<SegmentGroup.Items items={["low", "medium", "high"]} />
							</SegmentGroup.Root>
						</Box>
					)}

					<Flex gap="2" align="center">
						<Switch.Root
							size="sm"
							checked={guardrail.includeBaseMessage ?? false}
							onCheckedChange={(details) =>
								updateGuardrail({ includeBaseMessage: details.checked })
							}
							onClick={(e) => e.stopPropagation()}
						>
							<Switch.HiddenInput />
							<Switch.Control
								css={{
									bg:
										(guardrail.includeBaseMessage ?? false)
											? "var(--wc-switch-active)"
											: "var(--wc-bg-active)",
								}}
							>
								<Switch.Thumb css={{ bg: "var(--wc-special-switch-thumb)" }} />
							</Switch.Control>
						</Switch.Root>
						<Text fontSize="xs" color="var(--wc-text-primary)">
							Include root message
						</Text>
					</Flex>

					<Box>
						<Text
							fontSize="9px"
							fontWeight="600"
							color="var(--wc-text-muted)"
							textTransform="uppercase"
							letterSpacing="0.04em"
							mb="1"
						>
							Include previous n messages
						</Text>
						<Input
							size="xs"
							fontSize="xs"
							type="number"
							min={0}
							value={draftMessagesCount}
							onChange={(e) => setDraftMessagesCount(Number(e.target.value))}
							onBlur={() => updateGuardrail({ messagesCount: draftMessagesCount })}
						/>
					</Box>

					<Box>
						<Text
							fontSize="9px"
							fontWeight="600"
							color="var(--wc-text-muted)"
							textTransform="uppercase"
							letterSpacing="0.04em"
							mb="1"
						>
							Saved Prompt
						</Text>
						<PromptPicker
							value={guardrail.promptId || ""}
							onChange={(promptId) =>
								updateGuardrail({ promptId: promptId || undefined })
							}
						/>
					</Box>

					<Box>
						<Text
							fontSize="9px"
							fontWeight="600"
							color="var(--wc-text-muted)"
							textTransform="uppercase"
							letterSpacing="0.04em"
							mb="1"
						>
							Custom Prompt
						</Text>
						<Textarea
							size="xs"
							fontSize="11px"
							value={draftPrompt}
							onChange={(e) => setDraftPrompt(e.target.value)}
							onBlur={handlePromptBlur}
							rows={3}
							resize="vertical"
							placeholder="Custom rules..."
						/>
					</Box>

					<Flex justifyContent="flex-end">
						<Button
							size="xs"
							fontSize="10px"
							px="2"
							py="1"
							borderRadius="sm"
							bg="var(--wc-accent-red-bg-8)"
							color="var(--wc-accent-red)"
							borderWidth="1px"
							borderColor="var(--wc-accent-red-border)"
							_hover={{ bg: "var(--wc-accent-red-hover)" }}
							onClick={() => setDeleteConfirmOpen(true)}
						>
							<Trash2 size={10} style={{ marginRight: "4px" }} />
							Delete
						</Button>
					</Flex>
				</VStack>
			)}

			{deleteConfirmOpen && (
				<ConfirmDialog
					title="Delete Guardrail"
					message={`Are you sure you want to delete "${draftName}"?`}
					isOpen={true}
					onConfirm={handleDelete}
					onCancel={() => setDeleteConfirmOpen(false)}
					confirmLabel="Delete"
				/>
			)}
		</Box>
	);
});
