import type { IWarpmcpDeps } from "../types";

export const chatSearchDefinition = {
	name: "chat_search",
	description:
		"Search all chat messages across conversations. Returns message snippets with highlights. Results from the current thread are automatically excluded. Use pagination (page parameter) to retrieve more results.",
	inputSchema: {
		type: "object",
		properties: {
			query: { type: "string", description: "The search query text" },
			limit: {
				type: "number",
				default: 10,
				description: "Results per page (default: 10, max: 200)",
			},
			page: {
				type: "number",
				default: 1,
				description: "Page number for pagination (1-indexed, default: 1)",
			},
		},
		required: ["query"],
	},
	resultLimit: 40960,
};

export async function chatSearchHandler(
	deps: IWarpmcpDeps,
	args: { query: string; limit?: number; page?: number; threadId?: string },
) {
	if (!deps.chatSearch) {
		throw "[warpmcp] chatSearch function not found";
	}
	const limit = Math.min(args.limit ?? 10, 200);
	const page = args.page ?? 1;
	return deps.chatSearch(args.query, args.threadId, limit, page);
}
