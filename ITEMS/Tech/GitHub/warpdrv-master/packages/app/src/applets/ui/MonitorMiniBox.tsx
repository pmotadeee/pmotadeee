import { Box, HStack, Text } from "@chakra-ui/react";
import { Bot, ChevronUp, Send } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { useStore } from "@/store";
import { consumeSubthreadNotifications } from "@/api/services";

const EMPTY = {};

export const MonitorMiniBox = memo(() => {
	const currentThreadId = useStore((s) => s.currentThreadId);
	const monitorBoxOpen = useStore((s) => s.monitorBoxOpen);
	const setMonitorBoxOpen = useStore((s) => s.setMonitorBoxOpen);
	const headMessageId = useStore((s) =>
		s.currentThreadId ? (s.headMessageIdByThread[s.currentThreadId] ?? null) : null,
	);
	const isRunning = useStore((s) =>
		s.currentThreadId ? (s.isRunningByThread[s.currentThreadId] ?? false) : false,
	);

	// Selector returns the stable reference to this thread's notifications map.
	// It only produces a new value when that map actually changes.
	const threadNotifs = useStore((s) =>
		s.currentThreadId ? (s.notificationsByThread[s.currentThreadId] ?? EMPTY) : EMPTY,
	);

	// The loop runs only when `threadNotifs` reference changes (i.e. when this
	// thread's notifications actually change), not on every render.
	const pendingIds = useMemo(() => {
		if (!currentThreadId) return [] as string[];
		const ids: string[] = [];
		for (const id of Object.keys(threadNotifs)) {
			const n = threadNotifs[id];
			if (n.senderType === "thread" && n.senderId !== currentThreadId) {
				ids.push(id);
			}
		}
		return ids;
	}, [threadNotifs, currentThreadId]);

	const [busy, setBusy] = useState(false);

	const handleExpand = useCallback(() => {
		setMonitorBoxOpen(true);
	}, [setMonitorBoxOpen]);

	const handleSend = useCallback(async () => {
		if (!currentThreadId || pendingIds.length === 0 || busy || isRunning) return;
		setBusy(true);
		try {
			await consumeSubthreadNotifications(currentThreadId, pendingIds, headMessageId);
		} catch (err) {
			console.error("[MonitorMiniBox] consume failed:", err);
		} finally {
			setBusy(false);
		}
	}, [currentThreadId, pendingIds, headMessageId, busy, isRunning]);

	// Only render when the full box is closed AND there are pending messages.
	if (monitorBoxOpen || pendingIds.length === 0) return null;

	const count = pendingIds.length;
	// Disable sending while an inference is running on this thread.
	const sendDisabled = busy || isRunning;

	return (
		<Box
			maxW="48rem"
			w="full"
			mx="auto"
			display="flex"
			alignItems="center"
			justifyContent="center"
			gap="2"
		>
			<HStack
				gap="2"
				align="center"
				px="3"
				py="2"
				borderWidth="1px"
				borderColor="var(--wc-border-default)"
				borderRadius="md"
				bg="var(--wc-bg-elevated)"
				shadow="0 2px 4px rgba(0,0,0,0.3)"
				cursor="pointer"
				_hover={{ borderColor: "var(--wc-accent-purple-border, rgba(167,139,250,0.25))" }}
				onClick={handleExpand}
				title="Expand monitoring box"
			>
				<Bot size={16} color="var(--wc-text-secondary)" />
				<Text
					fontSize="sm"
					color="var(--wc-text-secondary)"
					flex="1"
					minWidth="0"
					whiteSpace="nowrap"
					overflow="hidden"
					textOverflow="ellipsis"
				>
					{count} Agent Message{count !== 1 ? "s" : ""}
				</Text>
				<ChevronUp size={14} color="var(--wc-text-muted)" />
			</HStack>

			<Box
				as="button"
				display="flex"
				alignItems="center"
				gap="1"
				px="2"
				py="2"
				fontSize="xs"
				fontWeight="600"
				color="var(--wc-text-primary)"
				bg="var(--wc-bg-hover)"
				borderWidth="1px"
				borderColor="var(--wc-border-subtle)"
				borderRadius="md"
				cursor={sendDisabled ? "not-allowed" : "pointer"}
				opacity={sendDisabled ? 0.5 : 1}
				transition="all 0.15s ease"
				_hover={sendDisabled ? undefined : { bg: "var(--wc-bg-selected)" }}
				onClick={handleSend}
				disabled={sendDisabled}
				title={isRunning ? "Wait for inference to finish" : undefined}
			>
				<Send size={11} />
				Send Through
			</Box>
		</Box>
	);
});
