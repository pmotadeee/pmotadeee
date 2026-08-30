import type { IGuardrailDefinition, IMode } from "@warpcore/shared";
import { persistence } from "../index";

const DEFAULT_MODES: IMode[] = [
	{
		id: "default-plan",
		name: "Plan",
		scope: "global",
		color: "#FF9F38",
		prompt: `When in PLAN mode, conduct proper investigation and research as the user requests. Then come up with a plan. Do NOT write or patch files - make no edit whatsoever. Wait for the user to approve the plan.

In general, understand the user's request first by exploring the project, if you run into conflicting request or issues understanding the code-base, or if there are gaps in your understanding of the user's request, do NOT make assumption or overthink. Instead choose to ASK the user for clarifications rather than waste token on thinking 'what-ifs'. 

For reading files, first start with reading CLAUDE.md, AGENTS.md from the project root. Then use codegraph or rg to get matches, then use those obtained line numbers to read parts of relevant files.

Do not read entire files, always read using line ranges only. Do not execute broad grep/rg. Do not read the same code block multiple times, always re-use past context.

Follow mode restriction on tools - see allowed tools list for this mode.
`,
		allowedTools: [
			{ serverName: "warpmcp", toolName: "file_read" },
			{ serverName: "warpmcp", toolName: "dir_list" },
			{ serverName: "warpmcp", toolName: "todo_write" },
			{ serverName: "warpmcp", toolName: "rg" },
			{ serverName: "warpmcp", toolName: "code_graph_search" },
			{ serverName: "warpmcp", toolName: "code_graph_symbol" },
			{ serverName: "warpmcp", toolName: "code_graph_callers" },
			{ serverName: "warpmcp", toolName: "code_graph_callees" },
			{ serverName: "warpmcp", toolName: "code_graph_list" },
			{ serverName: "warpmcp", toolName: "todo_read" },
			{ serverName: "warpmcp", toolName: "chat_search" },
			{ serverName: "warpmcp", toolName: "chat_get_message" },
		],
		allowedAgents: [],
		activeGuardrails: [],
	},
	{
		id: "default-build",
		name: "Build",
		scope: "global",
		color: "#00B7FF",
		prompt: `When in BUILD mode, strictly follow the plan the user agreed upon and proceed with the exact implementation. Do not add anything that's out of scope or not agreed upon. If any new conflicts or issues are discovered, stop and ask the user for confirmation first.

  For writing files, use the project root. For navigating the codebase, use codegraph and rg to get matches, then use line ranges to read parts of files. Do not read entire files at once, always read using line ranges only. Do not read the same section of a file multiple times, conserve context and tokens. Do not execute broad grep/rg or use generic-sounding terms for greps.
  
 Follow mode restriction on tools - see allowed tools list for this mode.
  `,
		allowedTools: [
			{ serverName: "warpmcp", toolName: "file_read" },
			{ serverName: "warpmcp", toolName: "file_patch" },
			{ serverName: "warpmcp", toolName: "file_write" },
			{ serverName: "warpmcp", toolName: "dir_list" },
			{ serverName: "warpmcp", toolName: "todo_write" },
			{ serverName: "warpmcp", toolName: "rg" },
			{ serverName: "warpmcp", toolName: "code_graph_search" },
			{ serverName: "warpmcp", toolName: "code_graph_symbol" },
			{ serverName: "warpmcp", toolName: "code_graph_callers" },
			{ serverName: "warpmcp", toolName: "code_graph_callees" },
			{ serverName: "warpmcp", toolName: "code_graph_list" },
			{ serverName: "warpmcp", toolName: "todo_read" },
			{ serverName: "warpmcp", toolName: "shell_exec" },
		],
		allowedAgents: [],
		activeGuardrails: ["gr-rm-guard", "gr-code-review"],
	},
];

const DEFAULT_GUARDRAILS: IGuardrailDefinition[] = [
	{
		id: "gr-rm-guard",
		name: "rm-guard",
		serverId: "",
		prompt: "Destructive shell commands such as rm, rm -rf, shred, dd, mkfs, and similar data-destruction commands are strictly forbidden. Flag any occurrence as a violation.",
		triggerOnTools: [{ serverName: "warpmcp", toolName: "shell_exec" }],
		inferenceParams: {},
		messagesCount: 0,
		includeBaseMessage: false,
	},
	{
		id: "gr-code-review",
		name: "code_review",
		serverId: "",
		prompt: `Review the code and ensure it follows TypeScript standards. If the code uses React, React best practices must be followed: avoid conditional hooks, ever-changing selectors, and bad useEffect hooks.

Review the code to ensure it will not crash or pose a security risk. Check for injection of secrets/keys or hard-coded environment-specific values/paths, and flag them as violations.

Flag serious issues as violations, minor suggestions as warnings. Code-related checks are performed on the code being written, not on file paths or other parameters of the tool call.`,
		triggerOnTools: [
			{ serverName: "warpmcp", toolName: "file_write" },
			{ serverName: "warpmcp", toolName: "file_patch" },
		],
		inferenceParams: { enableThinking: false, reasoningEffort: "medium" },
		messagesCount: 0,
		includeBaseMessage: false,
	},
];

export async function seedDefaults(): Promise<void> {
	try {
		const existingModes = await persistence.listModes();
		const existingGuardrails = await persistence.listGuardrails();

		// Only seed on first run (no modes and no guardrails)
		if (existingModes.length > 0 || Object.keys(existingGuardrails).length > 0) {
			return;
		}

		for (const g of DEFAULT_GUARDRAILS) {
			await persistence.upsertGuardrail(g);
			console.log(`[seed] Added default guardrail: ${g.name} (${g.id})`);
		}
		for (const mode of DEFAULT_MODES) {
			await persistence.upsertMode(mode);
			console.log(`[seed] Added default mode: ${mode.name} (${mode.id})`);
		}
	} catch (err) {
		console.error("[seed] Failed to seed defaults:", err);
	}
}
