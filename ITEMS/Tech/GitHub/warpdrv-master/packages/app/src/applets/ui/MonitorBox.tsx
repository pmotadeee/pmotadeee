import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Check, Minus, Monitor, Send, Square, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/store";
import type { TThreadId } from "@warpcore/bridge";
import { SubthreadRow } from "./SubthreadRow";
import { consumeSubthreadNotifications, hideSubthreadNotification } from "@/api/services";

const EMPTY: Record<string, never> = {};

export const MonitorBox = memo(() => {
	const monitorBoxOpen = useStore((s) => s.monitorBoxOpen);
	const setMonitorBoxOpen = useStore((s) => s.setMonitorBoxOpen);
	const currentThreadId = useStore((s) => s.currentThreadId);
	const threads = useStore((s) => s.threads);

	const childThreadIds = useMemo(() => {
		if (!currentThreadId) return [] as TThreadId[];
		const ids: TThreadId[] = [];
		for (const id of Object.keys(threads)) {
			if (threads[id]?.parentId === currentThreadId) {
				ids.push(id as TThreadId);
			}
		}
		ids.sort((a, b) => threads[a].createdAt - threads[b].createdAt);
		return ids;
	}, [currentThreadId, threads]);

	useEffect(() => {
		if (!monitorBoxOpen || !childThreadIds.length) return;
		const state = useStore.getState();
		const unloaded: TThreadId[] = [];
		for (const id of childThreadIds) {
			if (!state.threadStates[id]) {
				unloaded.push(id);
			}
		}
		if (unloaded.length === 0) return;
		const promises = unloaded.map((id) =>
			fetch(`/api/chat/threads/${id}/state`)
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data?.data) {
						state.initThreadState(id, data.data);
					}
				})
				.catch(() => {}),
		);
		Promise.allSettled(promises);
	}, [monitorBoxOpen, childThreadIds]);

	const handleClose = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setMonitorBoxOpen(false);
		},
		[setMonitorBoxOpen],
	);

	// ===== Selection state =====
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [busy, setBusy] = useState(false);
	const headMessageId = useStore((s) =>
		s.currentThreadId ? (s.headMessageIdByThread[s.currentThreadId] ?? null) : null,
	);
	const isRunning = useStore((s) =>
		s.currentThreadId ? (s.isRunningByThread[s.currentThreadId] ?? false) : false,
	);

	// All pending notification ids across all children (for pruning stale selections).
	// Use a stable EMPTY constant so the selector returns a consistent reference
	// when the map is absent (prevents infinite re-render loops).
	const threadNotifs = useStore((s) =>
		s.currentThreadId ? (s.notificationsByThread[s.currentThreadId] ?? EMPTY) : EMPTY,
	);
	const allPendingIds = useMemo(() => {
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

	// Prune selected ids that no longer exist (consumed/hidden).
	useEffect(() => {
		setSelected((prev) => {
			const valid = new Set(allPendingIds);
			let changed = false;
			const next = new Set<string>();
			for (const id of prev) {
				if (valid.has(id)) next.add(id);
				else changed = true;
			}
			return changed ? next : prev;
		});
	}, [allPendingIds]);

	// Clear selection when the thread changes.
	useEffect(() => {
		setSelected(new Set());
	}, [currentThreadId]);

	const handleToggle = useCallback((id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const handleToggleMany = useCallback((ids: string[], select: boolean) => {
		setSelected((prev) => {
			const next = new Set(prev);
			for (const id of ids) {
				if (select) next.add(id);
				else next.delete(id);
			}
			return next;
		});
	}, []);

	const allSelected = allPendingIds.length > 0 && allPendingIds.every((id) => selected.has(id));
	const someSelected = !allSelected && allPendingIds.some((id) => selected.has(id));

	const selectedIds = useMemo(() => Array.from(selected), [selected]);

	const handleSendSelected = useCallback(async () => {
		if (!currentThreadId || selectedIds.length === 0 || busy || isRunning) return;
		setBusy(true);
		try {
			await consumeSubthreadNotifications(currentThreadId, selectedIds, headMessageId);
			setSelected(new Set());
		} catch (err) {
			console.error("[MonitorBox] send selected failed:", err);
		} finally {
			setBusy(false);
		}
	}, [currentThreadId, selectedIds, headMessageId, busy, isRunning]);

	const handleIgnoreSelected = useCallback(async () => {
		if (!currentThreadId || selectedIds.length === 0 || busy) return;
		setBusy(true);
		try {
			await Promise.all(
				selectedIds.map((id) => hideSubthreadNotification(currentThreadId, id)),
			);
			setSelected(new Set());
		} catch (err) {
			console.error("[MonitorBox] ignore selected failed:", err);
		} finally {
			setBusy(false);
		}
	}, [currentThreadId, selectedIds, busy]);

	if (!monitorBoxOpen) return null;

	return (
		<Box
			minW="48rem"
			shadow="0 10px 10px 10px rgba(0,0,0,0.15)"
			borderWidth="1px"
			borderColor="var(--wc-border-default)"
			borderRadius="lg"
			bg="var(--wc-bg-elevated)"
			overflow="hidden"
		>
			<HStack
				gap="2"
				px="3"
				py="2"
				borderBottomWidth={1}
				borderBottomColor="var(--wc-border-subtle)"
			>
				<Monitor size={13} color="var(--wc-text-tertiary)" />
				<Text
					fontSize="calc(var(--chat-font-size) - 3px)"
					fontWeight="600"
					color="var(--wc-text-primary)"
				>
					Agent Monitor
				</Text>
				<Box flex="1" />
				<Box
					as="button"
					display="flex"
					alignItems="center"
					justifyContent="center"
					width="20px"
					height="20px"
					borderRadius="sm"
					color="var(--wc-text-muted)"
					_hover={{ bg: "var(--wc-bg-hover)", color: "var(--wc-accent-red)" }}
					onClick={handleClose}
					title="Close"
				>
					<X size={12} />
				</Box>
			</HStack>

			<Box maxH="500px" overflowY="auto" overflowX="hidden" p="3">
				{childThreadIds.length === 0 ? (
					<Text fontSize="sm" color="var(--wc-text-faint)" textAlign="center" py="4">
						No child threads
					</Text>
				) : (
					<VStack gap="3" align="stretch" w="full">
						{childThreadIds.map((childId) => (
							<SubthreadRow
								key={childId}
								childThreadId={childId}
								parentThreadId={currentThreadId}
								selected={selected}
								onToggle={handleToggle}
								onToggleMany={handleToggleMany}
							/>
						))}
					</VStack>
				)}
			</Box>

			{/* Footer: select-all (left) + selection count (center) + action buttons (right) */}
			<HStack
				gap="2"
				px="3"
				py="2"
				borderTopWidth={1}
				borderTopColor="var(--wc-border-subtle)"
				align="center"
			>
				<Box
					as="button"
					type="button"
					display="flex"
					alignItems="center"
					justifyContent="center"
					width="16px"
					height="16px"
					flexShrink="0"
					borderRadius="sm"
					color={
						allSelected || someSelected
							? "var(--wc-accent-purple)"
							: "var(--wc-text-muted)"
					}
					cursor="pointer"
					_hover={{ color: "var(--wc-accent-purple)" }}
					onClick={() => handleToggleMany(allPendingIds, !allSelected)}
					title={allSelected ? "Deselect all messages" : "Select all messages"}
				>
					{allSelected ? (
						<Check size={14} />
					) : someSelected ? (
						<Minus size={14} />
					) : (
						<Square size={14} />
					)}
				</Box>
				<Text fontSize="xs" color="var(--wc-text-muted)">
					{selectedIds.length} selected
				</Text>
				<Box flex="1" />
				<Box
					as="button"
					display="flex"
					alignItems="center"
					gap="1"
					px="2"
					py="1"
					borderRadius="sm"
					bg={busy ? "var(--wc-bg-subtle)" : "var(--wc-bg-subtle)"}
					color={busy ? "var(--wc-text-muted)" : "var(--wc-text-muted)"}
					fontSize="xs"
					fontWeight="500"
					opacity={selectedIds.length === 0 ? 0.4 : 1}
					cursor={busy || selectedIds.length === 0 ? "not-allowed" : "pointer"}
					_hover={
						busy || selectedIds.length === 0
							? undefined
							: { bg: "var(--wc-bg-hover)", color: "var(--wc-text-primary)" }
					}
					onClick={handleIgnoreSelected}
					disabled={busy || selectedIds.length === 0}
					title="Ignore the selected messages"
				>
					Ignore selected
				</Box>
				<Box
					as="button"
					display="flex"
					alignItems="center"
					gap="1"
					px="2"
					py="1"
					borderRadius="sm"
					bg={busy ? "var(--wc-bg-subtle)" : "var(--wc-accent-green-bg-15)"}
					color={busy ? "var(--wc-text-muted)" : "var(--wc-accent-green)"}
					fontSize="xs"
					fontWeight="600"
					opacity={selectedIds.length === 0 ? 0.4 : 1}
					cursor={
						busy || selectedIds.length === 0 || isRunning ? "not-allowed" : "pointer"
					}
					_hover={
						busy || selectedIds.length === 0 || isRunning
							? undefined
							: { bg: "var(--wc-accent-green-hover)" }
					}
					onClick={handleSendSelected}
					disabled={busy || selectedIds.length === 0 || isRunning}
					title={
						isRunning
							? "Wait for inference to finish"
							: "Send the selected messages through"
					}
				>
					<Send size={11} />
					Send through selected
				</Box>
			</HStack>
		</Box>
	);
});
