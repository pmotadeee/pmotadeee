import type { SqlitePersistence } from "@warpcore/bridge/server";

export interface IChatSearchResult {
	messageId: string;
	snippet: string;
}

export interface IChatSearchResponse {
	results: IChatSearchResult[];
	page: number;
	limit: number;
	hasMore: boolean;
}

export interface IChatGetMessageResponse {
	messageId: string;
	role: string;
	content: string;
}

export class ChatSearchToolService {
	private persistence: SqlitePersistence;

	constructor(persistence: SqlitePersistence) {
		this.persistence = persistence;
	}

	async searchMessages(
		query: string,
		threadId: string,
		limit: number,
		page: number,
	): Promise<IChatSearchResponse> {
		const offset = (page - 1) * limit;
		const allResults = await this.persistence.searchMessages(query, {
			mode: "everywhere",
			limit,
			offset,
		});
		const filtered = allResults.filter((r) => r.type === "message" && r.threadId !== threadId);
		return {
			results: filtered.map((r) => ({ messageId: r.messageId, snippet: r.snippet })),
			page,
			limit,
			hasMore: allResults.length === limit,
		};
	}

	async getMessage(messageId: string): Promise<IChatGetMessageResponse | null> {
		const message = await this.persistence.getMessage(messageId);
		if (!message) return null;
		const textParts = message.content
			.filter((part: any) => part.type === "text" || part.type === "reasoning")
			.map((part: any) => part.text)
			.join("\n");
		return { messageId: message.id, role: message.role, content: textParts };
	}
}
