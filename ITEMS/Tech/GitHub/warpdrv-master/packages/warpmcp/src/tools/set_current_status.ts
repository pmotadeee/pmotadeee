import type { IWarpmcpDeps } from "../types";

function guard(deps: IWarpmcpDeps, fn: keyof IWarpmcpDeps) {
	if (!deps[fn]) throw new Error(`${String(fn)} not available`);
}

// set_current_status
export const setCurrentStatusDefinition = {
	name: "set_current_status",
	description: "Set the current status for this thread.",
	inputSchema: {
		type: "object",
		properties: {
			status: {
				type: "string",
				description: "A short status string describing the current state.",
			},
		},
		required: ["status"],
	},
	resultLimit: 40960,
};
export async function setCurrentStatusHandler(
	deps: IWarpmcpDeps,
	args: { threadId: string; status: string },
): Promise<{ ok: boolean; status: string }> {
	guard(deps, "setCurrentStatus");
	await deps.setCurrentStatus!(args.threadId, args.status);
	return { ok: true, status: args.status };
}
