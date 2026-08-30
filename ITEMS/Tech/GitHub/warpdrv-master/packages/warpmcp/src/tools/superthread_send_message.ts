import type { IWarpmcpDeps } from "../types";

export const superthreadSendMessageDefinition = {
	name: "superthread_send_message",
	description:
		"Send a message to the superthread (parent thread). If a parent tool is actively waiting for this response, delivers it directly to that tool. " +
		"Also creates a notification in the parent thread for UI visibility.",
	inputSchema: {
		type: "object",
		properties: {
			message: {
				type: "string",
				description: "The message content to send.",
			},
		},
		required: ["message"],
	},
	resultLimit: 40960,
};

export async function superthreadSendMessageHandler(
	deps: IWarpmcpDeps,
	args: { threadId: string; message: string },
): Promise<{ ok: boolean; message: string }> {
	if (!deps.sendToSuperthread) {
		throw "[warpmcp] sendToSuperthread function not found";
	}
	await deps.sendToSuperthread(args.threadId, args.message);
	return { ok: true, message: "Message sent." };
}
