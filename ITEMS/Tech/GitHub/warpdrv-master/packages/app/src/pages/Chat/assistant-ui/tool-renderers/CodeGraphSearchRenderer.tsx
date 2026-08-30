import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { extractResultText } from "./utils";

interface INode {
	symbol: string;
	kind: string;
	filePath: string;
	startLine: number;
}

const KIND_COLORS: Record<string, string> = {
	function: "var(--wc-accent-blue)",
	class: "var(--wc-accent-purple)",
	interface: "var(--wc-accent-cyan)",
	type: "var(--wc-accent-yellow-strong)",
	method: "var(--wc-accent-blue)",
	variable: "var(--wc-text-muted)",
	enum: "var(--wc-accent-orange)",
};

export const CodeGraphSearchRenderer = React.memo(
	(props: {
		query?: string;
		kind?: string;
		filePath?: string;
		limit?: number;
		result?: unknown;
	}) => {
		const { query, kind, filePath, limit, result } = props;
		const text = extractResultText(result);
		let nodes: INode[] | null = null;
		if (text) {
			try {
				const d = JSON.parse(text);
				nodes = Array.isArray(d?.results) ? d.results : null;
			} catch {}
		}
		const [expanded, setExpanded] = useState(false);

		const bits: string[] = [];
		if (kind) bits.push(kind);
		if (filePath) bits.push(filePath);
		if (limit) bits.push(String(limit));

		return (
			<Box px="3" py="2">
				{/* Header removed — info shown in mini renderer */}
				{/* <HStack gap="2" align="center" mb={nodes?.length ? '2' : '0'}>
				<Search size={13} color="var(--wc-text-secondary)" />
				<Text fontSize="calc(var(--chat-font-size) - 2px)" color="var(--wc-text-primary)">{String(query ?? '(no query)')}</Text>
							{bits.length > 0 && <Text fontSize="calc(var(--chat-font-size) - 4px)" color="var(--wc-text-faint)">{bits.join(' · ')}</Text>}
			</HStack> */}
				{nodes && nodes.length > 0 && (
					<Box>
						{/* Toggle removed — results shown directly */}
						{/* <HStack gap="1" cursor="pointer" onClick={() => setExpanded(!expanded)} py="1">
						{expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
												<Text fontSize="calc(var(--chat-font-size) - 3px)" color="var(--wc-text-muted)">{String(nodes.length)} results</Text>
					</HStack> */}
						<Box
							bg="var(--wc-overlay-dim)"
							borderRadius="sm"
							p="2"
							overflow="auto"
							maxH="300px"
						>
							<VStack gap="1" align="stretch">
								{nodes.map((n, i) => (
									<HStack key={i} gap="2" align="center">
										<Badge
											fontSize="calc(var(--chat-font-size) - 5px)"
											color={KIND_COLORS[n.kind] ?? "var(--wc-text-muted)"}
											bg="var(--wc-bg-surface)"
											px="1"
											py="0"
											minW="50px"
											textAlign="center"
										>
											{String(n.kind)}
										</Badge>
										<Text
											fontSize="calc(var(--chat-font-size) - 3px)"
											fontFamily="mono"
											color="var(--wc-text-primary)"
										>
											{String(n.symbol)}
										</Text>
										<Box flex="1" />
										<Text
											fontSize="calc(var(--chat-font-size) - 2px)"
											fontFamily="mono"
											color="var(--wc-text-faint)"
										>
											{String(n.filePath)}:{String(n.startLine)}
										</Text>
									</HStack>
								))}
							</VStack>
						</Box>
					</Box>
				)}
			</Box>
		);
	},
);

export const CodeGraphSearchRendererMeta: IToolCallRenderer = {
	component: CodeGraphSearchRenderer,
	keywords: ["code_graph_search"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		const query = typeof args.query === "string" ? args.query : undefined;
		if (!query) return false;
		const kind = typeof args.kind === "string" ? args.kind : undefined;
		const filePath = typeof args.file_path === "string" ? args.file_path : undefined;
		const limit = typeof args.limit === "number" ? args.limit : undefined;
		return { query, kind, filePath, limit };
	},
	renderMini: React.memo(({ args, result }) => {
		const query = typeof args.query === "string" ? args.query : "";
		const truncated = query.length > 50 ? query.slice(0, 47) + "..." : query;
		const countLabel = useMemo(() => {
			try {
				const text = extractResultText(result);
				if (!text) return "";
				const parsed = JSON.parse(text);
				const c = parsed?.results?.length;
				if (typeof c === "number" && c > 0) return ` — ${c} result${c === 1 ? "" : "s"}`;
			} catch {}
			return "";
		}, [result]);
		return (
			<Text whiteSpace="nowrap">
				Code Search "{truncated}"
				{countLabel && (
					<Text as="span" color="var(--wc-text-faint)">
						{countLabel}
					</Text>
				)}
			</Text>
		);
	}),
};
