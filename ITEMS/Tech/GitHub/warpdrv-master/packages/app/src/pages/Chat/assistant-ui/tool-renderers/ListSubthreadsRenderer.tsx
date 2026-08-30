import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Circle } from "lucide-react";
import React, { useMemo } from "react";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { extractResultText } from "./utils";

interface ISubthreadEntry {
	threadId: string;
	title: string;
	pendingMessages: number;
}

// The MCP tool-call result is a JSON string of content blocks
// [{type:"text", text:"<json>"}]. extractResultText unwraps the text
// block(s) into the inner JSON string. We parse that, falling back to a
// direct-array result for robustness.
function parseSubthreads(result: unknown): ISubthreadEntry[] | null {
	const candidates: unknown[] = [];
	const text = extractResultText(result);
	if (text) candidates.push(text);
	if (Array.isArray(result)) candidates.push(result);

	for (const c of candidates) {
		let parsed = c;
		if (typeof c === "string") {
			try {
				parsed = JSON.parse(c);
			} catch {
				continue;
			}
		}
		if (Array.isArray(parsed)) {
			return (parsed as ISubthreadEntry[]).filter((e) => e && typeof e.threadId === "string");
		}
	}
	return null;
}

const SubthreadRow = React.memo(({ entry }: { entry: ISubthreadEntry }) => {
	const hasPending = entry.pendingMessages > 0;
	return (
		<HStack gap="2" align="center" py="0.5">
			<Circle
				size={6}
				fill={hasPending ? "var(--wc-accent-yellow-strong)" : "var(--wc-text-faint)"}
				color="transparent"
			/>
			<Text
				flex="1"
				minWidth="0"
				color="var(--wc-text-primary)"
				whiteSpace="nowrap"
				overflow="hidden"
				textOverflow="ellipsis"
			>
				{entry.title}
			</Text>
			{hasPending && (
				<Box
					as="span"
					fontWeight="600"
					fontSize={"xs"}
					color="var(--wc-accent-yellow-strong)"
					bg="var(--wc-accent-yellow-bg-8)"
					borderRadius="sm"
					px="1.5"
					whiteSpace="nowrap"
				>
					{entry.pendingMessages} pending
				</Box>
			)}
		</HStack>
	);
});

export const ListSubthreadsRenderer = React.memo(({ result }: { result?: unknown }) => {
	const entries = useMemo(() => parseSubthreads(result), [result]);
	if (!entries || entries.length === 0) {
		return (
			<Box px="3" py="2">
				<Text color="var(--wc-text-faint)">No subthreads</Text>
			</Box>
		);
	}
	return (
		<Box px="3" py="2">
			<Text fontWeight="600" color="var(--wc-text-secondary)" mb="1">
				{entries.length} subthread{entries.length !== 1 ? "s" : ""}
			</Text>
			<VStack gap="0" align="stretch">
				{entries.map((e) => (
					<SubthreadRow key={e.threadId} entry={e} />
				))}
			</VStack>
		</Box>
	);
});

export const ListSubthreadsRendererMeta: IToolCallRenderer = {
	component: ListSubthreadsRenderer,
	keywords: ["list_subthreads"],
	canRender: (): TCanRenderResult => ({}),
	renderMini: React.memo(({ result }) => {
		const entries = useMemo(() => parseSubthreads(result), [result]);
		const count = entries?.length ?? 0;
		return (
			<Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
				List{" "}
				<Text as="span" color="var(--wc-text-muted)">
					{count > 0 ? `${count} subthread${count !== 1 ? "s" : ""}` : "subthreads"}
				</Text>
			</Text>
		);
	}),
};
