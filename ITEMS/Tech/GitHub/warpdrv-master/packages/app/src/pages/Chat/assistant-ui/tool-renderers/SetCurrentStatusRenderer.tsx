import { Box, HStack, Text } from "@chakra-ui/react";
import { Activity } from "lucide-react";
import React, { useMemo } from "react";
import type { IToolCallRenderer, TCanRenderResult } from "@/store/types";

const TRUNCATE_AT = 80;

function truncate(s: string, n: number): string {
	return s.length > n ? s.slice(0, n) + "…" : s;
}

export const SetCurrentStatusRenderer = React.memo(({ status }: { status?: string }) => {
	return (
		<Box px="3" py="2">
			<HStack gap="2" align="center">
				<Activity size={12} color="var(--wc-text-secondary)" />
				<Text fontWeight="600" color="var(--wc-text-tertiary)">
					Status
				</Text>
				<Text color="var(--wc-text-primary)" wordBreak="break-word">
					{status}
				</Text>
			</HStack>
		</Box>
	);
});

export const SetCurrentStatusRendererMeta: IToolCallRenderer = {
	component: SetCurrentStatusRenderer,
	keywords: ["set_current_status"],
	canRender: (args: Record<string, unknown>): TCanRenderResult => {
		if (typeof args.status !== "string") return false;
		return { status: args.status };
	},
	renderMini: React.memo(({ args }) => {
		const label = useMemo(() => {
			const status = String(args?.status ?? "");
			return truncate(status, TRUNCATE_AT);
		}, [args]);
		return (
			<Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
				<Text as="span" color="var(--wc-text-primary)">
					Status
				</Text>
				<Text as="span" color="var(--wc-text-tertiary)">
					{" "}
					{label}
				</Text>
			</Text>
		);
	}),
};
