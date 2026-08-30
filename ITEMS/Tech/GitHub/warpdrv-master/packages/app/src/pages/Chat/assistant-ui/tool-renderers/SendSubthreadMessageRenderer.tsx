import { Box, HStack, Text } from "@chakra-ui/react";
import { ArrowDown, ArrowUp, Loader, PauseCircle } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { EToolCallStatus } from "@warpcore/bridge";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { useStore } from "@/store";
import { backgroundSubthread } from "@/api/services";

const TRUNCATE_AT = 80;

function truncate(s: string, n: number): string {
	return s.length > n ? s.slice(0, n) + "…" : s;
}

export const SendSubthreadMessageRenderer = React.memo(
	({
		message,
		subThreadId,
		status,
	}: {
		message?: string;
		subThreadId?: string;
		status?: EToolCallStatus;
	}) => {
		const isSub = subThreadId !== undefined;
		const currentThreadId = useStore((s) => s.currentThreadId);
		const [actioning, setActioning] = useState(false);

		// Background button only applies to subthread_send_message (downward).
		const showBackgroundBtn =
			isSub && status === EToolCallStatus.EXECUTING && !!currentThreadId;

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
					{isSub ? (
						<ArrowDown size={12} color="var(--wc-text-secondary)" />
					) : (
						<ArrowUp size={12} color="var(--wc-text-secondary)" />
					)}
					<Text fontWeight="600" color="var(--wc-text-secondary)">
						{isSub ? "To subthread" : "To superthread"}
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

export const SendSubthreadMessageRendererMeta: IToolCallRenderer = {
	component: SendSubthreadMessageRenderer,
	keywords: ["subthread_send_message", "superthread_send_message"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		if (typeof args.message !== "string") return false;
		return {
			message: args.message,
			subThreadId: args.subThreadId,
		};
	},
	renderMini: React.memo(({ args, status }) => {
		const { label, dir, isSub } = useMemo(() => {
			const message = String(args?.message ?? "");
			const isSub = args?.subThreadId !== undefined;
			return {
				label: truncate(message, TRUNCATE_AT),
				dir: isSub ? "↓ " : "↑ ",
				isSub,
			};
		}, [args]);
		const currentThreadId = useStore((s) => s.currentThreadId);
		const [actioning, setActioning] = useState(false);

		// Background button only applies to subthread_send_message (downward).
		const showBackgroundBtn =
			isSub && status === EToolCallStatus.EXECUTING && !!currentThreadId;

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
					Send{" "}
					<Text as="span" color="var(--wc-text-muted)">
						{dir}
						{label}
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
