import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://warpdrv.ai",
	vite: {
		build: { cssTarget: "chrome110" },
	},
	integrations: [
		starlight({
			title: "warpdrv",
			favicon: "/favicon.ico",
			sidebar: [
				{ label: "Introduction", slug: "docs/introduction" },
				{
					label: "Initial setup",
					items: [
						{ label: "Installation", slug: "docs/guides/installation" },
						{ label: "Onboarding", slug: "docs/guides/onboarding" },
						{
							label: "Downloading & running your first AI model",
							slug: "docs/guides/first-model",
						},
						{
							label: "Improving your chat experience",
							slug: "docs/guides/chat-experience",
						},
					],
				},
				{
					label: "How-to guides",
					items: [
						{ label: "Set up voice and push to talk", slug: "docs/guides/voice" },
						{ label: "Use the model router", slug: "docs/guides/model-router" },
						{ label: "Switch to the latest LLAMA.cpp", slug: "docs/guides/backends" },
						{
							label: "Recipes — Compile llama.cpp for your system",
							slug: "docs/guides/compiling",
						},
						{ label: "Set up a workspace", slug: "docs/guides/workspace" },
						{ label: "Managing your prompts", slug: "docs/guides/prompts" },
						{ label: "Using MCP tools", slug: "docs/guides/tools" },
						{ label: "Workflow, Part 1 — Modes", slug: "docs/guides/modes" },
						{ label: "Workflow, Part 2 — Guardrails", slug: "docs/guides/guardrails" },
						{ label: "Workflow, Part 3 — Subagents", slug: "docs/guides/subagents" },
					],
				},
				{
					label: "Advanced guides",
					items: [
						{ label: "Compiling warpdrv for macOS", slug: "docs/guides/mac" },
						{ label: "Save & load KV cache checkpoints", slug: "docs/guides/kv-checkpoints" },
						{ label: "Setting up Secure External Access", slug: "docs/guides/security" },
					],
				},
				{ label: "FAQ", slug: "docs/faq" },
			],
		}),
	],
});
