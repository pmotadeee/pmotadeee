import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { useStore } from "@/store";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { PathDisplay } from "./path-display";
import { extractResultText, relativePath, splitPath } from "./utils";

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

export const CodeGraphListRenderer = React.memo((props: { path?: string; result?: unknown }) => {
	const { path, result } = props;
	const text = extractResultText(result);
	let nodes: INode[] | null = null;
	if (text) {
		try {
			const d = JSON.parse(text);
			nodes = Array.isArray(d?.results) ? d.results : null;
		} catch {}
	}
	const [expanded, setExpanded] = useState(false);

	return (
		<Box px="3" py="2">
			{/* Header removed — info shown in mini renderer */}
			{/* <HStack gap="2" align="center" mb={nodes?.length ? '2' : '0'}>
				<List size={13} color="var(--wc-text-secondary)" />
																																				<Text fontSize="calc(var(--chat-font-size) - 2px)" fontFamily="mono">{splitPath(path ? String(path) : '(project root)').dir}<Text color="var(--wc-text-primary)" fontWeight="bold">{splitPath(path ? String(path) : '(project root)').file}</Text></Text>
			</HStack> */}
			{nodes && nodes.length > 0 && (
				<Box>
					{/* Toggle removed — results shown directly */}
					{/* <HStack gap="1" cursor="pointer" onClick={() => setExpanded(!expanded)} py="1">
						{expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
												<Text fontSize="calc(var(--chat-font-size) - 3px)" color="var(--wc-text-muted)">{String(nodes.length)} symbol{nodes.length > 1 ? 's' : ''}</Text>
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
});

export const CodeGraphListRendererMeta: IToolCallRenderer = {
	component: CodeGraphListRenderer,
	keywords: ["code_graph_list"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		const path = typeof args.path === "string" ? args.path : undefined;
		if (path === undefined) return false;
		return { path };
	},
	renderMini: React.memo(({ args, result }) => {
		const projectRoot = useStore((s) => {
			const ts = s.getCurrentThreadState(s);
			return (
				(ts?.projectRoot as string) ||
				(s.workspaceStates[s.activeWorkspaceId]?.projectRoot as string)
			);
		});
		const path = typeof args.path === "string" ? args.path : "(project root)";
		const { dir, file } = splitPath(relativePath(path, projectRoot));
		const countLabel = useMemo(() => {
			try {
				const text = extractResultText(result);
				if (!text) return "";
				const parsed = JSON.parse(text);
				const c = parsed?.results?.length;
				if (typeof c === "number" && c > 0) return ` (${c} symbol${c === 1 ? "" : "s"})`;
			} catch {}
			return "";
		}, [result]);
		return (
			<Text whiteSpace="nowrap">
				Code List <PathDisplay dir={dir} file={file} />
				{countLabel && (
					<Text as="span" color="var(--wc-text-faint)">
						{countLabel}
					</Text>
				)}
			</Text>
		);
	}),
};
