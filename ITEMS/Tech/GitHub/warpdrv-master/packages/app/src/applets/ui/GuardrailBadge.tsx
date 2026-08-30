import { Box, Text } from "@chakra-ui/react";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import type { IGuardrailDefinition, TModeId } from "@warpcore/shared";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaShieldAlt } from "react-icons/fa";
import { updateModeGuardrails as updateModeGuardrailsApi } from "@/api/mode-services";
import { parseThreadMeta } from "@/pages/Chat/assistant-ui/ServerSelector";
import { useStore } from "@/store";

const EMPTY_GUARDRAILS: Record<string, IGuardrailDefinition> = {};

export const GuardrailPicker = memo(
	({
		value,
		onChange,
		onClick,
	}: {
		value: string[];
		onChange: (ids: string[]) => void;
		onClick?: (e: React.MouseEvent) => void;
	}) => {
		const guardrails = useStore((s) => s.guardrails) || EMPTY_GUARDRAILS;
		const guardrailList = useMemo(() => Object.values(guardrails), [guardrails]);
		const [isOpen, setIsOpen] = useState(false);
		const dropdownRef = useRef<HTMLDivElement | null>(null);
		const triggerRef = useRef<HTMLDivElement | null>(null);

		const selectedSet = useMemo(() => new Set(value), [value]);

		// Count only ids that still exist (drop deleted guardrails)
		const validCount = useMemo(() => {
			const validIds = new Set(guardrailList.map((g) => g.id));
			return value.filter((n) => validIds.has(n)).length;
		}, [value, guardrailList]);

		const handleToggle = (e: React.MouseEvent, id: string) => {
			e.stopPropagation();
			// Reconstruct from live guardrails so deleted guardrail ids are dropped
			const validIds = new Set(guardrailList.map((g) => g.id));
			const current = value.filter((n) => validIds.has(n));
			const next = current.includes(id) ? current.filter((n) => n !== id) : [...current, id];
			onChange(next);
		};

		useEffect(() => {
			if (!isOpen) return;
			const handler = (e: MouseEvent) => {
				if (
					dropdownRef.current?.contains(e.target as Node) ||
					triggerRef.current?.contains(e.target as Node)
				)
					return;
				setIsOpen(false);
			};
			document.addEventListener("mousedown", handler);
			return () => document.removeEventListener("mousedown", handler);
		}, [isOpen]);

		useEffect(() => {
			if (!isOpen || !triggerRef.current || !dropdownRef.current) return;
			computePosition(triggerRef.current, dropdownRef.current, {
				placement: "top-start",
				middleware: [offset(6), flip(), shift({ padding: 8 })],
			}).then(({ x, y }) => {
				if (!dropdownRef.current) return;
				dropdownRef.current.style.left = `${x}px`;
				dropdownRef.current.style.top = `${y}px`;
			});
		}, [isOpen]);

		return (
			<Box position="relative">
				<Box
					ref={triggerRef}
					borderWidth="1px"
					borderColor="var(--wc-border-default)"
					borderRadius="md"
					bg="var(--wc-bg-subtle)"
					px="2.5"
					py="1.5"
					cursor="pointer"
					minH="32px"
					onClick={(e) => {
						onClick?.(e);
						setIsOpen(!isOpen);
					}}
				>
					<Text
						fontSize="xs"
						color={validCount > 0 ? "var(--wc-text-primary)" : "var(--wc-text-faint)"}
					>
						{validCount > 0
							? `${validCount} guardrail${validCount > 1 ? "s" : ""}`
							: "No guardrails"}
					</Text>
				</Box>
				{isOpen &&
					createPortal(
						<div
							ref={dropdownRef}
							style={{
								position: "absolute",
								zIndex: 10000,
								minWidth: "180px",
								maxWidth: "240px",
								maxHeight: "200px",
								overflowY: "auto",
								borderRadius: "8px",
								border: "1px solid var(--wc-border-overlay)",
								background: "var(--wc-bg-elevated)",
								boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
								padding: "8px",
							}}
						>
							{guardrailList.length === 0 ? (
								<div
									style={{
										fontSize: "0.75rem",
										color: "var(--wc-text-faint)",
										padding: "4px",
									}}
								>
									No guardrails
								</div>
							) : (
								guardrailList.map((g) => {
									const isSelected = selectedSet.has(g.id);
									return (
										<div
											key={g.id}
											onMouseDown={(e) => e.stopPropagation()}
											onClick={(e) => handleToggle(e, g.id)}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "6px",
												padding: "6px 8px",
												borderRadius: "6px",
												cursor: "pointer",
												fontSize: "0.75rem",
												color: "var(--wc-text-primary)",
												background: isSelected
													? "var(--wc-bg-selected)"
													: "transparent",
											}}
											onMouseEnter={(e) => {
												if (!isSelected)
													(
														e.currentTarget as HTMLDivElement
													).style.background = "var(--wc-bg-card)";
											}}
											onMouseLeave={(e) => {
												if (!isSelected)
													(
														e.currentTarget as HTMLDivElement
													).style.background = "transparent";
											}}
										>
											{isSelected && (
												<Check size={12} color="var(--wc-accent-purple)" />
											)}
											<span
												style={{
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{g.name}
											</span>
										</div>
									);
								})
							)}
						</div>,
						document.body,
					)}
			</Box>
		);
	},
);

