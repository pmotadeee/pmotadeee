import { useAuiState } from "@assistant-ui/react";
import { Box, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useStore } from "@/store";
import type { TUiSpaceComponentDef } from "@/store/slices/uiSpaces";

export const ModeChangeIndicator = React.memo(
	({ def, children }: { def: TUiSpaceComponentDef; children: React.ReactNode }) => {
		const messageId = useAuiState((s) => s.message.id);
		const role = useAuiState((s) => s.message.role);
		const currentThreadId = useStore((s) => s.currentThreadId);
		const currentModeMarker = useStore((s) => s.messageStates[messageId]?.modeMarker) as
			| { id: string; name: string }
			| undefined;
		const currentMode = useStore((s) => {
			const m = s.messageStates[messageId]?.modeMarker as { id: string } | undefined;
			return m ? s.modes[m.id] : undefined;
		});

		const prevUserMsgId = useMemo(() => {
			if (!currentModeMarker) return null;
			const st = useStore.getState();
			const threadMsgs = st.messagesByThread?.[currentThreadId];
			if (!threadMsgs) return null;

			let curr = threadMsgs[messageId]?.parentId;
			while (curr) {
				const msg = threadMsgs[curr];
				if (!msg) break;
				if (msg.role === "user" && curr !== messageId) {
					return curr;
				}
				curr = msg.parentId ?? null;
			}
			return null;
		}, [messageId, currentModeMarker]);

		const prevModeMarker = useStore((s) =>
			prevUserMsgId
				? (s.messageStates[prevUserMsgId]?.modeMarker as { id: string } | undefined)
				: undefined,
		);

		const modeChangeInfo = useMemo(() => {
			if (!currentModeMarker) return null;
			if (!prevUserMsgId) return null;
			if (!prevModeMarker) return null;
			if (currentModeMarker.id !== prevModeMarker.id) {
				return {
					modeName: currentModeMarker.name,
					modeColor: currentMode?.color || "#ffffff",
				};
			}
			return null;
		}, [messageId, currentModeMarker, currentMode, prevModeMarker]);

		if (role !== "user" || !modeChangeInfo) return children;

		return (
			<>
				<Box display="flex" alignItems="center" gap="2" mb="2">
					<Box flex="1" borderTopWidth="2px" borderColor={modeChangeInfo.modeColor} />
					<Text
						fontSize="sm"
						fontWeight="600"
						color={modeChangeInfo.modeColor}
						letterSpacing="0.1em"
						textTransform={"uppercase"}
					>
						{modeChangeInfo.modeName}
					</Text>
					<Box flex="1" borderTopWidth="2px" borderColor={modeChangeInfo.modeColor} />
				</Box>
				{children}
			</>
		);
	},
);
