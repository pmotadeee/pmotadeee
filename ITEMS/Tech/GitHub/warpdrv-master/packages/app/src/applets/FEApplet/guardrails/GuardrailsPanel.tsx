import { Box, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { WithErrorBoundary } from "@/components/WithErrorBoundary";
import { useStore } from "@/store";

import { GuardrailRow } from "./GuardrailRow";
import { EMPTY_GUARDRAILS } from "../constants";

export const GuardrailsPanel = React.memo(() => {
	const guardrails = useStore((s) => s.guardrails) || EMPTY_GUARDRAILS;
	const items = Object.values(guardrails);

	if (!items.length) {
		return (
			<Box p="4">
				<Text fontSize="xs" color="var(--wc-text-muted)" textAlign="center">
					No guardrails
				</Text>
			</Box>
		);
	}

	return (
		<WithErrorBoundary name="GuardrailsPanel">
			<VStack gap="2" p="3" align="stretch">
				{items.map((g) => (
					<GuardrailRow key={g.name} guardrail={g} />
				))}
			</VStack>
		</WithErrorBoundary>
	);
});
