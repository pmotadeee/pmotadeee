import { Box, HStack, Text } from "@chakra-ui/react";
import { Bot, Loader, PauseCircle } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { EToolCallStatus } from "@warpcore/bridge";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { useStore } from "@/store";
import { backgroundSubthread } from "@/api/services";

export const CreateSubthreadRenderer = React.memo(
	({
		agentName,
		title,
		message,
		status,
	}: {
		agentName?: string;
		title?: string;
		message?: string;
		status?: EToolCallStatus;
	}) => {
		const currentThreadId = useStore((s) => s.currentThreadId);
		const [actioning, setActioning] = useState(false);

		const showBackgroundBtn = status === EToolCallStatus.EXECUTING && !!currentThreadId;

		const handleBackground = useCallback(
			async (e: React.MouseEvent) => {
				e.stopPropagation();
				if (actioning || !currentThreadId) return;
				setActioning(true);
				try {
					await backgroundSubthread(currentThreadId);
				} catch {
					// ignore
				} finally {
					setActioning(false);
				}
			},
			[currentThreadId, actioning],
		);

		return (
			<Box px="3" py="2">
				<HStack gap="2" align="center" mb="1.5">
					<Bot size={12} color="var(--wc-text-secondary)" />
					<Text fontWeight="600" color="var(--wc-text-secondary)">
						{agentName ?? "agent"}: {title ?? "(untitled)"}
					</Text>
					{showBackgroundBtn && (
						<Box
							as="button"
							ml="auto"
							display="flex"
							alignItems="center"
							gap="1"
							px="1.5"
							py="0.5"
							borderRadius="sm"
							bg="var(--wc-bg-subtle)"
							color="var(--wc-text-muted)"
							fontSize="xs"
							fontWeight="500"
							cursor={actioning ? "not-allowed" : "pointer"}
							_hover={{ bg: "var(--wc-bg-hover)" }}
							onClick={handleBackground}
							title="Background this task"
						>
							{actioning ? (
								<Loader size={10} className="animate-spin" />
							) : (
								<PauseCircle size={10} />
							)}
							Background
						</Box>
					)}
				</HStack>
				<Box
					bg="var(--wc-overlay-dim)"
					borderRadius="sm"
					p="2"
					whiteSpace="pre-wrap"
					wordBreak="break-word"
				>
					<Text color="var(--wc-text-primary)">{message}</Text>
				</Box>
			</Box>
		);
	},
);

export const CreateSubthreadRendererMeta: IToolCallRenderer = {
	component: CreateSubthreadRenderer,
	keywords: ["create_subthread"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		if (typeof args.message !== "string") return false;
		return {
			agentName: args.agentName,
			title: args.title,
			message: args.message,
		};
	},
	renderMini: React.memo(({ args, status }) => {
		const { agentName, title } = useMemo(
			() => ({
				agentName: String(args?.agentName ?? "unknown"),
				title: String(args?.title ?? "untitled"),
			}),
			[args],
		);
		const currentThreadId = useStore((s) => s.currentThreadId);
		const [actioning, setActioning] = useState(false);

		const showBackgroundBtn = status === EToolCallStatus.EXECUTING && !!currentThreadId;

		const handleBackground = useCallback(
			async (e: React.MouseEvent) => {
				e.stopPropagation();
				if (actioning || !currentThreadId) return;
				setActioning(true);
				try {
					await backgroundSubthread(currentThreadId);
				} catch {
					// ignore
				} finally {
					setActioning(false);
				}
			},
			[currentThreadId, actioning],
		);

		return (
			<HStack gap="2" align="center" flex="1" minW="0">
				<Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
					{agentName}
					<Text as="span" color="var(--wc-text-muted)">
						: {title}
					</Text>
				</Text>
				{showBackgroundBtn && (
					<Box
						as="button"
						flexShrink={0}
						display="flex"
						alignItems="center"
						gap="1"
						px="1.5"
						py="0.5"
						borderRadius="sm"
						bg="var(--wc-bg-subtle)"
						color="var(--wc-text-muted)"
						fontSize="xs"
						fontWeight="500"
						cursor={actioning ? "not-allowed" : "pointer"}
						_hover={{ bg: "var(--wc-bg-hover)" }}
						onClick={handleBackground}
						title="Background this task"
					>
						{actioning ? (
							<Loader size={10} className="animate-spin" />
						) : (
							<PauseCircle size={10} />
						)}
						Background
					</Box>
				)}
			</HStack>
		);
	}),
};
