import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { useStore } from "@/store";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { PathDisplay } from "./path-display";
import { extractResultText, relativePath, splitPath } from "./utils";

interface IRgMatch {
	file: string;
	line: number;
	text: string;
}

export const RgRenderer = React.memo(
	(props: {
		pattern?: string;
		path?: string;
		type?: string;
		caseSensitive?: boolean;
		maxResults?: number;
		contextLines?: number;
		result?: unknown;
	}) => {
		const { pattern, path, type, caseSensitive, result } = props;
		const text = extractResultText(result);
		let matches: IRgMatch[] | null = null;
		let truncated = false;
		if (text) {
			try {
				const d = JSON.parse(text);
				matches = Array.isArray(d?.matches) ? d.matches : null;
				truncated = !!d?.truncated;
			} catch {}
		}
		const [expanded, setExpanded] = useState(false);

		const bits: string[] = [];
		if (type) bits.push("type: " + type);
		if (caseSensitive) bits.push("case-sensitive");

		return (
			<Box px="3" py="2">
				{/* Header removed — info shown in mini renderer */}
				{/* <HStack gap="2" align="center" mb={matches?.length ? '2' : '0'}>
				<Search size={13} color="var(--wc-text-secondary)" />
				<Text fontSize="calc(var(--chat-font-size) - 2px)" fontFamily="mono" color="var(--wc-text-primary)">
								<Text as="span" color="var(--wc-text-muted)">rg</Text> {String(pattern ?? '(no pattern)')}
							</Text>
																												{path && <Text fontSize="calc(var(--chat-font-size) - 4px)" fontFamily="mono" style={{color: "var(--wc-text-muted)"}}>{splitPath(String(path)).dir}<Text color="var(--wc-text-primary)" fontWeight="bold">{splitPath(String(path)).file}</Text></Text>}
							{bits.length > 0 && <Text fontSize="calc(var(--chat-font-size) - 4px)" color="var(--wc-text-faint)">{bits.join(' · ')}</Text>}
			</HStack> */}
				{matches && matches.length > 0 && (
					<Box>
						{/* Toggle removed — results shown directly */}
						{/* <HStack gap="1" cursor="pointer" onClick={() => setExpanded(!expanded)} py="1">
						{expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
						<Text fontSize="calc(var(--chat-font-size) - 3px)" color="var(--wc-text-muted)">{String(matches.length)} match{matches.length > 1 ? 'es' : ''}</Text>
										{truncated && <Text fontSize="calc(var(--chat-font-size) - 4px)" color="var(--wc-accent-yellow-strong)">truncated</Text>}
					</HStack> */}
						<Box
							bg="var(--wc-overlay-dim)"
							borderRadius="sm"
							p="2"
							overflow="auto"
							maxH="300px"
						>
							<VStack gap="1" align="stretch">
								{matches.map((m, i) => (
									<Box key={i}>
										<HStack gap="2" align="center">
											<Text
												fontSize="calc(var(--chat-font-size))"
												fontFamily="mono"
												color="var(--wc-text-faint)"
												minW="30px"
											>
												{String(m.line)}
											</Text>
											<Text
												fontSize="calc(var(--chat-font-size))"
												fontFamily="mono"
												color="var(--wc-text-muted)"
											>
												{String(m.file)}
											</Text>
										</HStack>
										<Text
											fontSize="calc(var(--chat-font-size))"
											fontFamily="mono"
											color="var(--wc-text-secondary)"
											whiteSpace="pre-wrap"
											wordBreak="break-all"
											pl="5"
										>
											{String(m.text)}
										</Text>
									</Box>
								))}
							</VStack>
						</Box>
					</Box>
				)}
			</Box>
		);
	},
);

export const RgRendererMeta: IToolCallRenderer = {
	component: RgRenderer,
	keywords: ["rg", "ripgrep", "grep"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		const pattern = typeof args.pattern === "string" ? args.pattern : undefined;
		if (!pattern) return false;
		const path = typeof args.path === "string" ? args.path : undefined;
		const type = typeof args.type === "string" ? args.type : undefined;
		const caseSensitive =
			typeof args.caseSensitive === "boolean" ? args.caseSensitive : undefined;
		const maxResults = typeof args.maxResults === "number" ? args.maxResults : undefined;
		const contextLines = typeof args.contextLines === "number" ? args.contextLines : undefined;
		return { pattern, path, type, caseSensitive, maxResults, contextLines };
	},
	renderMini: React.memo(({ args, result }) => {
		const projectRoot = useStore((s) => {
			const ts = s.getCurrentThreadState(s);
			return (
				(ts?.projectRoot as string) ||
				(s.workspaceStates[s.activeWorkspaceId]?.projectRoot as string)
			);
		});
		const pattern = typeof args.pattern === "string" ? args.pattern : "";
		const path = typeof args.path === "string" ? args.path : undefined;
		const truncated = pattern.length > 60 ? pattern.slice(0, 57) + "..." : pattern;
		const countLabel = useMemo(() => {
			try {
				const text = extractResultText(result);
				if (!text) return "";
				const parsed = JSON.parse(text);
				const c = parsed?.matches?.length;
				if (typeof c === "number") return ` (${c} match${c === 1 ? "" : "es"})`;
			} catch {}
			return "";
		}, [result]);
		if (path) {
			const { dir, file } = splitPath(relativePath(path, projectRoot));
			return (
				<Text whiteSpace="nowrap">
					grep{" "}
					<Text as="span" color="var(--wc-text-muted)">
						"{truncated}"
					</Text>{" "}
					in <PathDisplay dir={dir} file={file} />
					{countLabel && (
						<Text as="span" color="var(--wc-text-muted)">
							{countLabel}
						</Text>
					)}
				</Text>
			);
		}
		return (
			<Text whiteSpace="nowrap">
				grep{" "}
				<Text as="span" color="var(--wc-text-muted)">
					"{truncated}"
				</Text>
				{countLabel && (
					<Text as="span" color="var(--wc-text-muted)">
						{countLabel}
					</Text>
				)}
			</Text>
		);
	}),
};
