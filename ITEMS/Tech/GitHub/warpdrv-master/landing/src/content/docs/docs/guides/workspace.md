---
title: Set up a workspace
description: Organize chats into workspaces with project-level defaults — description, default server, default mode, and a project root your tools can find.
---

A **workspace** is a folder in the thread list (the list of all conversations on the left of the Chat page) that carries **project-level defaults**. Every thread inside a workspace inherits those defaults, so you configure it once instead of re-setting things up every session.

If you're working on a project or a recurring topic, a workspace is the right way to do it.

## Create a workspace

1. On the **Chat** page, look at the thread list on the left.
2. Click the **new folder** icon at the top of the list to create a folder.
3. Name it after your project or topic.
4. You can **drag existing conversations** into the folder to group them.

<!-- SCREENSHOT: The Chat page thread list with the new-folder icon at the top and a folder containing a few conversations. -->

Clicking a folder opens its **workspace settings** panel, where you set the defaults below.

## Set the defaults

In the workspace panel you can configure:

- **Description** — free text that gets **injected into the system prompt** for every thread in this workspace. Use it to give the model standing context about the project (what it is, conventions, goals). The model always has this context without you repeating it.
- **Default server** — the model/server to use by default for this workspace.
- **Default mode** — the default workflow mode (e.g. Plan or Build) for this workspace.

<!-- SCREENSHOT: The workspace settings panel showing the description field, project root field, default server picker, and default mode picker. -->

## Project root

This is the most important part of a workspace. The **project root** is the path to your project on disk.

Setting it tells your **tools** where the project lives. Once it's set, tools like file search, file read/write, and shell commands automatically operate on the right folder — instead of you having to pass a path every chat session.

Setting a project root and doing your work inside that workspace is the right way to work on a project: your model has the context (description), uses the right server and mode by default, and your tools know exactly where to look.

## Next steps

- [Using MCP tools](/docs/guides/tools/) — the built-in tools that use your project root.
- [Workflow, Part 1 — Modes](/docs/guides/modes/) — set a sensible default mode for your workspace.
