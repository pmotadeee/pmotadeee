import { Box, Text } from "@chakra-ui/react";
import { EMcpServerStatus } from "@warpcore/bridge";
import type { IToolAttachment } from "@warpcore/shared";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store";

export const GuardrailToolPicker = React.memo(
	({
		value,
		onChange,
		onClick,
	}: {
		value: IToolAttachment[];
		onChange: (tools: IToolAttachment[]) => void;
		onClick?: (e: React.MouseEvent) => void;
	}) => {
		const mcpServers = useStore((s) => s.mcpServers);
		const [isOpen, setIsOpen] = useState(false);
		const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
		const dropdownRef = useRef<HTMLDivElement | null>(null);
		const triggerRef = useRef<HTMLDivElement | null>(null);

		const connectedServers = useMemo(() => {
			const entries = Object.entries(mcpServers).filter(
				([, s]) => s.status === EMcpServerStatus.CONNECTED,
			);
			return entries as [
				string,
				{ status: EMcpServerStatus; tools: { name: string; description: string }[] },
			][];
		}, [mcpServers]);

		const selectedSet = useMemo(() => {
			const s = new Set<string>();
			for (const t of value) s.add(`${t.serverName}:${t.toolName}`);
			return s;
		}, [value]);

		const handleToggle = (serverName: string, toolName: string) => {
			const key = `${serverName}:${toolName}`;
			const next = new Set(selectedSet);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			const result: IToolAttachment[] = [];
			for (const k of next) {
				const idx = k.indexOf(":");
				if (idx > 0)
					result.push({ serverName: k.slice(0, idx), toolName: k.slice(idx + 1) });
			}
			onChange(result);
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

		const totalSelected = value.length;

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
						color={
							totalSelected > 0 ? "var(--wc-text-primary)" : "var(--wc-text-faint)"
						}
					>
						{totalSelected > 0 ? `${totalSelected} tool(s)` : "All tool calls"}
					</Text>
				</Box>
				{isOpen && (
					<Box
						ref={dropdownRef}
						position="absolute"
						top="100%"
						left={0}
						zIndex={10000}
						minW="220px"
						maxW="280px"
						maxH="250px"
						overflowY="auto"
						borderWidth="1px"
						borderColor="var(--wc-border-overlay)"
						borderRadius="lg"
						bg="var(--wc-bg-elevated)"
						shadow="lg"
						p="2"
					>
						{connectedServers.map(([serverName, state]) => {
							const isExpanded = expandedServers.has(serverName);
							const activeCount = state.tools.filter((t) =>
								selectedSet.has(`${serverName}:${t.name}`),
							).length;
							return (
								<Box key={serverName}>
									<Box
										display="flex"
										alignItems="center"
										justifyContent="space-between"
										p="1.5"
										borderRadius="md"
										cursor="pointer"
										fontSize="9px"
										fontWeight="600"
										color={
											activeCount > 0
												? "var(--wc-accent-blue)"
												: "var(--wc-text-muted)"
										}
										textTransform="uppercase"
										letterSpacing="0.05em"
										_hover={{ bg: "var(--wc-bg-card)" }}
										onClick={(e) => {
											e.stopPropagation();
											setExpandedServers((prev) => {
												const n = new Set(prev);
												isExpanded
													? n.delete(serverName)
													: n.add(serverName);
												return n;
											});
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
												<ChevronDown size={10} />
											) : (
												<ChevronRight size={10} />
											)}
											{serverName}
										</span>
										<span
											fontSize="8px"
											fontWeight={400}
											color="var(--wc-text-faint)"
										>
											{state.tools.length}
											{activeCount ? ` (${activeCount})` : ""}
										</span>
									</Box>
									{isExpanded && (
										<Box pl="2">
											{state.tools.map((tool) => {
												const isSelected = selectedSet.has(
													`${serverName}:${tool.name}`,
												);
												return (
													<Box
														key={tool.name}
														display="flex"
														alignItems="center"
														gap="6px"
														p="1"
														borderRadius="md"
														cursor="pointer"
														fontSize="11px"
														color="var(--wc-text-primary)"
														bg={
															isSelected
																? "var(--wc-bg-selected)"
																: "transparent"
														}
														_hover={{
															bg: isSelected
																? "var(--wc-bg-selected)"
																: "var(--wc-bg-card)",
														}}
														onClick={() =>
															handleToggle(serverName, tool.name)
														}
													>
														{isSelected && (
															<Check
																size={10}
																color="var(--wc-accent-blue)"
															/>
														)}
														<span
															overflow="hidden"
															textOverflow="ellipsis"
															whiteSpace="nowrap"
														>
															{tool.name}
														</span>
													</Box>
												);
											})}
										</Box>
									)}
								</Box>
							);
						})}
					</Box>
				)}
			</Box>
		);
	},
);
