import { useAuiState } from "@assistant-ui/react";
import { Box, Text } from "@chakra-ui/react";
import { Ban } from "lucide-react";
import React from "react";
import { useStore } from "@/store";
import type { TUiSpaceComponentDef } from "@/store/slices/uiSpaces";

export const ModeToolViolationIndicator = React.memo(
	({ def, children }: { def: TUiSpaceComponentDef; children: React.ReactNode }) => {
		const messageId = useAuiState((s) => s.message.id);
		const blockedToolName = useStore((s) => s.messageStates[messageId]?.blockedToolName) as
			| string
			| undefined;

		if (!blockedToolName) return children;

		return (
			<>
				{children}
				<Box
					display="flex"
					alignItems="center"
					gap="2"
					mt="2"
					px="2"
					py="1"
					mx="4"
					borderRadius="md"
					bg="var(--wc-bg-surface-2)"
					borderLeftWidth="3px"
					borderColor="var(--wc-accent-red)"
				>
					<Ban size={14} color="var(--wc-accent-red)" />
					<Text fontSize="xs" color="var(--wc-accent-red)" fontWeight="500">
						Tool call to &quot;{blockedToolName}&quot; was blocked by mode restrictions
					</Text>
				</Box>
			</>
		);
	},
);
