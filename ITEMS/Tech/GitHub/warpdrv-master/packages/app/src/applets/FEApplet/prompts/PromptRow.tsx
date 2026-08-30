import { Box, Button, Flex, Input, Text, Textarea, VStack } from "@chakra-ui/react";
import type { IChatPrompt } from "@warpcore/shared";
import { ChevronDown, ChevronRight, FileText, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { WithErrorBoundary } from "@/components/WithErrorBoundary";
import { useDependantState } from "@/hooks/useDependantState";
import { useStore } from "@/store";

export const PromptRow = React.memo(({ prompt }: { prompt: IChatPrompt }) => {
	const [expanded, setExpanded] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [draftName, setDraftName] = useDependantState(prompt.name);
	const [draftContent, setDraftContent] = useDependantState(prompt.content);
	const nameSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const contentSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const updatePrompt = useCallback(
		async (patch: { name?: string; content?: string }) => {
			try {
				await useStore.getState().updateChatPrompt(prompt.id, patch);
			} catch (e) {
				console.error("Failed to update prompt:", e);
			}
		},
		[prompt.id],
	);

	const handleNameBlur = useCallback(() => {
		if (nameSaveTimerRef.current) clearTimeout(nameSaveTimerRef.current);
		nameSaveTimerRef.current = setTimeout(() => {
			if (draftName !== prompt.name) {
				updatePrompt({ name: draftName || "" });
			}
		}, 200);
	}, [draftName, prompt.name, updatePrompt]);

	const handleContentBlur = useCallback(() => {
		if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);
		contentSaveTimerRef.current = setTimeout(() => {
			if (draftContent !== prompt.content) {
				updatePrompt({ content: draftContent });
			}
		}, 200);
	}, [draftContent, prompt.content, updatePrompt]);

	useEffect(() => {
		return () => {
			if (nameSaveTimerRef.current) clearTimeout(nameSaveTimerRef.current);
			if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);
		};
	}, []);

	const handleDelete = async () => {
		try {
			await useStore.getState().removeChatPrompt(prompt.id);
		} catch (e) {
			console.error("Failed to delete prompt:", e);
		}
		setDeleteConfirmOpen(false);
	};

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
					<FileText size={14} color="var(--wc-text-muted)" style={{ flexShrink: 0 }} />
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
								Content
							</Text>
							<Textarea
								size="xs"
								fontSize="xs"
								rows={6}
								placeholder="Prompt content..."
								value={draftContent}
								onChange={(e) => setDraftContent(e.target.value)}
								onBlur={handleContentBlur}
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
					title="Delete Prompt"
					message={`Are you sure you want to delete "${prompt.name}"?`}
					isOpen={true}
					onConfirm={handleDelete}
					onCancel={() => setDeleteConfirmOpen(false)}
					confirmLabel="Delete"
				/>
			)}
		</>
	);
});

export const PromptsPanel = React.memo(() => {
	const prompts = useStore((s) => s.chatPrompts);

	if (!prompts.length) {
		return (
			<Box p="4">
				<Text fontSize="xs" color="var(--wc-text-muted)" textAlign="center">
					No prompts
				</Text>
			</Box>
		);
	}

	return (
		<WithErrorBoundary name="PromptsPanel">
			<VStack gap="2" p="3" align="stretch">
				{prompts.map((p) => (
					<PromptRow key={p.id} prompt={p} />
				))}
			</VStack>
		</WithErrorBoundary>
	);
});
