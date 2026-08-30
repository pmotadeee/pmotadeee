import { Text } from "@chakra-ui/react";

export const PathDisplay = ({ dir, file }: { dir: string; file: string }) => (
	<>
		{dir && (
			<Text
				as="span"
				color="var(--wc-text-muted)"
				overflow="hidden"
				textOverflow="ellipsis"
				maxW="150px"
				whiteSpace="nowrap"
			>
				{dir}
			</Text>
		)}
		<Text as="span" color="var(--wc-text-primary)" fontWeight="bold" flexShrink={0}>
			{file}
		</Text>
	</>
);
