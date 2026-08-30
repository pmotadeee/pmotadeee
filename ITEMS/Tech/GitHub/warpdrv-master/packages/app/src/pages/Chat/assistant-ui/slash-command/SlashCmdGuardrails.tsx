import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { Check, ChevronDown, Shield } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/store";

type SlashCmdGuardrailsProps = {
	value: string;
	placeholder: string;
	inputRef: (el: HTMLSpanElement | null) => void;
	onChange: (next: string) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	onFocus: () => void;
	onBlur: (e: React.FocusEvent) => void;
};

export const SlashCmdGuardrails: React.FC<SlashCmdGuardrailsProps> = ({
	value,
	inputRef,
	onChange,
	onFocus,
	onBlur,
}) => {
	const guardrails = useStore((s) => s.guardrails);
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLSpanElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	const ignoreNextBlurRef = useRef(false);

	useEffect(() => {
		inputRef(triggerRef.current);
	}, [inputRef]);

	const selectedIds = useMemo(() => {
		if (!value || !value.trim()) return new Set<string>();
		return new Set(
			value
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
		);
	}, [value]);

	const handleToggle = (id: string) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		onChange(next.size ? [...next].join(",") : "");
	};

	const handleTriggerMouseDown = (e: React.MouseEvent) => {
		if (isOpen) {
			e.preventDefault();
			return;
		}
	};

	const handleTriggerFocus = () => {
		if (!isOpen) {
			setIsOpen(true);
			onFocus();
		}
	};

	const handleTriggerBlur = (e: React.FocusEvent) => {
		if (ignoreNextBlurRef.current) {
			ignoreNextBlurRef.current = false;
			return;
		}
		const relatedTarget = e.relatedTarget as Node | null;
		if (dropdownRef.current && relatedTarget && dropdownRef.current.contains(relatedTarget)) {
			return;
		}
		if (isOpen) {
			setIsOpen(false);
		}
		onBlur(e);
	};

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
				onBlur({} as React.FocusEvent);
			}
		};
		const handleClickOutside = (e: MouseEvent) => {
			if (!dropdownRef.current || !triggerRef.current) return;
			if (
				dropdownRef.current.contains(e.target as Node) ||
				triggerRef.current.contains(e.target as Node)
			)
				return;
			setIsOpen(false);
			onBlur({} as React.FocusEvent);
		};
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onBlur]);

	useEffect(() => {
		if (!isOpen || !triggerRef.current || !dropdownRef.current) return;
		computePosition(triggerRef.current, dropdownRef.current, {
			placement: "bottom-start",
			middleware: [offset(6), flip(), shift({ padding: 8 })],
		}).then(({ x, y }) => {
			if (!dropdownRef.current) return;
			dropdownRef.current.style.left = `${x}px`;
			dropdownRef.current.style.top = `${y}px`;
		});
	}, [isOpen]);

	const displayLabel =
		selectedIds.size === 0
			? "Guardrails"
			: `${selectedIds.size} guardrail${selectedIds.size === 1 ? "" : "s"}`;

	const availableGuardrails = Object.values(guardrails);

	return (
		<>
			<span
				ref={triggerRef}
				contentEditable={false}
				tabIndex={0}
				onMouseDown={handleTriggerMouseDown}
				onClick={() => {
					if (!isOpen) {
						setIsOpen(true);
						onFocus();
					}
				}}
				onFocus={handleTriggerFocus}
				onBlur={handleTriggerBlur}
				onKeyDown={(e) => {
					if (e.key === "ArrowDown" || e.key === "Enter") {
						e.preventDefault();
						if (!isOpen) {
							setIsOpen(true);
							onFocus();
						}
					}
				}}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: "4px",
					cursor: "pointer",
					padding: "0 4px",
					margin: "0 2px",
					borderRadius: "4px",
					background: isOpen
						? "var(--wc-bg-hover, rgba(255,255,255,0.06))"
						: "transparent",
					minWidth: "8ch",
					maxWidth: "16ch",
				}}
			>
				<span
					style={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						color: selectedIds.size
							? "var(--wc-text-primary)"
							: "var(--wc-text-secondary)",
					}}
				>
					{displayLabel}
				</span>
				<ChevronDown size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
			</span>

			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						style={{
							position: "absolute",
							zIndex: 10000,
							minWidth: "200px",
							maxWidth: "280px",
							maxHeight: "250px",
							overflowY: "auto",
							borderRadius: "8px",
							border: "1px solid var(--wc-border-overlay)",
							background: "var(--wc-bg-elevated)",
							boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
							padding: "4px",
						}}
					>
						{availableGuardrails.length === 0 && (
							<div
								style={{
									padding: "12px 8px",
									fontSize: "0.75rem",
									color: "var(--wc-text-secondary)",
									textAlign: "center",
								}}
							>
								No guardrails available
							</div>
						)}
						{availableGuardrails.map((g) => {
							const isSelected = selectedIds.has(g.id);
							return (
								<div
									key={g.id}
									onMouseDown={(e) => e.stopPropagation()}
									onClick={() => handleToggle(g.id)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
										padding: "8px",
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
											(e.currentTarget as HTMLDivElement).style.background =
												"var(--wc-bg-card)";
										}
									}}
									onMouseLeave={(e) => {
										if (!isSelected) {
											(e.currentTarget as HTMLDivElement).style.background =
												"transparent";
										}
									}}
								>
									{isSelected && (
										<Check size={14} color="var(--wc-accent-green)" />
									)}
									<Shield size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
									<span style={{ fontWeight: 500 }}>{g.name}</span>
								</div>
							);
						})}
					</div>,
					document.body,
				)}
		</>
	);
};

export function parseGuardrailValue(value: string): string[] {
	if (!value || !value.trim()) return [];
	return value
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
}

export function serializeGuardrailValue(ids: string[]): string {
	return ids.join(",");
}
