import { useCallback, useMemo } from "react";
import { updateThread } from "@/api/services";
import { useStore } from "../store";

export function useThreadAutoEmbed() {
	const currentThreadId = useStore((s) => s.currentThreadId);
	const thread = useStore((s) => (s.currentThreadId ? s.threads[s.currentThreadId] : undefined));
	const tempAutoEmbed = useStore((s) => s.tempAutoEmbed);
	const setTempAutoEmbed = useStore((s) => s.setTempAutoEmbed);

	const enableAutoEmbed = useMemo(() => {
		if (thread?.meta) {
			try {
				return !!JSON.parse(thread.meta).enableAutoEmbed;
			} catch {
				/* ignore */
			}
		}
		return tempAutoEmbed;
	}, [thread?.meta, tempAutoEmbed]);

	const setEnableAutoEmbed = useCallback(
		async (enabled: boolean) => {
			if (!thread) {
				setTempAutoEmbed(enabled);
				return;
			}
			await updateThread(currentThreadId!, { enableAutoEmbed: enabled });
		},
		[thread, currentThreadId, setTempAutoEmbed],
	);

	return { enableAutoEmbed, setEnableAutoEmbed };
}
