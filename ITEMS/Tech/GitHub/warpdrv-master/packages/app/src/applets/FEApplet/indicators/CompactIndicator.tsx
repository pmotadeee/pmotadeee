import { useAuiState } from "@assistant-ui/react";
import { Box, Text } from "@chakra-ui/react";
import React from "react";
import type { IExtractedSlashCommand } from "@/pages/Chat/assistant-ui/docToString";
import { useStore } from "@/store";
import type { TUiSpaceComponentDef } from "@/store/slices/uiSpaces";

export const CompactIndicator = React.memo(
	({ def, children }: { def: TUiSpaceComponentDef; children: React.ReactNode }) => {
		const messageId = useAuiState((s) => s.message.id);
		const slashCommands = useStore((s) => s.messageStates[messageId]?.slashCommands);
		const hasCompact = (slashCommands as Array<IExtractedSlashCommand> | undefined)?.some(
			(cmd) => cmd.name === "compact",
		);

		if (!hasCompact) return children;
		return (
			<>
				{children}
				<Box display="flex" alignItems="center" gap="2" mt="2">
					<Box flex="1" borderTopWidth="2px" borderColor="var(--wc-accent-yellow-glow)" />
					<Text
						fontSize="sm"
						fontWeight="600"
						color="var(--wc-accent-yellow-glow)"
						letterSpacing="0.1em"
					>
						COMPACTION
					</Text>
					<Box flex="1" borderTopWidth="2px" borderColor="var(--wc-accent-yellow-glow)" />
				</Box>
			</>
		);
	},
);
