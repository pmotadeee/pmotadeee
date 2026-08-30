---
title: Improving your chat experience
description: Quick ways to make warpdrv's chat feel like home — appearance, theme, voice, workspaces, and more.
---

Once you're chatting, a few small tweaks go a long way. Here are the quick wins, and where to find them.

## Chat appearance

On the **Chat** page, click the **`Aa`** button in the page header to open the **Chat Appearance** panel:

- **Font size** — slider to make text bigger or smaller.
- **Font family** — dropdown to switch the chat font.
- **Fixed width** — toggle to constrain the chat column to a comfortable reading width.

<!-- SCREENSHOT: The Chat Appearance popover open, showing the font size slider, font family dropdown, and the Fixed width toggle. -->

## Theme

In **Settings**, use the **Theme** dropdown to pick a dark or light theme — or any of the many color themes (Catppuccin, Dracula, GitHub, Gruvbox, Nord, Tokyo Night, and more).

<!-- SCREENSHOT: The Settings page with the Theme dropdown open, showing the list of available themes. -->

## Voice (TTS)

In **Settings**, use the voice selector to choose a Kokoro TTS voice. Full setup is covered in [Set up voice](/docs/guides/voice/).

## Organize chats into workspaces

We **highly recommend** grouping chats by category or topic into a **workspace**. A workspace lets you set a **default server**, common **default values**, and a **project description** — which is especially useful for an ongoing project or recurring topic. See [Set up a workspace](/docs/guides/workspace/).

## Annotate

Select any text in a chat to add a comment or **annotation**. You can also use **dictation** or **voice chat mode** to add an annotation — covered in [Set up voice](/docs/guides/voice/).

## Search your chats

Use the search in the **right sidebar** to find anything across your chats.

## Built-in features

Chat is augmented with several built-in features. They're covered in detail in:

- [Set up a workspace](/docs/guides/workspace/)
- [Workflow, Part 1 — Modes](/docs/guides/modes/)
- [Workflow, Part 2 — Guardrails](/docs/guides/guardrails/)
- [Using MCP tools](/docs/guides/tools/)

## Slash commands

Use **slash commands** in the chat input for quick in-chat actions.

## Reasoning effort

Control how much the model **reasons** before answering by adjusting the **reasoning effort** for a thread.

## Tune your model

Head to the **Models** page to see which parameters you can control per model, and apply a different configuration to each. Some models support **speculative decoding modes** — [read about it](#). You can also set a proper **context length**, **KV Unified** values, and other launch-server-dialog parameters to improve performance — see [Advanced launch options](/docs/guides/first-model/#advanced-launch-options).

## Access warpdrv in your browser

warpdrv runs a **web server** alongside the app. You can open the same interface in a browser by navigating to the server's address — `http://<host>:<port>`. It's the exact same UI you get in the desktop app, so you can use warpdrv from another tab or even another machine on your network.

- The **host and port** are set in **Settings** under **API Host** (the listen address). Look up the current value there.
- Because it's a normal web app, you can open it in **multiple browser tabs** at the same time — each tab is just another view of the same running server.
