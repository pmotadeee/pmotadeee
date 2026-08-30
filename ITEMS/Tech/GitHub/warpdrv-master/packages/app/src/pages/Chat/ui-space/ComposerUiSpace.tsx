import { Box } from "@chakra-ui/react";
import React from "react";
import { UiSpaceWrapper } from "@/applets/ui/UiSpaceWrapper";
import { useStore } from "@/store";
import { EUISpaceLoc } from "@/store/slices/uiSpaces";

export const ComposerUiSpace = React.memo(() => {
	const componentIds = useStore((s) => s.uiSpaceComponentsByLocation[EUISpaceLoc.COMPOSER]);
	const entriesById = useStore((s) => s.uiSpaceComponentsById);

	if (!componentIds || !Object.keys(componentIds).length) return null;

	const ids = Object.keys(componentIds);
	const leftIds = ids.filter((id) => {
		const entry = entriesById[id];
		return !entry || entry.align === "start";
	});
	const rightIds = ids.filter((id) => {
		const entry = entriesById[id];
		return entry?.align === "end";
	});

	return (
		<Box
			display="flex"
			flexDir="row"
			justifyContent="space-between"
			alignItems="center"
			w="calc(100% + var(--chakra-spacing-1\.5) * 2.5)"
			overflowX="auto"
			minWidth="0"
			// bg="linear-gradient(to bottom, color-mix(in srgb, transparent, var(--wc-fg-absolute) 3%), transparent)"
			color="var(--wc-fg-absolute)"
			borderRadius="10px 10px 0 0"
			//borderBottom="1px solid color-mix(in srgb, var(--wc-border-subtle) 35%, transparent)"
			mb="1"
			m="-2"
			p="1.5"
		>
			<Box display="flex" flexDir="row" gap="2" flexShrink={0}>
				{leftIds.map((id) => (
					<Box key={id}>
						<UiSpaceWrapper componentId={id} />
					</Box>
				))}
			</Box>
			<Box display="flex" flexDir="row" gap="2" flexShrink={0}>
				{rightIds.map((id) => (
					<Box key={id}>
						<UiSpaceWrapper componentId={id} />
					</Box>
				))}
			</Box>
		</Box>
	);
});
