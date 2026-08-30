import type { IWarpmcpDeps } from "../types";

export const listSubthreadsDefinition = {
	name: "list_subthreads",
	description:
		"List all subthreads (child threads) of the current thread with their titles and pending notification counts.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
	resultLimit: 40960,
};

export async function listSubthreadsHandler(deps: IWarpmcpDeps, args: { threadId: string }) {
	if (!deps.listSubthreads) {
		throw "[warpmcp] listSubthreads function not found";
	}
	return deps.listSubthreads(args.threadId);
}
