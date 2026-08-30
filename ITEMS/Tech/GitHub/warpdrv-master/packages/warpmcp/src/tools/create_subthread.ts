import type { IWarpmcpDeps } from "../types";

export const createSubthreadDefinition = {
	name: "create_subthread",
	description:
		"Create a subthread (child thread) under the current thread using the specified agent's configuration. " +
		"Posts the initial message and waits for the subthread to respond via superthread_send_message. " +
		"Returns the subthread's response. If the user backgrounds the task, returns immediately with the thread ID.",
	inputSchema: {
		type: "object",
		properties: {
			agentName: {
				type: "string",
				description: "The name of the agent whose config to use for the subthread.",
			},
			title: {
				type: "string",
				description: "Title for the new subthread.",
			},
			message: {
				type: "string",
				description: "The initial user message to seed the subthread with.",
			},
			background: {
				type: "boolean",
				description:
					"If true, do not wait for the subthread's response; return immediately with the thread ID. " +
					"The response will arrive later as a notification.",
			},
		},
		required: ["agentName", "title", "message"],
	},
	resultLimit: 40960,
};

export async function createSubthreadHandler(
	deps: IWarpmcpDeps,
	args: {
		threadId: string;
		agentName: string;
		title: string;
		message: string;
		background?: boolean;
	},
) {
	if (!deps.createSubthread) {
		throw "[warpmcp] createSubthread function not found";
	}
	return deps.createSubthread(
		args.threadId,
		args.agentName,
		args.message,
		args.title,
		args.background,
	);
}
