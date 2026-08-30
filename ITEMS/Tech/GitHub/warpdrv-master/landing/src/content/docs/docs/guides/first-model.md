---
title: Downloading & running your first AI model
description: Download a small GGUF model from the Hub, create a llama.cpp server, and start chatting — step by step.
---

This guide walks you through downloading and running your first local AI model in warpdrv. We'll use a small model so that anyone, regardless of hardware, can follow along.

## Prerequisites

- warpdrv is installed (see the [Installation guide](/docs/guides/installation/)).
- You have a **backend** — a llama.cpp binary that runs the actual inference.

### Backends & hardware

A backend is the engine that executes your model. warpdrv supports several backend types, each tied to a hardware target:

| Hardware | Backend type | Notes |
|----------|-------------|-------|
| NVIDIA GPU | **CUDA** | Best performance on NVIDIA cards. |
| AMD GPU | **ROCm** | Optimized for AMD GPUs. |
| Any GPU (Intel, AMD, NVIDIA) | **Vulkan** | Cross-vendor GPU support; good fallback if no dedicated CUDA/ROCm build exists. |
| CPU only | **CPU** | Always available. Slower, but works on any machine. |

If you already installed a backend during [onboarding](/docs/guides/onboarding/), you can skip to the next section. Otherwise:

1. Go to **Settings** in the left sidebar.
2. Find the **Onboarding** card and click **Re-run Onboarding**.
3. On the *Backends* step, select the backend that matches your hardware (e.g. CUDA for an NVIDIA GPU) and click **Install & continue**.

<!-- SCREENSHOT: Settings page showing the "Re-run Onboarding" button in the Onboarding card. -->

Alternatively, you can manually add a backend on the **Backends** page if you have a custom llama.cpp build.

## Download a model from the Hub

The **Hub** page lets you search for GGUF models on HuggingFace and download them directly into your model folders.

1. Click **Hub** in the left sidebar.
2. In the search box, type `LiquidAI/LFM2.5-2.6B-GGUF` and press Enter.

<!-- SCREENSHOT: Hub page with "LiquidAI/LFM2.5-2.6B-GGUF" typed in the search bar, showing the model card in results. -->

3. Click on the model card to open its detail view. You'll see a list of available quantized files.
4. Pick a **Q4_K_M** quantization file (a good balance of quality and size for a 2.6B model — roughly 1.5–2 GB).
5. Click **Download**.

<!-- SCREENSHOT: Hub model detail page for LFM2.5-2.6B-GGUF, with the Q4_K_M file row highlighted and the Download button visible. -->

The file downloads into your first configured model folder. Once complete, warpdrv automatically detects the new model — no manual scan needed.

> **Tip:** You can track download progress on the Hub page. A small indicator shows active downloads at the top.

## Create a llama.cpp server

A *server* is a running instance of a model backed by a specific backend. You create one from the **Servers** page.

1. Click **Servers** in the left sidebar.
2. Click the **Launch Server** button at the top of the page.

<!-- SCREENSHOT: Servers page with the "Launch Server" button visible at the top. -->

The **Launch Server** dialog opens. For a basic setup, you only need to configure two things:

### 1. Select a model

In the **Model** section, use the search box to find the model you just downloaded. Type `LFM2.5` and select the entry.

### 2. Select a backend

In the **Backend** section, pick the backend you installed (e.g. `CUDA` or `CPU`). If you have a GPU backend, that's the one to use.

<!-- SCREENSHOT: Launch Server dialog with the model set to LFM2.5-2.6B and a backend selected. Everything else left at defaults. -->

> **That's it for the basics.** All other settings (GPU layers, context size, etc.) have sensible defaults. The **Autofit GPU layers** option automatically allocates as many layers to your GPU as will fit in VRAM, spilling the rest to CPU.

Click **Launch** at the bottom of the dialog.

### Advanced launch options

The Launch Server dialog includes many additional configuration options for tuning performance and behavior. These are described here as a reference outline; detailed per-control documentation will be added in a future update.

- **Context & KV** — Context Size, K Type, V Type, Parallel Slots, Cache RAM, Ctx Checkpoints, Slot Prompt Similarity
- **Options** — Flash Attention, MLock, MMap, Direct I/O, No Warmup, Jinja, SWA Full, Preserve Thinking, KV Unified, Batch Size, Micro Batch, Threads, Threads (Batch), Custom flags
- **Recommended params** — One-click inference parameters suggested for the selected model
- **Multi-modal** — Enable vision (image) input if the model supports it
- **Embedding** — Configure an embedding server for semantic search
- **Speculative decoding** — Speed up generation with a draft model (MTP, n-gram, or draft)
- **Footer toggles** — Auto-launch at startup, Auto-load latest checkpoint on start, Auto-save all slots on stop

## Launch the server & watch the logs

After clicking **Launch**, the dialog closes and a new server card appears on the Servers page. The card shows a **Loading** status while the model is being loaded into memory.

To watch the startup progress in real time:

1. On the server card, click the **Terminal** icon (bottom-right of the card).
2. A log panel opens showing the raw command-line output from the llama.cpp process.

<!-- SCREENSHOT: Server card in "Loading" state with the Terminal log panel open, showing llama.cpp startup output (model loading, layer allocation, server listening). -->

You'll see lines like:

```
llama_model_loader: loaded xx components
llama_context: n_ctx = 4096
server: listening on 127.0.0.1:8080
```

Once you see the `listening` line, the server is ready. The card status changes to **Running** (green).

## Chat with your model

1. Click **Chat** in the left sidebar.
2. At the top of the chat area, click the **server picker** (shows the currently selected server name with a status dot).
3. Select the server you just launched.
4. Start typing a message and press Enter.

<!-- SCREENSHOT: Chat page with the server picker showing the running LFM2.5 server selected, and a first user message with a model response visible. -->

You're now chatting with a local AI model running entirely on your own hardware.

## Next steps

- [Improving your chat experience](/docs/guides/chat-experience/) — configure prompts, modes, and more.
- [Use the model router](/docs/guides/model-router/) — automatically route requests to the best server.
- [Set up a workspace](/docs/guides/workspace/) — organize projects with their own server defaults.
