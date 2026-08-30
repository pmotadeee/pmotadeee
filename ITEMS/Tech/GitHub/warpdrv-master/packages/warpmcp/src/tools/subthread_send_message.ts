import type { IWarpmcpDeps } from "../types";

export const subthreadSendMessageDefinition = {
	name: "subthread_send_message",
	description:
		"Send a message to a subthread (child thread). Posts the message and waits for the subthread to respond via superthread_send_message. " +
		"Returns the subthread's response. If the user backgrounds the task, returns immediately with the thread ID.",
	inputSchema: {
		type: "object",
		properties: {
			subThreadId: {
				type: "string",
				description: "The ID of the subthread to send the message to.",
			},
			message: {
				type: "string",
				description: "The message content to send.",
			},
			background: {
				type: "boolean",
				description:
					"If true, do not wait for the subthread's response; return immediately with the thread ID. " +
					"The response will arrive later as a notification.",
			},
		},
		required: ["subThreadId", "message"],
	},
	resultLimit: 40960,
};

export async function subthreadSendMessageHandler(
	deps: IWarpmcpDeps,
	args: { parentThreadId: string; subThreadId: string; message: string; background?: boolean },
) {
	if (!deps.sendToSubthread) {
		throw "[warpmcp] sendToSubthread function not found";
	}
	return deps.sendToSubthread(
		args.parentThreadId,
		args.subThreadId,
		args.message,
		args.background,
	);
}
