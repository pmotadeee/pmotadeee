import type { IAgent, IAgentCreatePayload } from "@warpcore/shared";
import { api } from "./client";

export async function listAgents(): Promise<IAgent[]> {
	const res = await api.get<IAgent[]>("/agents");
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function getAgent(id: string): Promise<IAgent> {
	const res = await api.get<IAgent>(`/agents/${encodeURIComponent(id)}`);
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function createAgent(payload: IAgentCreatePayload): Promise<IAgent> {
	const res = await api.post<IAgent>("/agents", payload);
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function updateAgent(id: string, payload: Partial<IAgent>): Promise<IAgent> {
	const res = await api.put<IAgent>(`/agents/${encodeURIComponent(id)}`, payload);
	if (!res.ok) throw new Error(res.error);
	return res.data!;
}

export async function deleteAgent(id: string): Promise<void> {
	const res = await api.del<null>(`/agents/${encodeURIComponent(id)}`);
	if (!res.ok) throw new Error(res.error);
}
