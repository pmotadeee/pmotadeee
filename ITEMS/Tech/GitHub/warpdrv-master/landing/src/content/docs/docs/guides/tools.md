---
title: Using MCP tools
description: The built-in warpMCP tools, how to extend them with external MCP servers, and the permission system that controls every tool call.
---

warpdrv ships with a built-in default MCP server — **warpMCP** — that provides the tools listed below. You can also **extend** it by adding external MCP servers through the `mcp.json` on the **MCP** page.

## Built-in tools

### File system

| Tool | Description |
|------|-------------|
| `file_read` | Read the contents of a file, optionally a range of lines. |
| `file_write` | Write content to a file, creating or overwriting it. |
| `file_patch` | Replace a specific text segment in a file. |
| `dir_list` | List a directory's contents with optional glob filtering and recursion. |

### Coding / code search

| Tool | Description |
|------|-------------|
| `rg` | Fast regex search across file contents using ripgrep. |
| `code_graph_search` | Search the code graph for symbols by name, kind, or signature. |
| `code_graph_symbol` | Get detailed info about a specific symbol (type, location, source). |
| `code_graph_list` | List all symbols in a file or directory. |
| `code_graph_callers` | Find all symbols that call or reference a given symbol. |
| `code_graph_callees` | Find all symbols that a given symbol calls or references. |
| `code_graph_ingest` | Index a project's code into the code graph. |
| `code_graph_clear` | Clear the code graph index for a project. |

### Shell

| Tool | Description |
|------|-------------|
| `shell_exec` | Execute a shell command (bash on Linux/mac, PowerShell on Windows). |

### Web

| Tool | Description |
|------|-------------|
| `fetch` | Perform an HTTP request and return the response. |

### Subagent control

| Tool | Description |
|------|-------------|
| `create_subthread` | Spawn a subagent (child thread) to work on a task in parallel. |
| `subthread_send_message` | Send a message to a subagent thread and wait for its response. |
| `superthread_send_message` | Send a message back up to the parent thread. |
| `list_subthreads` | List all subagent threads of the current thread. |
| `set_current_status` | Update the status line shown for the current thread. |

### Chat / memory search

| Tool | Description |
|------|-------------|
| `chat_search` | Search across your conversations for relevant messages. |
| `chat_get_message` | Fetch the full content of a specific chat message. |
| `embedding_search` | Semantic search over embedded content in a workspace. |

### Task

| Tool | Description |
|------|-------------|
| `todo` | Manage a per-thread todo list (read, write, update, clear). |

## Using external MCP servers

You can extend the built-in tools by adding **external MCP servers**. These are configured in `mcp.json`, located at `~/.config/warpcore/mcp.json` (editable from the **MCP** page).

The format follows the standard MCP structure — a `mcpServers` object where each entry is a named server with a `command` to launch and its `args`:

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    }
  }
}
```

In this example, **desktop-commander** is a filesystem and desktop automation server that runs via `npx` with no install step. warpdrv spawns it over stdio and merges its tools into the available set.

Once added, external tools appear in the same permission system as the built-in ones (default `ask`). The same warning applies: any external tool that writes files or executes commands should stay on `ask`.

There are hundreds of community MCP servers available — search online for one that fits your use case and add it to your `mcp.json`.

## Permissions

Every tool call goes through a **permission system** with three modes: **ask**, **allow**, and **deny**.

### Global permissions (MCP page)

On the **MCP** page you can set a **global** permission mode for every tool registered by every MCP server, including the built-in warpMCP.

- **Default is `ask`** — every time a tool is called, you're prompted to approve it.
- You can switch a tool globally to `allow` (auto-approve) or `deny` (always block).

<!-- SCREENSHOT: The MCP page showing the list of tools with their global permission modes. -->

:::caution[Keep dangerous tools on "ask"]
**Edit tools** (`file_write`, `file_patch`), the **shell** tool (`shell_exec`), and the **fetch** tool should **never** be set to auto-allow. They can modify your files, run arbitrary commands, or make network requests. Keep them on **ask** so you're always prompted before they run.
:::

### Per-thread override (right panel)

On the **Chat** page, the **right panel** has a per-thread tool permission list. This **overrides** the global setting for that specific conversation. You can set each tool to **ask**, **allow**, or **deny** for the current thread only.

### How a tool call is handled

When the model calls a tool:

1. The permission system resolves the effective mode (per-thread override if set, otherwise the global mode).
2. If the mode is **`ask`**, a **permission interface** appears showing the tool name and its arguments. You **approve** or **deny** the call.
3. If **`allow`**, the tool runs immediately.
4. If **`deny`**, the call is blocked and the model is told it was denied.

<!-- SCREENSHOT: The permission prompt interface showing a tool call awaiting approval, with approve and deny buttons. -->

## Choosing tools per chat

Near the composer (where you type your prompt) there's a **tool selector** that lets you choose which tools are active for the current chat.

> **Note:** Changing the tool selection **in the middle of a chat** causes the entire prompt to be **reprocessed**. This is because the list of available tools is sent at the very beginning of the request (per the llama.cpp specification). **Set your tools at the start of the chat.**

If you want different tool sets for different tasks — e.g. read-only tools for planning, and edit/shell tools for building — that's what **modes** are for. See [Workflow, Part 1 — Modes](/docs/guides/modes/).

## Next steps

- [Workflow, Part 1 — Modes](/docs/guides/modes/) — group tools into reusable modes.
- [Workflow, Part 2 — Guardrails](/docs/guides/guardrails/) — add safety checks around tool usage.
