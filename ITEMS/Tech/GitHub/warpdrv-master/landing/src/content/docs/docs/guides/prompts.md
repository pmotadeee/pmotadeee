---
title: Managing your prompts
description: Save reusable, named prompts with the /create prompt command and attach them to modes, agents, guardrails, and workspaces.
---

A **prompt** is a saved, named block of instructions you can reuse across the app. Instead of re-typing the same instructions every time, you create a prompt once and reference it wherever you need it.

## Create a prompt

Use the **`/create prompt`** slash command in the chat input:

1. Type `/create prompt` followed by your instructions.
2. Give the prompt a name.
3. It's saved and available to reference everywhere.

## Where prompts are used

A saved prompt can be attached to:

- A **mode's** custom prompt — how the model behaves in that mode.
- An **agent's** prompt — what the agent is instructed to do.
- A **guardrail's** instruction — what the guardrail checks for.
- A **workspace's** description — standing context injected into the system prompt.

Using named prompts keeps your setup consistent and easy to update in one place.

## Next steps

- [Workflow, Part 1 — Modes](/docs/guides/modes/) — assign a prompt to a mode.
- [Workflow, Part 3 — Subagents](/docs/guides/subagents/) — give agents their own prompts.
