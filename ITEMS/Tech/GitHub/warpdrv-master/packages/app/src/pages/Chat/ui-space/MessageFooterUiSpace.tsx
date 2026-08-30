import React, { useMemo } from "react";
import { WithErrorBoundary } from "@/components/WithErrorBoundary";
import { useStore } from "@/store";
import { EUISpaceLoc, type TUiSpaceComponentDef } from "@/store/slices/uiSpaces";

const EMPTY: Array<TUiSpaceComponentDef> = [];

export const MessageFooterUiSpace = React.memo(() => {
	const componentIds = useStore((s) => s.uiSpaceComponentsByLocation[EUISpaceLoc.MESSAGE_FOOTER]);
	const entriesById = useStore((s) => s.uiSpaceComponentsById);

	const components = useMemo(() => {
		if (!componentIds || !Object.keys(componentIds).length) return EMPTY;
		return Object.keys(componentIds)
			.map((id) => entriesById[id])
			.filter((entry) => !!entry);
	}, [componentIds, entriesById]);

	if (!components.length) return null;

	return (
		<>
			{components.map((C) => (
				<WithErrorBoundary key={C.componentId} fallback={null}>
					<C.component def={C} {...(C.props || {})} />
				</WithErrorBoundary>
			))}
		</>
	);
});
