import { Box, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useStore } from "@/store";

import { ModeRow } from "./ModeRow";

export const ModesPanel = React.memo(() => {
	const modes = useStore((s) => s.modes);
	const threads = useStore((s) => s.threads);
	const currentThreadId = useStore((s) => s.currentThreadId);

	const folderId = currentThreadId ? threads[currentThreadId]?.folderId : null;
	const scope = folderId || "global";

	const availableModes = useMemo(() => {
		return Object.values(modes).filter((m) => m.scope === "global" || m.scope === scope);
	}, [modes, scope]);

	if (!availableModes.length) {
		return (
			<Box p="4">
				<Text fontSize="xs" color="var(--wc-text-muted)" textAlign="center">
					No modes
				</Text>
			</Box>
		);
	}

	return (
		<VStack gap="2" p="3" align="stretch" height="100%">
			{availableModes.map((m) => (
				<ModeRow key={m.id} mode={m} />
			))}
		</VStack>
	);
});

/* ============================================================
 * Prompts Panel — list, edit, rename, delete user prompts
 * ============================================================ */
