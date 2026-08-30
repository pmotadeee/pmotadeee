import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { EMcpServerStatus } from "@warpcore/bridge";
import type { IToolAttachment } from "@warpcore/shared";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/store";

type SlashCmdToolSelectorProps = {
	value: string;
	placeholder: string;
	inputRef: (el: HTMLSpanElement | null) => void;
	onChange: (next: string) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	onFocus: () => void;
	onBlur: (e: React.FocusEvent) => void;
	showAllMessages?: boolean;
};

export const SlashCmdToolSelector: React.FC<SlashCmdToolSelectorProps> = ({
	value,
	inputRef,
	onChange,
	onFocus,
	onBlur,
	showAllMessages = true,
}) => {
	const mcpServers = useStore((s) => s.mcpServers);
	const [isOpen, setIsOpen] = useState(false);
	const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
	const triggerRef = useRef<HTMLSpanElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	const ignoreNextBlurRef = useRef(false);

	useEffect(() => {
		inputRef(triggerRef.current);
	}, [inputRef]);

	const connectedServers = useMemo(() => {
		const entries = Object.entries(mcpServers).filter(
			([, state]) => state.status === EMcpServerStatus.CONNECTED,
		);
		return entries as [
			string,
			{ status: EMcpServerStatus; tools: Array<{ name: string; description: string }> },
		][];
	}, [mcpServers]);

	const toolKey = (serverName: string, toolName: string) => `${serverName}:${toolName}`;

	const selectedTools = useMemo(() => {
		if (!value || !value.trim()) return new Set<string>();
		const raw = value
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
		const keys = new Set<string>();
		for (const entry of raw) {
			if (entry.includes(":")) {
				keys.add(entry);
			} else {
				// Backward compat: resolve old tool-only format by finding first match
				for (const [serverName, state] of connectedServers) {
					if (state.tools.some((t) => t.name === entry)) {
						keys.add(toolKey(serverName, entry));
						break;
					}
				}
			}
		}
		return keys;
	}, [value, connectedServers]);

	const isAllMessages = !value || !value.trim();

	const totalCount = useMemo(
		() => connectedServers.reduce((sum, [, s]) => sum + s.tools.length, 0),
		[connectedServers],
	);

	const handleSelectAllMessages = () => {
		onChange("");
		setIsOpen(false);
		onBlur({} as React.FocusEvent);
	};

	const handleToolToggle = (serverName: string, toolName: string) => {
		const key = toolKey(serverName, toolName);
		const next = new Set(selectedTools);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		onChange(next.size ? [...next].join(",") : "");
	};

	const toggleServer = (serverName: string) => {
		setExpandedServers((prev) => {
			const next = new Set(prev);
			if (next.has(serverName)) {
				next.delete(serverName);
			} else {
				next.add(serverName);
			}
			return next;
		});
	};

	// Open dropdown: prevent trigger from losing focus to dropdown content
	const handleTriggerMouseDown = (e: React.MouseEvent) => {
		if (isOpen) {
			// Dropdown is open - prevent focus loss when clicking anywhere
			e.preventDefault();
			return;
		}
		// Closed - toggle on click (handled by onClick)
	};

	// Handle focus: open dropdown on keyboard focus
	const handleTriggerFocus = () => {
		if (!isOpen) {
			setIsOpen(true);
			onFocus();
		}
	};

	// Handle blur: only propagate if focus didn't go to the dropdown
	const handleTriggerBlur = (e: React.FocusEvent) => {
		if (ignoreNextBlurRef.current) {
			ignoreNextBlurRef.current = false;
			return;
		}

		const relatedTarget = e.relatedTarget as Node | null;
		if (dropdownRef.current && relatedTarget && dropdownRef.current.contains(relatedTarget)) {
			// Focus moved into dropdown - don't close
			return;
		}

		// Focus moved outside - close dropdown
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

	const displayLabel = isAllMessages
		? showAllMessages
			? "All messages"
			: "Tools"
		: `${selectedTools.size} tool(s)`;

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
						color: isAllMessages
							? "var(--wc-accent-green)"
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
							maxHeight: "300px",
							overflowY: "auto",
							borderRadius: "8px",
							border: "1px solid var(--wc-border-overlay)",
							background: "var(--wc-bg-elevated)",
							boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
							padding: "4px",
						}}
					>
						{showAllMessages && (
							<>
								{/* "All messages" option */}
								<div
									onMouseDown={(e) => e.stopPropagation()}
									onClick={handleSelectAllMessages}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
										padding: "8px",
										borderRadius: "6px",
										cursor: "pointer",
										fontSize: "0.75rem",
										color: "var(--wc-text-primary)",
										background: isAllMessages
											? "var(--wc-bg-selected)"
											: "transparent",
									}}
									onMouseEnter={(e) => {
										if (!isAllMessages) {
											(e.currentTarget as HTMLDivElement).style.background =
												"var(--wc-bg-card)";
										}
									}}
									onMouseLeave={(e) => {
										if (!isAllMessages) {
											(e.currentTarget as HTMLDivElement).style.background =
												"transparent";
										}
									}}
								>
									{isAllMessages && (
										<Check size={14} color="var(--wc-accent-green)" />
									)}
									<span style={{ flex: 1 }}>All messages</span>
								</div>

								{/* Separator */}
								<div
									style={{
										height: "1px",
										background: "var(--wc-border-subtle)",
										margin: "4px 0",
									}}
								/>
							</>
						)}

						{totalCount === 0 ? (
							<div
								style={{
									padding: "8px 12px",
									fontSize: "0.75rem",
									color: "var(--wc-text-faint)",
								}}
							>
								No tools available
							</div>
						) : (
							connectedServers.map(([serverName, state]) => {
								const isExpanded = expandedServers.has(serverName);
								const activeCount = state.tools.filter((t) =>
									selectedTools.has(toolKey(serverName, t.name)),
								).length;

								return (
									<div key={serverName}>
										{/* Server header */}
										<div
											onMouseDown={(e) => e.stopPropagation()}
											onClick={() => toggleServer(serverName)}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												padding: "6px 8px",
												borderRadius: "6px",
												cursor: "pointer",
												fontSize: "0.7rem",
												fontWeight: 600,
												color: activeCount
													? "var(--wc-accent-blue)"
													: "var(--wc-text-muted)",
												textTransform: "uppercase",
												letterSpacing: "0.05em",
											}}
											onMouseEnter={(e) => {
												(
													e.currentTarget as HTMLDivElement
												).style.background = "var(--wc-bg-card)";
											}}
											onMouseLeave={(e) => {
												(
													e.currentTarget as HTMLDivElement
												).style.background = "transparent";
											}}
										>
											<span
												style={{
													display: "flex",
													alignItems: "center",
													gap: "4px",
												}}
											>
												{isExpanded ? (
													<ChevronDown size={11} />
												) : (
													<ChevronRight size={11} />
												)}
												{serverName}
											</span>
											<span
												style={{
													fontSize: "0.6875rem",
													fontWeight: 400,
													color: "var(--wc-text-faint)",
												}}
											>
												{state.tools.length}
												{activeCount ? ` (${activeCount})` : ""}
											</span>
										</div>

										{/* Tools list */}
										{isExpanded && (
											<div style={{ paddingLeft: "4px" }}>
												{state.tools.map((tool) => {
													const isSelected = selectedTools.has(
														toolKey(serverName, tool.name),
													);
													return (
														<div
															key={tool.name}
															onMouseDown={(e) => e.stopPropagation()}
															onClick={() =>
																handleToolToggle(
																	serverName,
																	tool.name,
																)
															}
															style={{
																display: "flex",
																alignItems: "center",
																gap: "8px",
																padding: "5px 8px",
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
																	).style.background =
																		"var(--wc-bg-card)";
																}
															}}
															onMouseLeave={(e) => {
																if (!isSelected) {
																	(
																		e.currentTarget as HTMLDivElement
																	).style.background =
																		"transparent";
																}
															}}
														>
															{isSelected && (
																<Check
																	size={12}
																	color="var(--wc-accent-blue)"
																/>
															)}
															<span
																style={{
																	flex: 1,
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	whiteSpace: "nowrap",
																}}
															>
																{tool.name}
															</span>
														</div>
													);
												})}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>,
					document.body,
				)}
		</>
	);
};

export const SlashCmdMessageType: React.FC<SlashCmdToolSelectorProps> = (props) => (
	<SlashCmdToolSelector {...props} showAllMessages={true} />
);

export const SlashCmdTools: React.FC<SlashCmdToolSelectorProps> = (props) => (
	<SlashCmdToolSelector {...props} showAllMessages={false} />
);

export function parseToolValue(value: string): IToolAttachment[] {
	if (!value || !value.trim()) return [];
	const result: IToolAttachment[] = [];
	for (const entry of value
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean)) {
		const idx = entry.indexOf(":");
		if (idx > 0) {
			result.push({ serverName: entry.slice(0, idx), toolName: entry.slice(idx + 1) });
		}
	}
	return result;
}

export function serializeToolValue(tools: IToolAttachment[]): string {
	return tools.map((t) => `${t.serverName}:${t.toolName}`).join(",");
}
