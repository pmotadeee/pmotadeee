import type { IWarpmcpDeps } from "../types";

export const chatGetMessageDefinition = {
	name: "chat_get_message",
	description:
		"Retrieve the full content of a specific chat message by its ID. Use this after chat_search to get complete message content.",
	inputSchema: {
		type: "object",
		properties: {
			messageId: { type: "string", description: "The message ID to retrieve" },
		},
		required: ["messageId"],
	},
	resultLimit: 40960,
};

export async function chatGetMessageHandler(deps: IWarpmcpDeps, args: { messageId: string }) {
	if (!deps.chatGetMessage) {
		throw "[warpmcp] chatGetMessage function not found";
	}
	const result = await deps.chatGetMessage(args.messageId);
	if (!result) {
		throw `[warpmcp] Message not found: ${args.messageId}`;
	}
	return result;
}
