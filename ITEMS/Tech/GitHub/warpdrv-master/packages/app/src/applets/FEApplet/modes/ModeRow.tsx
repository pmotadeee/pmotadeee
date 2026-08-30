import {
	Box,
	Button,
	ColorPicker,
	Flex,
	Input,
	parseColor,
	Text,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import type { IMode } from "@warpcore/shared";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	deleteMode as deleteModeApi,
	updateMode as updateModeApi,
	updateModeGuardrails as updateModeGuardrailsApi,
} from "@/api/mode-services";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { PromptPicker } from "@/components/PromptPicker";
import { useDependantState } from "@/hooks/useDependantState";

import { GuardrailToolPicker } from "../guardrails/GuardrailToolPicker";
import { AgentPicker } from "../agents/AgentPicker";
import { GuardrailPicker } from "../../ui/GuardrailBadge";

export const ModeRow = React.memo(({ mode }: { mode: IMode }) => {
	const [expanded, setExpanded] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [draftName, setDraftName] = useDependantState(mode.name);
	const [draftPrompt, setDraftPrompt] = useDependantState(mode.prompt || "");
	const [draftColor, setDraftColor] = useDependantState(mode.color || "#a78bfa");
	const [draftTools, setDraftTools] = useDependantState(mode.allowedTools);
	const nameSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const promptSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const updateMode = useCallback(
		async (patch: Partial<IMode>) => {
			try {
				await updateModeApi(mode.id, patch);
			} catch (e) {
				console.error("Failed to update mode:", e);
			}
		},
		[mode.id],
	);

	const handleNameBlur = useCallback(() => {
		if (nameSaveTimerRef.current) clearTimeout(nameSaveTimerRef.current);
		nameSaveTimerRef.current = setTimeout(() => {
			if (draftName !== mode.name) {
				updateMode({ name: draftName || "" });
			}
		}, 200);
	}, [draftName, mode.name, updateMode]);

	const handlePromptBlur = useCallback(() => {
		if (promptSaveTimerRef.current) clearTimeout(promptSaveTimerRef.current);
		promptSaveTimerRef.current = setTimeout(() => {
			if (draftPrompt !== (mode.prompt || "")) {
				updateMode({ prompt: draftPrompt || undefined });
			}
		}, 200);
	}, [draftPrompt, mode.prompt, updateMode]);

	useEffect(() => {
		return () => {
			if (nameSaveTimerRef.current) clearTimeout(nameSaveTimerRef.current);
			if (promptSaveTimerRef.current) clearTimeout(promptSaveTimerRef.current);
		};
	}, []);

	const handleDelete = async () => {
		try {
			await deleteModeApi(mode.id);
		} catch (e) {
			console.error("Failed to delete mode:", e);
		}
		setDeleteConfirmOpen(false);
	};

	const mc = mode.color || "#a78bfa";

	return (
		<>
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
					<Box
						style={{
							width: "10px",
							height: "10px",
							borderRadius: "3px",
							background: mc,
							flexShrink: 0,
						}}
					/>
					<Input
						size="xs"
						fontSize="xs"
						fontWeight="600"
						color="var(--wc-text-primary)"
						value={draftName}
						onChange={(e) => setDraftName(e.target.value)}
						onBlur={handleNameBlur}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleNameBlur();
						}}
						onClick={(e) => e.stopPropagation()}
						flex="1"
						minW="0"
						bg="transparent"
						borderColor="var(--wc-border-subtle)"
						borderWidth="1px"
						borderRadius="sm"
						_focus={{ borderColor: "var(--wc-border-active)" }}
					/>
					{expanded ? (
						<ChevronDown size={14} color="var(--wc-text-muted)" />
					) : (
						<ChevronRight size={14} color="var(--wc-text-muted)" />
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
								Color
							</Text>
							<ColorPicker.Root
								defaultValue={parseColor(draftColor)}
								onValueChange={(details) => {
									const hex = details.value.toString("hex");
									setDraftColor(hex);
									updateMode({ color: hex });
								}}
							>
								<ColorPicker.HiddenInput />
								<ColorPicker.Control>
									<ColorPicker.Input />
									<ColorPicker.Trigger />
								</ColorPicker.Control>
								<ColorPicker.Positioner>
									<ColorPicker.Content>
										<ColorPicker.Area />
										<ColorPicker.Sliders />
									</ColorPicker.Content>
								</ColorPicker.Positioner>
							</ColorPicker.Root>
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
								Allowed tools
							</Text>
							<GuardrailToolPicker
								value={draftTools}
								onChange={(tools) => {
									setDraftTools(tools);
									updateMode({ allowedTools: tools });
								}}
								onClick={(e) => e.stopPropagation()}
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
								Active guardrails
							</Text>
							<GuardrailPicker
								value={mode.activeGuardrails || []}
								onChange={(ids) => updateModeGuardrailsApi(mode.id, ids)}
								onClick={(e) => e.stopPropagation()}
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
								Allowed agents
							</Text>
							<AgentPicker
								value={mode.allowedAgents || []}
								onChange={(agents) => {
									updateMode({ allowedAgents: agents });
								}}
								onClick={(e) => e.stopPropagation()}
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
								value={mode.promptId || ""}
								onChange={(promptId) =>
									updateMode({ promptId: promptId || undefined })
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
								Tail prompt
							</Text>
							<Textarea
								size="xs"
								fontSize="xs"
								rows={3}
								placeholder="Optional tail prompt..."
								value={draftPrompt}
								onChange={(e) => setDraftPrompt(e.target.value)}
								onBlur={handlePromptBlur}
								bg="var(--wc-bg-subtle)"
								borderColor="var(--wc-border-default)"
								borderWidth="1px"
								borderRadius="md"
							/>
						</Box>

						<Flex justify="flex-end">
							<Button
								size="xs"
								fontSize="xs"
								color="var(--wc-accent-red)"
								bg="var(--wc-accent-red-bg-8)"
								leftIcon={<Trash2 size={12} />}
								onClick={(e) => {
									e.stopPropagation();
									setDeleteConfirmOpen(true);
								}}
							>
								Delete
							</Button>
						</Flex>
					</VStack>
				)}
			</Box>

			{deleteConfirmOpen && (
				<ConfirmDialog
					title="Delete Mode"
					message={`Are you sure you want to delete "${mode.name}"?`}
					isOpen={true}
					onConfirm={handleDelete}
					onCancel={() => setDeleteConfirmOpen(false)}
					confirmLabel="Delete"
				/>
			)}
		</>
	);
});
