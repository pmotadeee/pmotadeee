import type { IMode } from "@warpcore/shared";
import { useMemo } from "react";
import type { TDropdownItem } from "@/pages/Chat/assistant-ui/slash-command/SlashCmdDropdown";
import { useStore } from "@/store";

export function useModeItems(): TDropdownItem[] {
	const modes = useStore((s) => s.modes);
	const currentThreadId = useStore((s) => s.currentThreadId);
	const threads = useStore((s) => s.threads);
	const folderId = currentThreadId ? threads[currentThreadId]?.folderId : null;
	return useMemo(() => {
		const scope = folderId || "global";
		return Object.values(modes)
			.filter((m: IMode) => m.scope === "global" || m.scope === scope)
			.map((m: IMode) => ({ label: m.name, value: m.id }));
	}, [modes, scope]);
}
