import { Box } from "@chakra-ui/react";
import React from "react";
import { UiSpaceWrapper } from "@/applets/ui/UiSpaceWrapper";
import { useStore } from "@/store";
import { EUISpaceLoc } from "@/store/slices/uiSpaces";

export const ChatTodosContentPanel = React.memo(() => {
	const componentIds = useStore((s) => s.uiSpaceComponentsByLocation[EUISpaceLoc.TODOS_PANEL]);
	const entriesById = useStore((s) => s.uiSpaceComponentsById);

	return (
		<Box
			overflowY="auto"
			css={{
				"&::-webkit-scrollbar": { width: "4px" },
				"&::-webkit-scrollbar-thumb": {
					background: "var(--wc-text-disabled)",
					borderRadius: "2px",
				},
			}}
		>
			{(componentIds ? Object.keys(componentIds) : []).map((id) => {
				const entry = entriesById[id];
				if (!entry) return null;
				return <UiSpaceWrapper key={id} componentId={id} />;
			})}
		</Box>
	);
});
