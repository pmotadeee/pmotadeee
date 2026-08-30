---
title: Introduction
description: What warpdrv is, what it can do, and why it was built.
---

## What is warpdrv

**warpdrv** is a desktop toolkit for using local LLMs — a llama.cpp server manager, a rich chat interface, and a built-in tool system. Built *for* local AI, built *by* local AI. Open source, no hidden code, no analytics.

## What it can do

- **Server management** — Launch `llama-server` instances with full parameter control: context length, GPU layers, speculative decoding, multimodal projections, checkpoints, and any custom flag.
- **Backends** — Bring your own llama.cpp builds (CUDA, ROCm, Vulkan, CPU). Group them for one-click swapping.
- **Models** — Browse and download GGUF models from HuggingFace Hub directly inside the app. Local models are scanned and organized.
- **Rich chat UI** — Threads, folders, full sampling configuration, and built-in MCP tool calling with per-tool permission prompts.
- **Voice** — Kokoro text-to-speech, Whisper dictation, and a combined voice-chat mode that makes conversations feel like a phone call.
- **Proxy / model router** — An OpenAI-compatible endpoint that lets any external app (coding agents, scripts, IDEs) talk to your local models.
- **Workspaces, modes, guardrails, subagents** — Organize projects, control model behavior per task, add safety checks, and delegate work to parallel subagents.

## Why it was made

Many server-management apps bundle a fixed llama.cpp version and limit which models or quantizations work. warpdrv lets you **bring your own llama.cpp builds** — including bleeding-edge forks — and run them with full parameter control. It's built for tinkerers who want control, and also for end-users who just want a one-click local chat app.

## Who it's for

- **Tinkerers** who want to experiment with models, backends, and parameters.
- **Developers** who want to wire local models into their coding workflow via the OpenAI-compatible proxy.
- **End-users** who want a polished, private, local chat experience with no cloud dependency.

## How it was made

A combination of local AIs and human effort by one software developer. Local models used during development included Qwen 3.5 27B and Qwen 3.6 35B, along with Claude Opus 4.6 for planning and skeletons. The app itself hosted the local LLMs used during its own development.

## Roadmap

- **Short-term** — Stabilize critical features and improve them.
- **Mid-term** — Add more efficient tools.
- **Long-term** — An extensible plugin system and code execution containers.

User feedback and feature requests are very welcome — drop by the [Discord](https://discord.gg/Q9kSKhY5), [Reddit](https://www.reddit.com/r/warpdrv/), or [GitHub Issues](https://github.com/mikjee/warpdrv/issues).

## FAQ

Have a question? See the [FAQ](/docs/faq/).
