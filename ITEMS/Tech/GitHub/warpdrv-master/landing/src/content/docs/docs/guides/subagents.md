---
title: Workflow, Part 3 — Subagents
description: Delegate work to subagents that run in isolated nested threads — web research, codebase exploration, summarizing large documents.
---

A **subagent** is a separate LLM (an *agent*) that warpdrv spawns in a **nested thread** to do work in an **isolated context**. The subagent's conversations stay out of your main chat, so you can hand off a big, noisy task and keep your main thread clean.

## What subagents are for

Use a subagent for work that needs a **separate context** you don't want mixed into your main conversation:

- **Web research** — calling `fetch` on large web results and bringing back just the findings.
- **Researching a large codebase** — exploring many files without flooding the main thread with every read.
- **Summarizing large documents** — reading a long document and returning only the summary to the main thread.

## The interaction tools

Subagents communicate with the main thread through a small set of tools:

| Tool | Used by | Purpose |
|------|---------|---------|
| `create_subthread` | Main agent | Spawn a new subagent thread with an agent's config and an initial message. |
| `subthread_send_message` | Main agent | Send a message to an existing subagent thread and wait for its response. |
| `list_subthreads` | Main agent | List all subagent threads under the current thread. |
| `superthread_send_message` | Subagent | Report a message back up to the parent (main) thread. |
| `set_current_status` | Subagent | Set a short status line for the subagent thread. |

The **main agent** uses `create_subthread`, `subthread_send_message`, and `list_subthreads`. The **subagent** uses `superthread_send_message` (to report back) and `set_current_status` (to report its status).

## Creating and editing agents

- **Create an agent** with the **`/create agent`** slash command.
- **Edit an agent** from the **right-hand panel** on the Chat page.

Each agent needs:

- A **prompt** — instructions telling it what to do (see [Managing your prompts](/docs/guides/prompts/)).
- A **description** — a short summary of what the agent does.
- A **server** — the LLM server the agent runs on.
- A **list of tools** — the tools the agent is allowed to use.

Every [mode](/docs/guides/modes/) can have its own list of available agents.

:::danger[Agent tools run without a permission prompt]
**All tools given to an agent run without any permission prompt** — they are automatically approved. **Do not give an agent edit tools** (`file_write`, `file_patch`) **or `shell_exec`**, as that can be very dangerous. Give agents only the tools they truly need (e.g. `fetch`, `rg`, `file_read`).
:::

<!-- SCREENSHOT: The right-hand panel with an agent open for editing, showing its prompt, description, server, and tool list. -->

## Nested threads

Conversations with an agent stay as **nested threads** under your main thread. They're always visible, and you can open any nested thread to **interact with that agent directly** — including posting your own messages to it.

<!-- SCREENSHOT: A main thread with nested subagent threads shown beneath it. -->

## Blocking vs. background

By default a subagent runs in a **blocking** manner — the main agent **waits** until the subagent finishes. There's a **default timeout of about 30 seconds**; after that the subagent is **backgrounded**, meaning it keeps running in the background while the main agent continues its work independently.

You can also **manually background** a subagent using the **background button** on the tool call. That does the same thing — lets the subagent work in the background.

When the subagent finishes its task, it reports the final summary back using `superthread_send_message`.

<!-- SCREENSHOT: A subagent tool call in the main thread with the background button visible. -->

## Creating or reusing subagent threads

When you have follow-up work for a subagent, you have two options:

- **Create a new subagent thread** — a fresh, isolated context (use this when the new task is different).
- **Reuse an existing subagent thread** — if the topic is the same, the main agent can post new messages to the same thread via `subthread_send_message` instead of creating a new one. This keeps the subagent's prior context for the ongoing topic.

## Bringing in other threads

- You can **drag an existing thread** to make it a **child** of your main thread, effectively turning it into a subagent thread.
- Or have the main agent use **`chat_search`** to look up messages from other threads directly.

:::caution[Subagents must report back]
If a subagent **doesn't call `superthread_send_message`**, its result **never reaches the main thread**. In that case, open the subthread and ask it to send its response back (or copy and paste it). Some LLMs may forget to report the final summary back when acting as a subagent.
:::

## Next steps

- [Workflow, Part 1 — Modes](/docs/guides/modes/) — assign agents to different modes.
- [Managing your prompts](/docs/guides/prompts/) — give each agent a clear prompt.
