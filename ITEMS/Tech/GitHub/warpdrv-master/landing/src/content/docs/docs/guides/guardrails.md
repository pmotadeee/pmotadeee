---
title: Workflow, Part 2 — Guardrails
description: Guardrails are single-pass inferences that review messages and tool calls, flagging dangerous actions, deviations, and violations.
---

A **guardrail** is a **single-pass inference** that reviews a message or a tool call against an instruction and flags issues as **violations** or **warnings**. It's an extra safety layer that catches dangerous actions, deviations, or violations the model might otherwise make — especially useful when the model is using powerful tools like the shell or file editing.

## What guardrails can run on

A guardrail can run on **any type of message**:

- **All text messages** — review every message.
- **Specific tool calls** — run only when particular tools are called (e.g. only `shell_exec`).

For each guardrail you can **enable or disable thinking** (reasoning) for that one pass.

### The instruction (prompt)

Every guardrail has a **prompt** — the instruction you give to the guardrail's LLM telling it exactly what to look for and how to classify what it finds. This is what makes a guardrail specific to your use case.

The prompt should:

- State **what to check for** (e.g. "destructive shell commands", "hard-coded secrets", "React anti-patterns").
- Say **how to classify findings** — flag serious problems as **violations** and minor issues as **warnings**.
- Be specific enough that the model knows what counts as a problem and what doesn't.

For example, the built-in `rm-guard` prompt reads:

> Destructive shell commands such as `rm`, `rm -rf`, `shred`, `dd`, `mkfs`, and similar data-destruction commands are strictly forbidden. Flag any occurrence as a violation.

And the `code_review` prompt tells the model to check TypeScript/React standards, crash/security risk, and injection of secrets or hard-coded environment-specific values — flagging serious issues as violations and minor suggestions as warnings.

Write your own prompts in the same spirit: clear, specific, and with an explicit violation/warning rule.

### Context: message count

A guardrail reviews the message or tool call being made, but you can give it more surrounding context:

- **Message count** — how many **prior messages** (apart from the one being reviewed) are included as context for the guardrail's inference. Set it to `0` for a minimal context (just the item being reviewed), or higher to give the guardrail more of the conversation.
- **Include base message** — whether to include the base/system message in that context.

## How the review shows up

The guardrail's review appears **immediately after the tool call is requested** by the LLM. You see the flagged issues right away, before you decide what to do.

<!-- SCREENSHOT: A tool call in the chat with a guardrail review appearing right below it, showing a violation and a warning. -->

## The decision is yours

Guardrails **do not auto-deny or block** anything. They only surface issues. After checking the guardrail's output, the approve/deny decision is entirely up to you — it works together with the [permission system](/docs/guides/tools/#permissions).

## Run guardrails on a separate server

You can choose **which LLM server** runs each guardrail. It's **highly recommended** to run guardrails on a *different* server than the one doing the main work — a fast, cheap model can effectively police a more powerful one.

## Default guardrails

warpdrv ships with two built-in guardrails:

- **`rm-guard`** — runs on the `shell_exec` tool. Flags destructive commands such as `rm`, `rm -rf`, `shred`, `dd`, `mkfs`, and similar data-destruction commands as violations.
- **`code_review`** — runs on `file_write` and `file_patch`. Checks that code follows TypeScript/React standards, won't crash or pose a security risk, and flags injection of secrets/keys or hard-coded environment-specific values/paths.

## Best practices

- Use guardrails on **risky tools**, and keep those tools in **ask** mode so you're always prompted.
- **Highly suggested for coding.** Guardrails can review your immediate tool calls, check whether shell commands have destructive potential, and pick out secrets or other issues from within code and file edits.

## Creating and editing guardrails

- **Create a guardrail** with the **`/create guardrail`** slash command.
- **Modify existing guardrails** from the **right-hand panel** on the Chat page.

<!-- SCREENSHOT: The right-hand panel with a guardrail open for editing, showing its instruction, trigger tools, server, and message count. -->

## Per-mode guardrails

Guardrails are **assigned per [mode](/docs/guides/modes/)**. When you switch modes, the active set of guardrails changes automatically to match that mode.

:::caution[Guardrails are not a guarantee]
Guardrails may still miss important or destructive parts. They are an LLM doing the processing, so they are **not guaranteed** to catch everything. Don't rely on them 100% — always do your own review before approving a tool call.
:::

## Next steps

- [Workflow, Part 1 — Modes](/docs/guides/modes/) — assign guardrails to different modes.
- [Workflow, Part 3 — Subagents](/docs/guides/subagents/) — delegate work to parallel subagents.
