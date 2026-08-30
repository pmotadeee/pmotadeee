import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Bot, Check, Loader, Minus, Square } from "lucide-react";
import React, { useCallback } from "react";
import { useStore } from "@/store";
import { useShallow } from "zustand/shallow";
import { NotificationMessageRow } from "./NotificationMessageRow";

interface SubthreadRowProps {
	childThreadId: string;
	parentThreadId: string;
	selected: Set<string>;
	onToggle: (id: string) => void;
	onToggleMany: (ids: string[], select: boolean) => void;
}

export const SubthreadRow = React.memo(
	({ childThreadId, parentThreadId, selected, onToggle, onToggleMany }: SubthreadRowProps) => {
		const threadTitle = useStore((s) => s.threads[childThreadId]?.title);
		const originalAgent = useStore(
			(s) =>
				s.threadStates[childThreadId]?.originalAgent as
					| { id: string; name: string }
					| undefined,
		);
		const currentStatus = useStore(
			(s) => s.threadStates[childThreadId]?.currentStatus as string | undefined,
		);
		const isRunning = useStore((s) => s.isRunningByThread[childThreadId] ?? false);
		const notificationIds = useStore(
			useShallow((s): string[] => {
				const threadNotifs = s.notificationsByThread[parentThreadId] ?? {};
				const ids: string[] = [];
				for (const id of Object.keys(threadNotifs)) {
					const n = threadNotifs[id];
					if (n.senderId === childThreadId) {
						ids.push(id);
					}
				}
				return ids;
			}),
		);

		const handleStop = useCallback(async () => {
			await fetch(`/api/chat/cancel/${childThreadId}`, { method: "POST" });
		}, [childThreadId]);

		if (!isRunning && notificationIds.length === 0) return null;

		const selectedCount = notificationIds.filter((id) => selected.has(id)).length;
		const allSelected = notificationIds.length > 0 && selectedCount === notificationIds.length;
		const someSelected = selectedCount > 0 && !allSelected;

		return (
			<VStack gap="2" align="stretch" w="full">
				<HStack gap="2" align="flex-start">
					{notificationIds.length > 0 && (
						<Box
							as="button"
							type="button"
							display="flex"
							alignItems="center"
							justifyContent="center"
							width="16px"
							height="16px"
							flexShrink="0"
							mt="0.5"
							borderRadius="sm"
							color={
								allSelected || someSelected
									? "var(--wc-accent-purple)"
									: "var(--wc-text-muted)"
							}
							cursor="pointer"
							_hover={{ color: "var(--wc-accent-purple)" }}
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
								onToggleMany(notificationIds, !allSelected);
							}}
							title={
								allSelected
									? "Deselect all messages in this thread"
									: "Select all messages in this thread"
							}
						>
							{allSelected ? (
								<Check size={14} />
							) : someSelected ? (
								<Minus size={14} />
							) : (
								<Square size={14} />
							)}
						</Box>
					)}
					<Box flex="1" minWidth="0">
						<HStack gap="1.5" align="center">
							{originalAgent ? (
								<>
									<Bot size={12} color="var(--wc-text-muted)" />
									<Text
										fontSize="xs"
										fontWeight="600"
										color="var(--wc-text-primary)"
									>
										{originalAgent.name}
									</Text>
								</>
							) : (
								<Text fontSize="xs" fontWeight="600" color="var(--wc-text-faint)">
									Loading…
								</Text>
							)}
							<Text
								fontSize="xs"
								color="var(--wc-text-muted)"
								overflow="hidden"
								textOverflow="ellipsis"
								whiteSpace="nowrap"
							>
								{threadTitle}
							</Text>
						</HStack>

						{isRunning && (
							<HStack gap="1.5" align="center" mt="1">
								<Loader
									size={12}
									color="var(--wc-accent-yellow-strong)"
									className="animate-spin"
								/>
								<Text
									fontSize="xs"
									color="var(--wc-text-muted)"
									overflow="hidden"
									textOverflow="ellipsis"
									whiteSpace="nowrap"
								>
									{currentStatus ?? "Running…"}
								</Text>
								<Box
									as="button"
									type="button"
									aria-label="Stop subthread"
									title="Stop subthread"
									onClick={handleStop}
									cursor="pointer"
									display="flex"
									alignItems="center"
									justifyContent="center"
									ml="auto"
									_hover={{ color: "var(--wc-accent-red)" }}
								>
									<Square
										size={12}
										fill="currentColor"
										color="var(--wc-text-muted)"
									/>
								</Box>
							</HStack>
						)}
					</Box>
				</HStack>

				{notificationIds.length > 0 && (
					<Box pl="2">
						{notificationIds.map((id) => (
							<NotificationMessageRow
								key={id}
								notificationId={id}
								threadId={parentThreadId}
								selected={selected.has(id)}
								onToggle={() => onToggle(id)}
							/>
						))}
					</Box>
				)}
			</VStack>
		);
	},
);
