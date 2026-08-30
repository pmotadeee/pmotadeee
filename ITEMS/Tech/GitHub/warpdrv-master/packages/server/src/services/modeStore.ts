import type { IMode, TModeId } from "@warpcore/shared";
import { persistence } from "../index";

export async function listModes(): Promise<IMode[]> {
	const rows = await persistence.listModes();
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		scope: r.scope as "global" | string,
		color: r.color,
		promptId: r.promptId,
		prompt: r.prompt,
		allowedTools: r.allowedTools,
		allowedAgents: r.allowedAgents,
		activeGuardrails: r.activeGuardrails,
	}));
}

export async function listModesByScope(scope: string): Promise<IMode[]> {
	const all = await listModes();
	if (scope === "global") return all;
	return all.filter((m) => m.scope === scope || m.scope === "global");
}

export async function getMode(id: TModeId): Promise<IMode | null> {
	const row = await persistence.getMode(id);
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		scope: row.scope as "global" | string,
		color: row.color,
		promptId: row.promptId,
		prompt: row.prompt,
		allowedTools: row.allowedTools,
		allowedAgents: row.allowedAgents,
		activeGuardrails: row.activeGuardrails,
	};
}

export async function putMode(mode: IMode): Promise<void> {
	await persistence.upsertMode({
		id: mode.id,
		name: mode.name,
		scope: mode.scope,
		color: mode.color,
		promptId: mode.promptId,
		prompt: mode.prompt,
		allowedTools: mode.allowedTools,
		allowedAgents: mode.allowedAgents || [],
		activeGuardrails: mode.activeGuardrails || [],
	});
}

export async function deleteMode(id: TModeId): Promise<void> {
	await persistence.deleteMode(id);
}
