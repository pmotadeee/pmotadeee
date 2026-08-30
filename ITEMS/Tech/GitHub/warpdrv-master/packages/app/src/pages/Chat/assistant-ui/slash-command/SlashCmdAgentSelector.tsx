import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { Bot, Check, ChevronDown, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IAgent } from "@warpcore/shared";
import { useStore } from "@/store";

type SlashCmdAgentSelectorProps = {
	value: string;
	placeholder: string;
	inputRef: (el: HTMLSpanElement | null) => void;
	onChange: (next: string) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	onFocus: () => void;
	onBlur: (e: React.FocusEvent) => void;
};

export const SlashCmdAgentSelector: React.FC<SlashCmdAgentSelectorProps> = ({
	value,
	inputRef,
	onChange,
	onFocus,
	onBlur,
}) => {
	const agents = useStore((s) => s.agents);
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

	const availableAgents = useMemo(() => Object.values(agents) as IAgent[], [agents]);

	const handleToggle = useCallback(
		(id: string) => {
			const next = new Set(selectedIds);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			onChange(next.size ? [...next].join(",") : "");
		},
		[selectedIds, onChange],
	);

	const handleTriggerMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (isOpen) {
				e.preventDefault();
				return;
			}
		},
		[isOpen],
	);

	const handleTriggerFocus = useCallback(() => {
		if (!isOpen) {
			setIsOpen(true);
			onFocus();
		}
	}, [isOpen, onFocus]);

	const handleTriggerBlur = useCallback(
		(e: React.FocusEvent) => {
			if (ignoreNextBlurRef.current) {
				ignoreNextBlurRef.current = false;
				return;
			}
			const relatedTarget = e.relatedTarget as Node | null;
			if (
				dropdownRef.current &&
				relatedTarget &&
				dropdownRef.current.contains(relatedTarget)
			) {
				return;
			}
			if (isOpen) {
				setIsOpen(false);
			}
			onBlur(e);
		},
		[isOpen, onBlur],
	);

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

	const displayLabel = useMemo(
		() =>
			selectedNames.size === 0
				? "Agents"
				: `${selectedIds.size} agent${selectedIds.size === 1 ? "" : "s"}`,
		[selectedIds.size],
	);

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
							minWidth: "240px",
							maxWidth: "320px",
							maxHeight: "300px",
							overflowY: "auto",
							borderRadius: "8px",
							border: "1px solid var(--wc-border-overlay)",
							background: "var(--wc-bg-elevated)",
							boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
							padding: "4px",
						}}
					>
						{availableAgents.length === 0 && (
							<div
								style={{
									padding: "12px 8px",
									fontSize: "0.75rem",
									color: "var(--wc-text-secondary)",
									textAlign: "center",
								}}
							>
								No agents available
							</div>
						)}
						{availableAgents.map((agent) => {
							const isSelected = selectedIds.has(agent.id);
							const toolCount = agent.tools?.length ?? 0;
							return (
								<div
									key={agent.id}
									onMouseDown={(e) => e.stopPropagation()}
									onClick={() => handleToggle(agent.id)}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "3px",
										padding: "8px 8px 6px",
										borderRadius: "6px",
										cursor: "pointer",
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
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
										}}
									>
										{isSelected && (
											<Check size={12} color="var(--wc-accent-green)" />
										)}
										{!isSelected && (
											<Bot
												size={13}
												style={{ opacity: 0.4, flexShrink: 0 }}
											/>
										)}
										<span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
											{agent.name}
										</span>
										<span
											style={{
												marginLeft: "auto",
												display: "flex",
												alignItems: "center",
												gap: "3px",
												fontSize: "0.625rem",
												color: "var(--wc-text-muted)",
												background: "var(--wc-bg-subtle)",
												padding: "1px 5px",
												borderRadius: "4px",
												flexShrink: 0,
											}}
										>
											<Wrench size={9} />
											{toolCount} tool{toolCount === 1 ? "" : "s"}
										</span>
									</div>
									{agent.description && (
										<div
											style={{
												paddingLeft: isSelected ? "18px" : "20px",
												fontSize: "0.75rem",
												color: "var(--wc-text-faint)",
												lineHeight: "1.3",
												maxHeight: "2.6em",
												overflow: "hidden",
												textOverflow: "ellipsis",
											}}
										>
											{agent.description}
										</div>
									)}
								</div>
							);
						})}
					</div>,
					document.body,
				)}
		</>
	);
};

export function parseAgentValue(value: string): string[] {
	if (!value || !value.trim()) return [];
	return value
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
}

export function serializeAgentValue(names: string[]): string {
	return names.join(",");
}
