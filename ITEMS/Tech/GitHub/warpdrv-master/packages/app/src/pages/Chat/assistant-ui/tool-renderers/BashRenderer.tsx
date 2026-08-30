import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useState } from "react";
import { parse } from "shell-quote";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";
import { extractResultText } from "./utils";

const OPERATORS = new Set(["&&", "||", ";", "|", "&"]);

function splitCommand(command: string): string[] {
	const parsed = parse(command);
	const groups: string[][] = [[]];
	for (const token of parsed) {
		if (
			typeof token === "object" &&
			token !== null &&
			"op" in token &&
			OPERATORS.has(token.op)
		) {
			groups.push([]);
		} else if (typeof token === "string") {
			groups[groups.length - 1].push(token);
		} else if (typeof token === "object" && token !== null && "op" in token) {
			groups[groups.length - 1].push(token.op);
		}
	}
	return groups.map((g) => g.join(" ").trim()).filter((s) => s.length > 0);
}

export const BashRenderer = React.memo(
	(props: { command?: string; cwd?: string; shell?: string; result?: unknown }) => {
		const { command, cwd, shell, result } = props;
		const subCommands = command ? splitCommand(command) : [];
		const resultText = extractResultText(result);
		const [resultExpanded, setResultExpanded] = useState(false);

		return (
			<Box px="3" py="2">
				{/* Header removed — info shown in mini renderer */}
				{/* <HStack gap="2" align="center" mb="2">
				<Terminal size={13} color="var(--wc-text-secondary)" />
				<Text fontSize="calc(var(--chat-font-size) - 3px)" color="var(--wc-text-faint)">
								{shell ?? 'shell'}
								{cwd && <Text as="span" color="var(--wc-text-muted)"> · {cwd}</Text>}
							</Text>
			</HStack> */}

				<Box bg="var(--wc-overlay-dim)" borderRadius="sm" p="2" mb="2" overflow="auto">
					<Text
						fontSize="calc(var(--chat-font-size) - 2px)"
						fontFamily="mono"
						color="var(--wc-text-primary)"
						whiteSpace="pre-wrap"
						wordBreak="break-all"
					>
						{command ?? "(no command)"}
					</Text>
				</Box>

				<VStack gap="1" align="stretch">
					{subCommands.map((sub, i) => (
						<HStack key={i} gap="2" align="flex-start">
							<Text
								fontSize="calc(var(--chat-font-size) - 2px)"
								color="var(--wc-text-faint)"
								minW="20px"
							>
								{i + 1}.
							</Text>
							<Text
								fontSize="calc(var(--chat-font-size) - 3px)"
								fontFamily="mono"
								color="var(--wc-text-secondary)"
								whiteSpace="pre-wrap"
								wordBreak="break-all"
							>
								{sub}
							</Text>
						</HStack>
					))}
				</VStack>
				{resultText && (
					<Box mt="2">
						{/* Toggle removed — results shown directly */}
						{/* <HStack gap="1" cursor="pointer" onClick={() => setResultExpanded(!resultExpanded)} py="1">
						{resultExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
												<Text fontSize="calc(var(--chat-font-size) - 3px)" color="var(--wc-text-muted)">Output</Text>
					</HStack> */}
						<Box
							bg="var(--wc-overlay-dim)"
							borderRadius="sm"
							p="2"
							overflow="auto"
							maxH="300px"
						>
							<Text
								fontSize="calc(var(--chat-font-size) - 3px)"
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

export const BashRendererMeta: IToolCallRenderer = {
	component: BashRenderer,
	keywords: ["bash", "shell", "command", "exec", "execute", "run", "terminal", "cmd", "process"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		const command = args.command ?? args.cmd ?? args.script ?? args.bash;
		if (typeof command !== "string" || command.length === 0) return false;
		const cwd = args.cwd ?? args.workdir ?? args.working_directory;
		const shell = args.shell ?? args.interpreter;
		return {
			command,
			cwd: typeof cwd === "string" ? cwd : undefined,
			shell: typeof shell === "string" ? shell : undefined,
		};
	},
	renderMini: React.memo(({ args }) => {
		const command = args.command ?? args.cmd ?? args.script ?? args.bash;
		if (typeof command !== "string") return "";
		const truncated = command.length > 80 ? command.slice(0, 77) + "..." : command;
		return <Text whiteSpace="nowrap">{truncated}</Text>;
	}),
};
