import { ColorPicker, Portal, parseColor } from "@chakra-ui/react";

type SlashCmdColorPickerProps = {
	value: string;
	placeholder: string;
	inputRef: (el: HTMLButtonElement | null) => void;
	onChange: (next: string) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	onFocus: () => void;
	onBlur: (e: React.FocusEvent) => void;
};

export const SlashCmdColorPicker: React.FC<SlashCmdColorPickerProps> = ({
	value,
	inputRef,
	onChange,
	onFocus,
	onBlur,
}) => {
	const color = value || "#a78bfa";

	return (
		<ColorPicker.Root
			defaultValue={parseColor(color)}
			positioning={{ placement: "bottom-start" }}
			onValueChange={(details) => {
				onChange(details.value.toString("hex"));
			}}
			onOpenChange={(details) => {
				details.open ? onFocus() : onBlur({} as React.FocusEvent);
			}}
		>
			<ColorPicker.HiddenInput />
			<ColorPicker.Control>
				<ColorPicker.Trigger ref={inputRef}>
					<ColorPicker.ValueSwatch />
					<ColorPicker.ValueText />
				</ColorPicker.Trigger>
			</ColorPicker.Control>
			<Portal>
				<ColorPicker.Positioner>
					<ColorPicker.Content css={{ zIndex: 10002 }}>
						<ColorPicker.Area />
						<ColorPicker.Sliders />
					</ColorPicker.Content>
				</ColorPicker.Positioner>
			</Portal>
		</ColorPicker.Root>
	);
};
