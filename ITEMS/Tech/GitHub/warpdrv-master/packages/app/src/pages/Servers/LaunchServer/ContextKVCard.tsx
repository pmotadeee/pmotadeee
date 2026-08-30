import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { EKvQuantType, type ILaunchParams } from "@warpcore/shared";
import React from "react";
import { Card } from "@/components/Card";
import { NumberField, OptionalNumberField, SelectField, SliderNumberField } from "./Helpers";

const KV_QUANT_OPTIONS = Object.values(EKvQuantType);

export const ContextKVCard = React.memo(
	({
		params,
		onParamChange,
		meta,
	}: {
		params: ILaunchParams;
		onParamChange: (
			key: keyof ILaunchParams,
			value: ILaunchParams[keyof ILaunchParams],
		) => void;
		meta: { nLayers: number; contextLength: number } | null;
	}) => {
		const maxContext = meta?.contextLength ?? 131072;
		const hasModelContext = !!meta;

		return (
			<Card>
				<VStack align="stretch" gap="4">
					{hasModelContext ? (
						<SliderNumberField
							label="Context Size"
							value={params.contextSize}
							onChange={(v) => onParamChange("contextSize", v)}
							min={0}
							max={maxContext}
							suffix={
								params.contextSize === 0
									? "0 = auto"
									: `/ ${(maxContext / 1024).toFixed(0)}k max`
							}
							logarithmic
						/>
					) : (
						<NumberField
							label="Context Size"
							value={params.contextSize}
							onChange={(v) => onParamChange("contextSize", v)}
							min={0}
							step={1024}
							suffix="0 = auto"
						/>
					)}
					<Text
						fontSize="11px"
						color="var(--wc-text-tertiary)"
						textTransform="uppercase"
						letterSpacing="0.05em"
					>
						KV Cache Quantization
					</Text>
					<Flex gap="4">
						<SelectField
							label="K Type"
							value={params.kvQuantK}
							options={KV_QUANT_OPTIONS}
							onChange={(v) => onParamChange("kvQuantK", v)}
							mono
						/>
						<SelectField
							label="V Type"
							value={params.kvQuantV}
							options={KV_QUANT_OPTIONS}
							onChange={(v) => onParamChange("kvQuantV", v)}
							mono
						/>
					</Flex>
					<NumberField
						label="Parallel Slots"
						value={params.parallelSlots}
						onChange={(v) => onParamChange("parallelSlots", v)}
						min={0}
						suffix="0 = server default"
					/>
					<Box borderTopWidth="1px" borderColor="var(--wc-border-subtle)" pt="5" mt="2">
						<Text
							fontSize="11px"
							color="var(--wc-text-tertiary)"
							textTransform="uppercase"
							letterSpacing="0.05em"
							mb="1.5"
						>
							Advanced Cache
						</Text>
						<VStack align="stretch" gap="4">
							<Flex gap="4">
								<OptionalNumberField
									label="Cache RAM"
									value={params.cacheRam}
									onChange={(v) => onParamChange("cacheRam", v)}
									min={-1}
									step={1024}
									suffixFn={(v) =>
										v === undefined
											? "auto"
											: v === -1
												? "unlimited"
												: v === 0
													? "disabled"
													: "MiB"
									}
								/>
								<OptionalNumberField
									label="Ctx Checkpoints"
									value={params.ctxCheckpoints}
									onChange={(v) => onParamChange("ctxCheckpoints", v)}
									min={0}
									step={4}
									suffix={
										params.ctxCheckpoints === undefined
											? "auto"
											: "per-slot cap"
									}
								/>
							</Flex>
							<OptionalNumberField
								label="Slot Prompt Similarity"
								value={params.slotPromptSimilarity}
								onChange={(v) => onParamChange("slotPromptSimilarity", v)}
								min={0}
								max={1}
								step={0.05}
								suffixFn={(v) =>
									v === undefined ? "auto" : v === 0 ? "disabled" : "0-1 range"
								}
							/>
						</VStack>
					</Box>
				</VStack>
			</Card>
		);
	},
);
