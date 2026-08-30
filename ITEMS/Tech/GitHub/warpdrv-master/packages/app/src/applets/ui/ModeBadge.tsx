import { Box, HStack, IconButton } from "@chakra-ui/react";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import type { IMode, TModeId } from "@warpcore/shared";
import { Check, ChevronDown } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TiFlowSwitch } from "react-icons/ti";
import { useStore } from "@/store";

const EMPTY_MODES: Record<TModeId, IMode> = {};

const hexToRgba = (hex: string): string => {
	const cleaned = hex.replace("#", "");
	const r = parseInt(cleaned.slice(0, 2), 16);
	const g = parseInt(cleaned.slice(2, 4), 16);
	const b = parseInt(cleaned.slice(4, 6), 16);
	return `rgba(${r},${g},${b}`;
};

export const ModeBadge = memo(() => {
	const modes = useStore((s) => s.modes) ?? EMPTY_MODES;
	const currentThreadId = useStore((s) => s.currentThreadId);
	const threads = useStore((s) => s.threads);
	const threadState = useStore((s) => s.getCurrentThreadState(s));
	const setThreadState = useStore((s) => s.setThreadState);
	const modeId = threadState?.modeId as TModeId | undefined;
	const currentMode = modeId ? modes[modeId] : null;

	const folderId = currentThreadId ? threads[currentThreadId]?.folderId : null;
	const scope = folderId || "global";

	const availableModes = useMemo(() => {
		return Object.values(modes).filter((m: IMode) => m.scope === "global" || m.scope === scope);
	}, [modes, scope]);

	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const handleToggle = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsOpen((prev) => !prev);
	}, []);

	const handleSelect = useCallback(
		(selectedModeId: TModeId | null) => {
			setThreadState(currentThreadId, { modeId: selectedModeId });
			setIsOpen(false);
		},
		[currentThreadId, setThreadState],
	);

	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (!dropdownRef.current || !triggerRef.current) return;
			if (
				dropdownRef.current.contains(e.target as Node) ||
				triggerRef.current.contains(e.target as Node)
			)
				return;
			setIsOpen(false);
		};
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
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

	const isActive = !!currentMode;
	const label = currentMode?.name ?? "Default";
	const modeColor = currentMode?.color || "#a78bfa";
	const modeColorRgba = hexToRgba(modeColor);

	return (
		<>
			<Box
				ref={triggerRef}
				display="inline-flex"
				alignItems="center"
				gap="1.5"
				px="2"
				py="1"
				borderRadius="md"
				cursor="pointer"
				userSelect="none"
				transition="all 0.15s ease"
				bg={isActive ? `${modeColorRgba},0.15)` : "var(--wc-bg-subtle)"}
				borderWidth="1px"
				borderColor={isActive ? `${modeColorRgba},0.25)` : "var(--wc-border-subtle)"}
				opacity={isActive ? 1 : 0.6}
				onClick={handleToggle}
			>
				<TiFlowSwitch size={14} color={isActive ? modeColor : "var(--wc-text-muted)"} />
				<Box fontSize="xs" fontWeight="500" color="var(--wc-text-primary)">
					{label}
				</Box>
				<HStack gap="0.5">
					<IconButton
						size="xs"
						variant="ghost"
						p="0"
						minW="16px"
						h="16px"
						color="var(--wc-text-muted)"
						_hover={{ bg: "transparent" }}
						onClick={handleToggle}
					>
						<ChevronDown size={12} />
					</IconButton>
				</HStack>
			</Box>

			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						style={{
							position: "absolute",
							zIndex: 10000,
							minWidth: "180px",
							maxWidth: "260px",
							maxHeight: "240px",
							overflowY: "auto",
							borderRadius: "8px",
							border: "1px solid var(--wc-border-overlay)",
							background: "var(--wc-bg-elevated)",
							boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
							padding: "4px",
						}}
					>
						<div
							onMouseDown={(e) => e.stopPropagation()}
							onClick={() => handleSelect(null)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
								padding: "8px",
								borderRadius: "6px",
								cursor: "pointer",
								fontSize: "0.75rem",
								color: "var(--wc-text-primary)",
								background: !isActive ? "var(--wc-bg-selected)" : "transparent",
							}}
						>
							{!isActive && <Check size={14} color="var(--wc-accent-purple)" />}
							<span style={{ flex: 1 }}>Default</span>
						</div>

						<div
							style={{
								height: "1px",
								background: "var(--wc-border-subtle)",
								margin: "4px 0",
							}}
						/>

						{availableModes.length === 0 ? (
							<div
								style={{
									padding: "8px 12px",
									fontSize: "0.75rem",
									color: "var(--wc-text-faint)",
								}}
							>
								No modes available
							</div>
						) : (
							availableModes.map((m: IMode) => {
								const isSelected = modeId === m.id;
								const mc = m.color || "#a78bfa";
								return (
									<div
										key={m.id}
										onMouseDown={(e) => e.stopPropagation()}
										onClick={() => handleSelect(m.id)}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
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
											if (!isSelected) {
												(
													e.currentTarget as HTMLDivElement
												).style.background = "var(--wc-bg-card)";
											}
										}}
										onMouseLeave={(e) => {
											if (!isSelected) {
												(
													e.currentTarget as HTMLDivElement
												).style.background = "transparent";
											}
										}}
									>
										{isSelected && <Check size={12} color={mc} />}
										<TiFlowSwitch size={14} color={mc} />
										<span
											style={{
												flex: 1,
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{m.name}
										</span>
									</div>
								);
							})
						)}
					</div>,
					document.body,
				)}
		</>
	);
});
