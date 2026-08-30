import type { IGuardrailCreatePayload, IGuardrailDefinition } from "@warpcore/shared";
import { api } from "./client";

export async function listGuardrails(): Promise<Record<string, IGuardrailDefinition>> {
	const res = await api.get<Record<string, IGuardrailDefinition>>("/guardrails");
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function createGuardrail(
	payload: IGuardrailCreatePayload,
): Promise<IGuardrailDefinition> {
	const res = await api.post<IGuardrailDefinition>("/guardrails", payload);
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function updateGuardrail(
	id: string,
	payload: Partial<IGuardrailDefinition>,
): Promise<IGuardrailDefinition> {
	const res = await api.put<IGuardrailDefinition>(
		`/guardrails/${encodeURIComponent(id)}`,
		payload,
	);
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function deleteGuardrail(id: string): Promise<void> {
	const res = await api.del<null>(`/guardrails/${encodeURIComponent(id)}`);
	if (!res.ok) throw new Error(res.error);
}
