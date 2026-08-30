import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { IGuardrailError, IGuardrailIssue } from "@warpcore/shared";
import { XCircle } from "lucide-react";
import React from "react";

export const TGuardrailIssueEntry = { guardrailName: "", issue: {} as IGuardrailIssue };
export type TGuardrailIssueEntry = typeof TGuardrailIssueEntry;

export const GuardrailErrorItem = React.memo(
	({ guardrailName, error }: { guardrailName: string; error: IGuardrailError }) => {
		return (
			<Box
				p="2"
				borderRadius="md"
				bg="var(--wc-bg-subtle)"
				borderWidth="1px"
				borderColor="var(--wc-accent-red-border)"
			>
				<Flex justifyContent="space-between" align="flex-start" mb="0.5">
					<HStack gap="2" flex="1" minW="0" align="flex-start">
						<XCircle
							size={18}
							color="var(--wc-accent-red)"
							style={{ marginTop: "3px" }}
						/>
						<Badge
							px="1.5"
							py="0.5"
							mt="0.5"
							fontSize="sm"
							color="var(--wc-text-secondary)"
							bg="var(--wc-bg-active)"
						>
							{guardrailName}
						</Badge>
						<Text fontSize="md" color="var(--wc-accent-red)">
							Parse Error
						</Text>
					</HStack>
				</Flex>
				<Text color="var(--wc-text-muted)" fontFamily="mono" fontSize="xs" pl="6" mb="1">
					{error.message}
				</Text>
				{error.rawResponse && (
					<Text
						color="var(--wc-text-faint)"
						fontFamily="mono"
						fontSize="xs"
						pl="6"
						overflow="hidden"
						textOverflow="ellipsis"
						whiteSpace="nowrap"
					>
						Raw: {error.rawResponse.substring(0, 200)}
						{error.rawResponse.length > 200 ? "..." : ""}
					</Text>
				)}
			</Box>
		);
	},
);
