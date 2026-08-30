import { Box, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { useStore } from "@/store";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { PathDisplay } from "./path-display";
import { extractResultText, relativePath, splitPath } from "./utils";

export const ReadFileRenderer = React.memo(
	(props: {
		path?: string;
		head?: number;
		tail?: number;
		offset?: number;
		length?: number;
		lineStart?: number;
		lineEnd?: number;
		result?: unknown;
	}) => {
		const { path, head, tail, offset, length, lineStart, lineEnd, result } = props;
		const resultText = (() => {
			if (result == null) return;
			const extracted = extractResultText(result);
			if (!extracted) return typeof result === "string" ? result : JSON.stringify(result);
			try {
				const parsed = JSON.parse(extracted);
				if (
					typeof parsed === "object" &&
					parsed !== null &&
					typeof (parsed as any).content === "string"
				) {
					return (parsed as any).content;
				}
			} catch {
				/* not JSON */
			}
			return extracted;
		})();
		const [expanded, setExpanded] = useState(false);
		const rangeBits: string[] = [];
		if (head !== undefined) rangeBits.push(`head ${head}`);
		if (tail !== undefined) rangeBits.push(`tail ${tail}`);
		if (offset !== undefined) rangeBits.push(`offset ${offset}`);
		if (length !== undefined) rangeBits.push(`length ${length}`);
		if (lineStart !== undefined) {
			rangeBits.push(
				lineEnd !== undefined ? `lines ${lineStart}-${lineEnd}` : `lines ${lineStart}+`,
			);
		}
		const lineCount = resultText ? resultText.split("\n").length : 0;
		return (
			<Box px="3" py="2">
				{/* Header removed — info shown in mini renderer */}
				{/* <HStack gap="2" align="center">
				<FileText size={13} color="var(--wc-text-secondary)" />
				<Text fontSize="calc(var(--chat-font-size) - 2px)" fontFamily="mono" wordBreak="break-all">
						<Text color="var(--wc-text-muted)">{splitPath(path ?? '(no path)').dir}</Text><Text color="var(--wc-text-primary)" fontWeight="bold">{splitPath(path ?? '(no path)').file}</Text>
				</Text>
							{rangeBits.length > 0 && (
								<Text fontSize="calc(var(--chat-font-size) - 4px)" color="var(--wc-text-faint)">
						{rangeBits.join(' · ')}
					</Text>
				)}
			</HStack> */}
				{resultText && (
					<Box mt="2">
						{/* Toggle removed — results shown directly */}
						{/* <HStack gap="1" cursor="pointer" onClick={() => setExpanded(!expanded)} py="1">
						{expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
						<Text fontSize="calc(var(--chat-font-size) - 1px)" color="var(--wc-text-muted)">{resultText.length} bytes ({lineCount} lines)</Text>
					</HStack> */}
						<Box
							bg="var(--wc-overlay-dim)"
							borderRadius="sm"
							p="2"
							overflow="auto"
							maxH="400px"
						>
							<Text
								fontSize="calc(var(--chat-font-size))"
								fontFamily="mono"
								color="var(--wc-text-secondary)"
								whiteSpace="pre-wrap"
							>
								{resultText}
							</Text>
						</Box>
					</Box>
				)}
			</Box>
		);
	},
);

export const ReadFileRendererMeta: IToolCallRenderer = {
	component: ReadFileRenderer,
	keywords: ["read", "cat", "view", "open", "get", "fetch", "load"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		const path = args.path ?? args.file_path ?? args.filepath ?? args.filename ?? args.file;
		if (typeof path !== "string" || path.length === 0) return false;
		// Reject if it also looks like a write/edit (must NOT have content/old/edits)
		if (typeof args.content === "string") return false;
		if (typeof args.old_string === "string" || typeof args.new_string === "string")
			return false;
		if (Array.isArray(args.edits)) return false;
		const head = typeof args.head === "number" ? args.head : undefined;
		const tail = typeof args.tail === "number" ? args.tail : undefined;
		const offset = typeof args.offset === "number" ? args.offset : undefined;
		const length = typeof args.length === "number" ? args.length : undefined;
		const lineStart = typeof args.line_start === "number" ? args.line_start : undefined;
		const lineEnd = typeof args.line_end === "number" ? args.line_end : undefined;
		return { path, head, tail, offset, length, lineStart, lineEnd };
	},
	renderMini: React.memo(({ args }) => {
		const projectRoot = useStore((s) => {
			const ts = s.getCurrentThreadState(s);
			return (
				(ts?.projectRoot as string) ||
				(s.workspaceStates[s.activeWorkspaceId]?.projectRoot as string)
			);
		});
		const path = args.path ?? args.file_path ?? args.filepath ?? args.filename ?? args.file;
		if (typeof path !== "string") return "";
		const { dir, file } = splitPath(relativePath(path, projectRoot));
		const parts: string[] = [];
		if (typeof args.line_start === "number") {
			const end = typeof args.line_end === "number" ? args.line_end : "+";
			parts.push(`lines ${args.line_start}-${end}`);
		} else if (typeof args.head === "number") {
			parts.push(`head ${args.head}`);
		} else if (typeof args.tail === "number") {
			parts.push(`tail ${args.tail}`);
		}
		return (
			<Text whiteSpace="nowrap">
				Read <PathDisplay dir={dir} file={file} />
				{parts.length > 0 && (
					<Text as="span" color="var(--wc-text-faint)">
						{" "}
						({parts.join(", ")})
					</Text>
				)}
			</Text>
		);
	}),
};
