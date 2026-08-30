import { Badge, Box, Text } from "@chakra-ui/react";
import type { IAgent } from "@warpcore/shared";
import { Bot, Check } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store";

export const AgentPicker = React.memo(
	({
		value,
		onChange,
		onClick,
	}: {
		value: string[];
		onChange: (agents: string[]) => void;
		onClick?: (e: React.MouseEvent) => void;
	}) => {
		const agents = useStore((s) => s.agents);
		const servers = useStore((s) => s.servers);
		const [isOpen, setIsOpen] = useState(false);
		const dropdownRef = useRef<HTMLDivElement | null>(null);
		const triggerRef = useRef<HTMLDivElement | null>(null);

		const availableAgents = useMemo(() => Object.values(agents) as IAgent[], [agents]);

		const selectedSet = useMemo(() => new Set(value), [value]);

		// Count only ids that still exist (drop deleted agents)
		const validCount = useMemo(() => {
			const validIds = new Set(availableAgents.map((a) => a.id));
			return [...selectedSet].filter((aid) => validIds.has(aid)).length;
		}, [selectedSet, availableAgents]);

		const handleToggle = useCallback(
			(id: string) => {
				// Reconstruct from live agents so deleted agent ids are dropped
				const validIds = new Set(availableAgents.map((a) => a.id));
				const next = new Set([...selectedSet].filter((aid) => validIds.has(aid)));
				if (next.has(id)) {
					next.delete(id);
				} else {
					next.add(id);
				}
				onChange([...next]);
			},
			[selectedSet, onChange, availableAgents],
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
						{validCount > 0 ? `${validCount} agent(s)` : "No agents allowed"}
					</Text>
				</Box>
				{isOpen && (
					<Box
						ref={dropdownRef}
						position="absolute"
						top="100%"
						left={0}
						zIndex={10000}
						minW="260px"
						maxW="320px"
						maxH="280px"
						overflowY="auto"
						borderWidth="1px"
						borderColor="var(--wc-border-overlay)"
						borderRadius="lg"
						bg="var(--wc-bg-elevated)"
						shadow="lg"
						p="2"
					>
						{availableAgents.length === 0 && (
							<Text
								fontSize="xs"
								color="var(--wc-text-faint)"
								textAlign="center"
								p="3"
							>
								No agents available
							</Text>
						)}
						{availableAgents.map((agent) => {
							const isSelected = selectedSet.has(agent.id);
							const toolCount = agent.tools?.length ?? 0;
							return (
								<Box
									key={agent.id}
									display="flex"
									flexDirection="column"
									gap="1"
									p="2"
									borderRadius="md"
									cursor="pointer"
									bg={isSelected ? "var(--wc-bg-selected)" : "transparent"}
									_hover={{
										bg: isSelected
											? "var(--wc-bg-selected)"
											: "var(--wc-bg-card)",
									}}
									onClick={(e) => {
										e.stopPropagation();
										handleToggle(agent.id);
									}}
								>
									<Box display="flex" alignItems="center" gap="1.5">
										{isSelected && (
											<Check size={12} color="var(--wc-accent-green)" />
										)}
										{!isSelected && (
											<Bot
												size={13}
												color="var(--wc-text-muted)"
												flexShrink={0}
											/>
										)}
										<Text fontWeight="600" fontSize="sm" flex="1" minW="0">
											{agent.name}
										</Text>
										<Badge
											size="xs"
											fontSize="9px"
											bg="var(--wc-bg-subtle)"
											color="var(--wc-text-muted)"
											borderRadius="sm"
											px="1.5"
											flexShrink={0}
										>
											{toolCount} tool{toolCount === 1 ? "" : "s"}
										</Badge>
									</Box>
									{agent.description && (
										<Text
											fontSize="12px"
											color="var(--wc-text-faint)"
											lineHeight="1.3"
											maxH="2.6em"
											overflow="hidden"
											pl={isSelected ? "4" : "5"}
										>
											{agent.description}
										</Text>
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
