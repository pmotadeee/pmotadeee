import { Box } from "@chakra-ui/react";
import { Bot } from "lucide-react";
import React, { memo, useCallback } from "react";
import { useStore } from "@/store";

export const MonitorButton = memo(() => {
	const monitorBoxOpen = useStore((s) => s.monitorBoxOpen);
	const setMonitorBoxOpen = useStore((s) => s.setMonitorBoxOpen);

	const handleToggle = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setMonitorBoxOpen(!monitorBoxOpen);
		},
		[monitorBoxOpen, setMonitorBoxOpen],
	);

	return (
		<Box
			display="inline-flex"
			alignItems="center"
			gap="1.5"
			px="2"
			py="2.5"
			fontSize={12}
			color="var(--wc-text-secondary)"
			fontFamily={"mono"}
			borderRadius="md"
			cursor="pointer"
			userSelect="none"
			transition="all 0.15s ease"
			bg={monitorBoxOpen ? "var(--wc-bg-selected)" : "transparent	"}
			borderWidth="1px"
			borderColor={
				monitorBoxOpen
					? "var(--wc-accent-purple-border, rgba(167,139,250,0.25))"
					: "var(--wc-border-subtle)"
			}
			_hover={{ bg: monitorBoxOpen ? undefined : "var(--wc-bg-hover)" }}
			onClick={handleToggle}
		>
			<Bot
				size={16}
				color={monitorBoxOpen ? "var(--wc-text-primary)" : "var(--wc-text-faint)"}
			/>
		</Box>
	);
});
