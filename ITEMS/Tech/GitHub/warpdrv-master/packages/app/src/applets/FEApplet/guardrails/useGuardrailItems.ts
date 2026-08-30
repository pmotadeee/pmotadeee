import { useMemo } from "react";
import type { TDropdownItem } from "@/pages/Chat/assistant-ui/slash-command/SlashCmdDropdown";
import { useStore } from "@/store";

import { EMPTY_GUARDRAILS } from "../constants";

export function useGuardrailItems(): TDropdownItem[] {
	const guardrails = useStore((s) => s.guardrails) || EMPTY_GUARDRAILS;
	return useMemo(
		() => Object.values(guardrails).map((g) => ({ label: g.name, value: g.id })),
		[guardrails],
	);
}
