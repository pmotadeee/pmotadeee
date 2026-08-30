import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { IGuardrailIssue } from "@warpcore/shared";
import { EGuardrailIssueType } from "@warpcore/shared";
import { AlertTriangle, XCircle } from "lucide-react";
import React from "react";
import { TbMessage2Plus } from "react-icons/tb";
import { useStore } from "@/store";

export const GuardrailIssueItem = React.memo(
	({ guardrailName, item }: { guardrailName: string; item: IGuardrailIssue }) => {
		const addAnnotation = useStore((s) => s.addAnnotation);
		const isViolation = item.type === EGuardrailIssueType.VIOLATION;

		return (
			<Box
				p="2"
				borderRadius="md"
				bg="var(--wc-bg-subtle)"
				borderWidth="1px"
				borderColor={
					isViolation ? "var(--wc-accent-red-border)" : "var(--wc-accent-yellow-border)"
				}
			>
				<Flex justifyContent="space-between" align="flex-start" mb={"0.5"}>
					<HStack gap="2" flex="1" minW="0" align={"flex-start"}>
						{isViolation ? (
							<XCircle
								size={18}
								color="var(--wc-accent-red)"
								style={{ marginTop: "3px" }}
							/>
						) : (
							<AlertTriangle
								size={18}
								color="var(--wc-accent-yellow)"
								style={{ marginTop: "3px" }}
							/>
						)}
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
						<Text fontSize="md" color="var(--wc-text-primary)" textOverflow="ellipsis">
							{item.issue}
						</Text>
					</HStack>
					<Box
						as="button"
						onClick={() => addAnnotation(item.quote, item.issue)}
						title="Add to annotations"
						flexShrink={0}
						ml="2"
						p="1"
						borderRadius="4px"
						border="none"
						bg="transparent"
						cursor="pointer"
						color="var(--wc-text-muted)"
						_hover={{ bg: "var(--wc-bg-subtle)", color: "var(--wc-text-primary)" }}
					>
						<TbMessage2Plus size={18} />
					</Box>
				</Flex>
				<Text
					color="var(--wc-text-muted)"
					fontFamily="mono"
					fontStyle="italic"
					textOverflow="ellipsis"
					overflow="hidden"
					pl="6"
				>
					{item.quote}
				</Text>
			</Box>
		);
	},
);
