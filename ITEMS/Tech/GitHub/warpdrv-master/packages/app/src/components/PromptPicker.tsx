import { HStack, Text } from "@chakra-ui/react";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/store";

export const PromptPicker = React.memo(
	({ value, onChange }: { value: string; onChange: (promptId: string) => void }) => {
		const [open, setOpen] = useState(false);
		const triggerRef = useRef<HTMLDivElement | null>(null);
		const dropdownRef = useRef<HTMLDivElement | null>(null);
		const prompts = useStore((s) => s.chatPrompts);

		const selectedPrompt = useMemo(
			() => (value ? prompts.find((p) => p.id === value) : null),
			[value, prompts],
		);

		const handleSelect = useCallback(
			(promptId: string) => {
				onChange(promptId);
				setOpen(false);
			},
			[onChange],
		);

		useEffect(() => {
			if (!open) return;
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") setOpen(false);
			};
			const handleClickOutside = (e: MouseEvent) => {
				if (!dropdownRef.current || !triggerRef.current) return;
				if (
					dropdownRef.current.contains(e.target as Node) ||
					triggerRef.current.contains(e.target as Node)
				)
					return;
				setOpen(false);
			};
			document.addEventListener("keydown", handleKeyDown);
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("keydown", handleKeyDown);
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}, [open]);

		useEffect(() => {
			if (!open || !triggerRef.current || !dropdownRef.current) return;
			computePosition(triggerRef.current, dropdownRef.current, {
				placement: "bottom-start",
				middleware: [offset(6), flip(), shift({ padding: 8 })],
			}).then(({ x, y }) => {
				if (!dropdownRef.current) return;
				dropdownRef.current.style.left = `${x}px`;
				dropdownRef.current.style.top = `${y}px`;
			});
		}, [open]);

		return (
			<>
				<HStack
					ref={triggerRef}
					gap="2"
					p="2.5"
					cursor="pointer"
					borderRadius="lg"
					borderWidth="1px"
					borderColor="var(--wc-border-default)"
					_hover={{ bg: "var(--wc-bg-hover)" }}
					onClick={() => setOpen(!open)}
					fontSize="12px"
					color="var(--wc-text-primary)"
					w="100%"
				>
					{selectedPrompt ? (
						<>
							<Text
								flex="1"
								overflow="hidden"
								textOverflow="ellipsis"
								whiteSpace="nowrap"
								fontSize="12px"
							>
								{selectedPrompt.name}
							</Text>
							<ChevronDown size={12} style={{ opacity: 0.4 }} />
						</>
					) : (
						<>
							<Text flex="1" color="var(--wc-text-faint)" fontSize="12px">
								Select
							</Text>
							<ChevronDown size={12} style={{ opacity: 0.4 }} />
						</>
					)}
				</HStack>
				{open &&
					createPortal(
						<div
							ref={dropdownRef}
							style={{
								position: "absolute",
								zIndex: 10000,
								minWidth: "160px",
								maxWidth: "220px",
								maxHeight: "200px",
								overflowY: "auto",
								borderRadius: "8px",
								border: "1px solid var(--wc-border-overlay)",
								background: "var(--wc-bg-elevated)",
								boxShadow: "0px 8px 24px rgba(0,0,0,0.25)",
								padding: "4px",
							}}
						>
							{prompts.length === 0 && (
								<div
									style={{
										padding: "8px 12px",
										fontSize: "0.75rem",
										color: "var(--wc-text-faint)",
									}}
								>
									No prompts
								</div>
							)}
							{prompts.map((p) => (
								<div
									key={p.id}
									onClick={() => handleSelect(p.id)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
										padding: "6px 8px",
										borderRadius: "6px",
										cursor: "pointer",
										fontSize: "0.75rem",
										color: "var(--wc-text-primary)",
										background:
											value === p.id
												? "var(--wc-bg-selected)"
												: "transparent",
									}}
									onMouseEnter={(e) => {
										if (value !== p.id)
											(e.currentTarget as HTMLDivElement).style.background =
												"var(--wc-bg-card)";
									}}
									onMouseLeave={(e) => {
										if (value !== p.id)
											(e.currentTarget as HTMLDivElement).style.background =
												"transparent";
									}}
								>
									<span
										style={{
											flex: 1,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{p.name}
									</span>
								</div>
							))}
						</div>,
						document.body,
					)}
			</>
		);
	},
);
