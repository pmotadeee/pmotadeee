import type { IToolAttachment } from "./types";

export enum EGuardrailIssueType {
	VIOLATION = "violation",
	WARNING = "warning",
}

export interface IGuardrailIssue {
	quote: string;
	issue: string;
	type: EGuardrailIssueType;
	toolCallId?: string;
}

export interface IGuardrailDefinition {
	id: string;
	name: string;
	serverId: string;
	promptId?: string;
	prompt?: string;
	triggerOnTools?: IToolAttachment[];
	inferenceParams?: Record<string, unknown>;
	messagesCount?: number;
	includeBaseMessage?: boolean;
}

export interface IGuardrailCreatePayload {
	id?: string;
	name: string;
	serverId: string;
	promptId?: string;
	prompt?: string;
	triggerOnTools?: IToolAttachment[];
	inferenceParams?: Record<string, unknown>;
	messagesCount?: number;
	includeBaseMessage?: boolean;
}

export interface IGuardrailError {
	message: string;
	rawResponse?: string;
}
