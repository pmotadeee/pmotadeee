import { Tabs } from "@chakra-ui/react";
import type { IMode, TModeId } from "@warpcore/shared";
import { memo, useCallback } from "react";
import { TiFlowSwitch } from "react-icons/ti";
import { useStore } from "@/store";

const EMPTY_MODES: Record<TModeId, IMode> = {};

const hexToRgba = (hex: string): string => {
	const cleaned = hex.replace("#", "");
	const r = parseInt(cleaned.slice(0, 2), 16);
	const g = parseInt(cleaned.slice(2, 4), 16);
	const b = parseInt(cleaned.slice(4, 6), 16);
	return `rgba(${r},${g},${b},`;
};

const baseTriggerStyle = {
	display: "flex",
	alignItems: "center",
	gap: "6px",
	px: "8px",
	borderRadius: "md",
	fontSize: "xs",
	fontWeight: "500",
	cursor: "pointer",
	transition: "all 0.15s ease",
	border: "none",
	background: "transparent",
};

export const ModeTabs = memo(() => {
	const modes = useStore((s) => s.modes) ?? EMPTY_MODES;
	const currentThreadId = useStore((s) => s.currentThreadId);
	const threads = useStore((s) => s.threads);
	const threadState = useStore((s) => s.getCurrentThreadState(s));
	const setThreadState = useStore((s) => s.setThreadState);
	const modeId = threadState?.modeId as TModeId | undefined;

	const folderId = currentThreadId ? threads[currentThreadId]?.folderId : null;
	const scope = folderId || "global";

	const availableModes = Object.values(modes).filter(
		(m: IMode) => m.scope === "global" || m.scope === scope,
	);

	const handleValueChange = useCallback(
		(details: { value: string }) => {
			const newModeId = details.value === "default" ? null : (details.value as TModeId);
			setThreadState(currentThreadId, { modeId: newModeId });
		},
		[currentThreadId, setThreadState],
	);

	return (
		<Tabs.Root value={modeId ?? "default"} onValueChange={handleValueChange} variant="plain">
			<Tabs.List css={{ padding: 0, margin: 0, gap: "4px" }}>
				<Tabs.Trigger
					value="default"
					css={{
						...baseTriggerStyle,
						color: !modeId ? "var(--wc-text-primary)" : "var(--wc-text-muted)",
						bg: !modeId ? "var(--wc-bg-subtle)" : "transparent",
					}}
				>
					<TiFlowSwitch
						size={14}
						color={!modeId ? "var(--wc-text-primary)" : "var(--wc-text-muted)"}
					/>
					Default
				</Tabs.Trigger>

				{availableModes.map((m: IMode) => {
					const isSelected = modeId === m.id;
					const mc = m.color || "#a78bfa";
					const mcRgba = hexToRgba(mc);
					return (
						<Tabs.Trigger
							key={m.id}
							value={m.id}
							css={{
								...baseTriggerStyle,
								color: isSelected ? mc : "var(--wc-text-muted)",
								bg: isSelected ? `${mcRgba}0.15)` : "transparent",
							}}
						>
							<TiFlowSwitch
								size={14}
								color={isSelected ? mc : "var(--wc-text-muted)"}
							/>
							{m.name}
						</Tabs.Trigger>
					);
				})}
			</Tabs.List>
		</Tabs.Root>
	);
});
