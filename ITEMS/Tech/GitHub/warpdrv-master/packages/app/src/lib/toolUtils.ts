import type { IMode, IToolAttachment } from "@warpcore/shared";

export function computeModeUnionTools(
	modes: Record<string, IMode>,
	isModeActive: boolean,
): IToolAttachment[] | null {
	if (!isModeActive) return null;
	const result: IToolAttachment[] = [];
	const seen = new Set<string>();
	for (const m of Object.values(modes)) {
		for (const t of m.allowedTools) {
			if (typeof t === "string") continue;
			const key = `${t.serverName}:${t.toolName}`;
			if (!seen.has(key)) {
				seen.add(key);
				result.push(t);
			}
		}
	}
	return result;
}
