import type { IToolAttachment } from "./types";

export type TModeId = string;

export interface IMode {
	id: TModeId;
	name: string;
	scope: "global" | string;
	color: string;
	promptId?: string;
	prompt?: string;
	allowedTools: IToolAttachment[];
	allowedAgents: string[];
	activeGuardrails: string[];
}

export interface IModeCreatePayload {
	name: string;
	scope: "global" | string;
	color: string;
	promptId?: string;
	prompt?: string;
	allowedTools: IToolAttachment[];
	allowedAgents?: string[];
	activeGuardrails?: string[];
}
