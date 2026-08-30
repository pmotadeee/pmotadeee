import { Box, Collapsible, HStack, Text } from "@chakra-ui/react";
import { Check, ChevronDown, ChevronRight, Square } from "lucide-react";
import React, { useState } from "react";
import { useStore } from "@/store";
// Per-row action buttons are temporarily disabled in favor of the footer's
// bulk "Send through selected" / "Ignore selected" actions. Re-enable these
// along with the commented-out handlers below to restore per-row buttons.
// import { consumeSubthreadNotifications, hideSubthreadNotification } from "@/api/services";

const TRUNCATE_AT = 90;

function truncate(s: string, n: number): string {
	return s.length > n ? s.slice(0, n) + "…" : s;
}

interface NotificationMessageRowProps {
	notificationId: string;
	threadId: string;
	selected: boolean;
	onToggle: () => void;
}

export const NotificationMessageRow = React.memo(
	({ notificationId, threadId, selected, onToggle }: NotificationMessageRowProps) => {
		const notification = useStore((s) => s.notificationsByThread[threadId]?.[notificationId]);
		// Per-row action handlers are temporarily disabled (see footer bulk actions).
		// const headMessageId = useStore((s) =>
		// 	s.currentThreadId ? (s.headMessageIdByThread[s.currentThreadId] ?? null) : null,
		// );
		const [expanded, setExpanded] = useState(false);
		// const [actioning, setActioning] = useState(false);

		// const handleIgnore = useCallback(
		// 	async (e: React.MouseEvent) => {
		// 		e.stopPropagation();
		// 		if (actioning) return;
		// 		setActioning(true);
		// 		try {
		// 			await hideSubthreadNotification(threadId, notificationId);
		// 		} catch {
		// 			// SSE will handle the update
		// 		} finally {
		// 			setActioning(false);
		// 		}
		// 	},
		// 	[threadId, notificationId, actioning],
		// );

		// const handleSend = useCallback(
		// 	async (e: React.MouseEvent) => {
		// 		e.stopPropagation();
		// 		if (actioning) return;
		// 		setActioning(true);
		// 		try {
		// 			await consumeSubthreadNotifications(threadId, [notificationId], headMessageId);
		// 		} catch {
		// 			// SSE will handle the update
		// 		} finally {
		// 			setActioning(false);
		// 		}
		// 	},
		// 	[threadId, notificationId, headMessageId, actioning],
		// );

		if (!notification) return null;

		const message = (notification.payload.message as string) ?? "";

		return (
			<Collapsible.Root open={expanded} onOpenChange={(o) => setExpanded(o.open)}>
				<Box
					borderWidth="1px"
					borderColor={
						selected
							? "var(--wc-accent-purple-border, rgba(167,139,250,0.5))"
							: "var(--wc-border-subtle)"
					}
					borderRadius="md"
					bg={selected ? "var(--wc-bg-selected)" : "var(--wc-bg-surface)"}
					overflow="hidden"
					mb="1"
				>
					<Box px="2" py="1.5" cursor="pointer" onClick={onToggle}>
						<HStack gap="1.5" align="flex-start">
							<Box
								as="button"
								display="flex"
								alignItems="center"
								justifyContent="center"
								width="16px"
								height="16px"
								flexShrink="0"
								mt="0.5"
								borderRadius="sm"
								color={
									selected ? "var(--wc-accent-purple)" : "var(--wc-text-muted)"
								}
								cursor="pointer"
								_hover={{ color: "var(--wc-accent-purple)" }}
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									onToggle();
								}}
								title={selected ? "Deselect" : "Select"}
							>
								{selected ? <Check size={14} /> : <Square size={14} />}
							</Box>

							{/* Message text (truncated when collapsed, full when expanded) */}
							<Box flex="1" minWidth="0">
								<Text
									fontSize="xs"
									color="var(--wc-text-primary)"
									whiteSpace="pre-wrap"
									wordBreak="break-word"
								>
									{expanded ? message : truncate(message, TRUNCATE_AT)}
								</Text>
							</Box>

							{/* Expand/collapse chevron */}
							<Box
								as="button"
								display="flex"
								alignItems="center"
								justifyContent="center"
								flexShrink="0"
								mt="0.5"
								width="16px"
								height="16px"
								borderRadius="sm"
								color="var(--wc-text-muted)"
								cursor="pointer"
								_hover={{
									bg: "var(--wc-bg-hover)",
									color: "var(--wc-text-primary)",
								}}
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									setExpanded(!expanded);
								}}
								title={expanded ? "Collapse" : "Expand"}
							>
								{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
							</Box>

							{/* Per-row action buttons (temporarily disabled in favor of footer bulk actions)
								<HStack gap="1" flexShrink="0" mt="0.5">
									<Box
										as="button"
										px="1.5"
										py="0.5"
										borderRadius="sm"
										bg={actioning ? "var(--wc-bg-subtle)" : "var(--wc-accent-green-bg-15)"}
										color={actioning ? "var(--wc-text-muted)" : "var(--wc-accent-green)"}
										fontSize="xs"
										fontWeight="500"
										cursor={actioning ? "not-allowed" : "pointer"}
										_hover={{
											bg: actioning ? undefined : "var(--wc-accent-green-hover)",
										}}
										onClick={handleSend}
										title="Send this message through"
									>
										{actioning ? <Loader size={10} className="animate-spin" /> : "Send"}
									</Box>
									<Box
										as="button"
										px="1.5"
										py="0.5"
										borderRadius="sm"
										bg={actioning ? "var(--wc-bg-subtle)" : "var(--wc-bg-subtle)"}
										color={actioning ? "var(--wc-text-muted)" : "var(--wc-text-muted)"}
										fontSize="xs"
										fontWeight="500"
										cursor={actioning ? "not-allowed" : "pointer"}
										_hover={{ bg: "var(--wc-bg-hover)" }}
										onClick={handleIgnore}
										title="Ignore this message"
									>
										Ignore
									</Box>
								</HStack>
								*/}
						</HStack>
					</Box>
				</Box>
			</Collapsible.Root>
		);
	},
);
