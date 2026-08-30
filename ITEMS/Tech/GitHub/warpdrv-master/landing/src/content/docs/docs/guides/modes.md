---
title: Workflow, Part 1 — Modes
description: Modes change how the LLM behaves for a task — its own tools, agents, guardrails, and a custom prompt.
---

**Modes** change how the LLM behaves depending on what you want to do. Instead of one fixed behavior for every conversation, a mode lets you switch the model between, say, thinking carefully and planning versus actually writing code.

warpdrv ships with two built-in modes:

- **Plan** — the model investigates and researches, then proposes a plan. It makes **no edits** and waits for you to approve the plan first.
- **Build** — the model strictly implements the plan you agreed on, and stops to ask before doing anything out of scope.

Modes are a great way to separate **planning** from **development**, or to dedicate a mode to **research**. Each mode has a **color** that's shown in the UI so you can always tell which mode you're in.

## What a mode contains

A mode is more than a label. Each one can define:

- **Its own list of tools** — the only tools the model may use in that mode.
- **Its own agents** — the subagents it may spawn (see [Workflow, Part 3 — Subagents](/docs/guides/subagents/)).
- **Its own guardrails** — safety checks applied to the work (see [Workflow, Part 2 — Guardrails](/docs/guides/guardrails/)).
- **A customized prompt** — instructions that tell the AI how to operate while in this mode.

### Tool enforcement

warpdrv **rejects any tool call that isn't in the active mode's allowed list**. So if the model tries to call a tool the mode doesn't permit, the call is refused. This means a mode can't accidentally use a tool it shouldn't — for example, a read-only planning mode can't write files.

## Creating and editing modes

- **Create a mode** with the **`/create mode`** slash command.
- **Edit a mode** from the **right-hand panel** on the Chat page. There you can change a mode's tools, agents, guardrails, and prompt.

<!-- SCREENSHOT: The right-hand panel with a mode open for editing, showing its tools, agents, guardrails, and prompt. -->

## Switching modes

Use the **mode tabs** in the UI to switch between modes. You can also set a **default mode** for a [workspace](/docs/guides/workspace/) so it's applied automatically to new threads.

<!-- SCREENSHOT: The mode tabs in the chat UI, with the active mode highlighted in its color. -->

### Prompt reprocessing

Switching **between two non-default modes** does **not** reprocess the prompt. However, **turning a mode off** (switching to the default mode) or **switching from the default mode to a mode** **does** trigger a reprocessing of the entire prompt.

:::caution[Editing a mode mid-chat]
Editing a mode — or toggling between the default mode and a mode — **in the middle of a chat** causes the **entire prompt to be reprocessed**. Make mode changes at the **start** of a chat, not in the middle.
:::

## Next steps

- [Workflow, Part 2 — Guardrails](/docs/guides/guardrails/) — add safety checks to your modes.
- [Workflow, Part 3 — Subagents](/docs/guides/subagents/) — delegate work to parallel subagents.
