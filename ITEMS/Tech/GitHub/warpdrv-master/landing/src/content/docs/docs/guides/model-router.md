---
title: Use the model router
description: Expose your local models to external apps and coding harnesses through warpdrv's OpenAI-compatible router.
---

warpdrv isn't just a chat app — it's a **model host**. The **model router** exposes your running models through a standard **OpenAI-compatible endpoint**, so you can use them *outside* warpdrv: in a coding agent, your own editor, a custom script, or any OpenAI-compatible client.

Common harnesses people wire up to it include **OpenCode**, **Cline**, **Roo Code**, and **Aider** — plus any CLI or IDE agent that supports a custom OpenAI-compatible base URL.

## Set up aliases

An **alias** is a short name you attach to a server. On the **Servers** page, click the **`+`** button to the right of a server's name and type a short alias (e.g. `qwen27b`).

<!-- SCREENSHOT: A server card on the Servers page with the "+" alias button highlighted next to the server name. -->

### Why use an alias instead of the model filename?

Model filenames are long, unwieldy, and change every time you swap a quant or version. An alias is short, stable, and — most importantly — **decouples the name your clients use from the actual model behind it**.

This lets you put the **same alias on two different servers** and swap between them without touching your clients:

1. Set the alias `qwen27b` on a server running Qwen 3.6 27B.
2. Later, you want to try a bigger model. Add the *same* alias `qwen27b` to a second server running a different model.
3. Stop the first server and start the second.

Your OpenCode (or any other) config still says `qwen27b` — no changes needed — and it now talks to the new model automatically.

## Sticky routes

When **multiple servers share the same alias** and are all running, the router assigns a **sticky route**: the first request picks one server (preferring a healthy one) and pins it, so all subsequent requests for that alias go to the *same* model. This keeps a conversation consistent instead of bouncing between servers mid-chat.

You can **view and clear** sticky routes, and **start/stop** the router, on the **Proxy** page.

<!-- SCREENSHOT: The Proxy page showing the router status, the list of sticky routes, and the access tokens section. -->

## Using it with a third-party app

This is the main use case. You'll connect your local models to an external app by giving it two things:

- Your **local IP address** (or `localhost` if the app runs on the same machine).
- The **port** the router is running on (default **1234**).

The base URL is:

```
http://<ip>:1234/v1
```

The **alias** is sent as the `model` field in each request — it is *not* part of the URL. So a client addressing the `qwen27b` alias sends `{"model": "qwen27b", ...}`.

### OpenCode

OpenCode supports custom OpenAI-compatible providers. Add a `local` provider to your `opencode.json` pointing at the router:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "local",
      "options": {
        "baseURL": "http://localhost:1234/v1"
      },
      "models": {
        "qwen27b": {
          "name": "qwen3.6-27b",
          "limit": { "context": 260000, "input": 260000, "output": 260000 }
        }
      }
    }
  }
}
```

The key under `models` (`qwen27b`) is the alias you set on the server. For a remote machine, replace `localhost` with your local IP.

<!-- SCREENSHOT: An OpenCode session using the local model, showing a request going through to warpdrv. -->

### Other harnesses

Most OpenAI-compatible clients follow the same pattern — set a custom **base URL** to `http://<ip>:1234/v1` and use your alias as the **model name**:

- **Cline** (VS Code) — set the *OpenAI API Base* to the router URL and the *Model ID* to your alias.
- **Roo Code** (VS Code) — same: custom base URL + model name.
- **Aider** — point `--openai-base-url` (or the `OPENAI_BASE_URL` env var) at the router and set `--model` to your alias.

If you use a different harness, look for its "OpenAI-compatible" / "custom base URL" setting and apply the same base URL + alias.

## Security

The router is a **network-accessible** endpoint. If your machine's IP is reachable beyond localhost (e.g. on a shared network), enable a **Bearer token** so only you can use it:

1. On the **Proxy** page, open the **Access Tokens** section.
2. Create a token and toggle **Require Bearer token for /v1/\***.
3. Pass that token as the API key in your client.

There's also an option to **enforce auth even for localhost** requests if you want to test the protected path.

## Next steps

- [Improving your chat experience](/docs/guides/chat-experience/) — get the most out of warpdrv's own chat.
- [Set up a workspace](/docs/guides/workspace/) — organize projects and their default servers.
