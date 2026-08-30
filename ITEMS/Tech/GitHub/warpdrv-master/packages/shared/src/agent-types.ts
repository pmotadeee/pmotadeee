import type { IToolAttachment } from "./types";
import type { EReasoningEffort } from "./enums";

export type TAgentId = string;

export interface IAgent {
	id: TAgentId;
	name: string;
	serverId: string;
	promptId?: string;
	tools: IToolAttachment[];
	autoApproveTools: IToolAttachment[];
	description: string;
	reasoningEffort?: EReasoningEffort;
	guardrails: string[];
	createdAt: number;
	updatedAt: number;
}

export interface IAgentCreatePayload {
	name: string;
	serverId: string;
	promptId?: string;
	tools?: IToolAttachment[];
	autoApproveTools?: IToolAttachment[];
	description?: string;
	reasoningEffort?: EReasoningEffort;
	guardrails?: string[];
}
