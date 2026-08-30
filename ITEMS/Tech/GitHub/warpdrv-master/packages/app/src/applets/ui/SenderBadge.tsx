import { Box } from "@chakra-ui/react";
import { Bot } from "lucide-react";
import React, { useMemo } from "react";
import { useAuiState } from "@assistant-ui/react";
import { useStore } from "@/store";
import { EThreadHierarchyType, type IThreadSenderInfo } from "@warpcore/shared";
import type { TUiSpaceComponentDef } from "@/store/slices/uiSpaces";

export const SenderBadge = React.memo(
	({ def, children }: { def: TUiSpaceComponentDef; children: React.ReactNode }) => {
		const messageId = useAuiState((s) => s.message.id);
		const role = useAuiState((s) => s.message.role);
		const sender = useStore(
			(s) => s.messageStates[messageId]?.sender as IThreadSenderInfo | undefined,
		);

		const label = useMemo(() => {
			if (!sender) return "";
			if (sender.type === EThreadHierarchyType.SUPERTHREAD) return "From super agent";
			const name = sender.agent?.name ?? "agent";
			return sender.title ? `From ${name} — ${sender.title}` : `From ${name}`;
		}, [sender]);

		// Only style user-role messages that carry a sender.
		if (role !== "user" || !sender) return children;

		return (
			<Box w="100%" display="flex" flexDirection="column" alignItems="flex-end" gap="1">
				<Box
					alignSelf="flex-end"
					display="flex"
					alignItems="center"
					gap="1.5"
					px="2"
					py="0.5"
					fontSize="sm"
					fontWeight="600"
					color="var(--wc-text-secondary)"
					bg="var(--wc-bg-elevated)"
					borderRadius="md"
					borderWidth="1px"
					borderColor="var(--wc-border-default)"
				>
					<Bot size={16} color="var(--wc-text-muted)" />
					{label}
				</Box>
				{children}
			</Box>
		);
	},
);