export const GuardrailBadge = memo(() => {
	const guardrails = useStore((s) => s.guardrails) || EMPTY_GUARDRAILS;
	const threadState = useStore((s) => s.getCurrentThreadState(s));
	const setThreadState = useStore((s) => s.setThreadState);
	const modes = useStore((s) => s.modes);
	const modeId = threadState?.modeId as TModeId | undefined;
	const currentMode = modeId ? modes[modeId] : null;

	const activeNames = useMemo(() => {
		const raw = currentMode
			? currentMode.activeGuardrails || []
			: (threadState?.activeGuardrails as string[]) || [];
		// Drop ids that no longer exist (e.g. deleted guardrails)
		const validIds = new Set(Object.keys(guardrails));
		return raw.filter((n) => validIds.has(n));
	}, [currentMode, threadState?.activeGuardrails, guardrails]);

	const currentThreadId = useStore((s) => s.currentThreadId);
	const thread = useStore((s) => (currentThreadId ? s.threads[currentThreadId] : null));

	const threadServerId = useMemo(() => {
		return thread?.meta ? parseThreadMeta(thread.meta).serverId : null;
	}, [thread?.meta]);

	const guardrailReminders = useMemo(() => {
		const reminders: Array<{ name: string; type: "no-server" | "same-server" }> = [];
		for (const id of activeNames) {
			const gr = guardrails[id];
			if (!gr) continue;
			if (!gr.serverId) {
				reminders.push({ name: gr.name, type: "no-server" });
			} else if (gr.serverId === threadServerId) {
				reminders.push({ name: gr.name, type: "same-server" });
			}
		}
		return reminders;
	}, [activeNames, guardrails, threadServerId]);

	const guardrailList = useMemo(() => Object.values(guardrails), [guardrails]);

	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const handleToggle = useCallback(
		(e: React.MouseEvent, id: string) => {
			e.stopPropagation();
			const state = useStore.getState();
			const threadId = state.currentThreadId;
			const ts = state.getCurrentThreadState(state);
			const m = state.modes;
			const tsModeId = ts?.modeId as TModeId | undefined;
			const rawActive =
				tsModeId && m[tsModeId]
					? m[tsModeId].activeGuardrails || []
					: (ts?.activeGuardrails as string[]) || [];
			// Reconstruct from live guardrails so deleted guardrail ids are dropped
			const validIds = new Set(Object.keys(state.guardrails || {}));
			const active = rawActive.filter((n) => validIds.has(n));
			const isActive = active.includes(id);
			const newIds = isActive ? active.filter((n) => n !== id) : [...active, id];
			if (tsModeId && m[tsModeId]) {
				updateModeGuardrailsApi(tsModeId, newIds);
			} else {
				setThreadState(threadId, { activeGuardrails: newIds });
			}
		},
		[setThreadState],
	);

	const handleToggleDropdown = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setIsOpen(!isOpen);
		},
		[isOpen],
	);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: MouseEvent) => {
			if (
				dropdownRef.current?.contains(e.target as Node) ||
				triggerRef.current?.contains(e.target as Node)
			)
				return;
			setIsOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || !triggerRef.current || !dropdownRef.current) return;
		computePosition(triggerRef.current, dropdownRef.current, {
			placement: "top-start",
			middleware: [offset(6), flip(), shift({ padding: 8 })],
		}).then(({ x, y }) => {
			if (!dropdownRef.current) return;
			dropdownRef.current.style.left = `${x}px`;
			dropdownRef.current.style.top = `${y}px`;
		});
	}, [isOpen]);

	const totalActive = activeNames.length;

	return (
		<Box position="relative">
			<Box
				ref={triggerRef}
				display="inline-flex"
				alignItems="center"
				gap="1.5"
				px="2"
				py="2"
				borderRadius="md"
				cursor="pointer"
				userSelect="none"
				bg={totalActive > 0 ? "var(--wc-bg-selected)" : "var(--wc-bg-subtle)"}
				borderWidth="1px"
				borderColor={
					totalActive > 0 ? "var(--wc-border-subtle)" : "var(--wc-border-subtle)"
				}
				opacity={totalActive > 0 ? 1 : 0.6}
				onClick={handleToggleDropdown}
			>
				{guardrailReminders.length > 0 && (
					<Box
						as="span"
						display="inline-flex"
						alignItems="center"
						justifyContent="center"
						title={guardrailReminders
							.map((w) =>
								w.type === "no-server"
									? `${w.name}: No inference server configured — guardrail will not execute`
									: `${w.name}: Uses same server as chat — may cause KV cache eviction`,
							)
							.join("\n")}
						cursor="help"
					>
						<AlertTriangle size={12} color="var(--wc-accent-yellow-strong)" />
					</Box>
				)}
				<FaShieldAlt
					size={14}
					color={totalActive > 0 ? "var(--wc-text-tertiary)" : "var(--wc-text-muted)"}
				/>
				<Box fontSize="xs" fontWeight="500" color="var(--wc-text-primary)">
					{totalActive > 0
						? `${totalActive} Guardrail${totalActive > 1 ? "s" : ""}`
						: "Guardrails"}
				</Box>
				<ChevronDown size={12} color="var(--wc-text-muted)" />
			</Box>
			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						style={{
							position: "absolute",
							zIndex: 10000,
							minWidth: "180px",
							maxWidth: "240px",
							maxHeight: "200px",
							overflowY: "auto",
							borderRadius: "8px",
							border: "1px solid var(--wc-border-overlay)",
							background: "var(--wc-bg-elevated)",
							boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
							padding: "8px",
						}}
					>
						{guardrailList.length === 0 ? (
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--wc-text-faint)",
									padding: "4px",
								}}
							>
								No guardrails
							</div>
						) : (
							guardrailList.map((g) => {
								const isSelected = activeNames.includes(g.id);
								return (
									<div
										key={g.id}
										onMouseDown={(e) => e.stopPropagation()}
										onClick={(e) => handleToggle(e, g.id)}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											padding: "6px 8px",
											borderRadius: "6px",
											cursor: "pointer",
											fontSize: "0.75rem",
											color: "var(--wc-text-primary)",
											background: isSelected
												? "var(--wc-bg-selected)"
												: "transparent",
										}}
										onMouseEnter={(e) => {
											if (!isSelected)
												(
													e.currentTarget as HTMLDivElement
												).style.background = "var(--wc-bg-card)";
										}}
										onMouseLeave={(e) => {
											if (!isSelected)
												(
													e.currentTarget as HTMLDivElement
												).style.background = "transparent";
										}}
									>
										{isSelected && (
											<Check size={12} color="var(--wc-accent-purple)" />
										)}
										<span
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{g.name}
										</span>
									</div>
								);
							})
						)}
					</div>,
					document.body,
				)}
		</Box>
	);
});
