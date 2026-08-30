---
title: Onboarding
description: A walkthrough of warpdrv's first-run setup — model folders, backends, and getting started.
---

On the first launch of warpdrv, an **onboarding** flow walks you through the essential setup in a few quick steps. You can re-run it at any time from **Settings → Re-run Onboarding**.

<!-- SCREENSHOT: The onboarding Welcome screen. -->

## Step 1: Welcome

A brief intro screen. Click **Next** to continue.

## Step 2: Model Folders

Tell warpdrv where your GGUF models live. Models should follow a `user/model` folder structure (e.g. `LiquidAI/LFM2.5-2.6B-GGUF`).

1. Type a folder path, or click the folder icon to browse.
2. Click **+** to add the folder.
3. Click **Save & Scan**.

warpdrv scans the folder and reports how many models it found. If you don't have any models yet, you can **Skip** this step and download some later from the [Hub](/docs/guides/first-model/#download-a-model-from-the-hub).

<!-- SCREENSHOT: The Model Folders step with a path added and the "N models found" result showing after Save & Scan. -->

> You can add multiple folders. warpdrv indexes all of them.

## Step 3: Backends

A **backend** is a llama.cpp binary that runs your models. This step shows your detected hardware (OS, architecture, and any GPUs) and lists the available backends for your system.

1. Select the backend that matches your hardware:
   - **CUDA** for NVIDIA GPUs
   - **ROCm** for AMD GPUs
   - **Vulkan** for any GPU (Intel, AMD, NVIDIA)
   - **CPU** if you have no GPU (pre-selected by default)
2. Optionally check **whisper.cpp** backends (for voice dictation) and **Kokoro TTS** (for text-to-speech).
3. Click **Install & continue**.

<!-- SCREENSHOT: The Backends step showing detected hardware at the top and a backend (e.g. CUDA) checked, with the "Install & continue" button. -->

If you're not sure which backend to pick, see the hardware table in the [Downloading & running your first AI model](/docs/guides/first-model/#backends--hardware) guide.

## Step 4: Getting Started Guide

A short 3-slide carousel recaps the core workflow:

- **Download Models from the Hub** — search and download GGUF models from HuggingFace.
- **Add a Backend** — register llama.cpp builds so warpdrv can run them.
- **Launch a Server** — pick a model and backend, then start inference.

Click **Next** when you're ready.

## Step 5: All Set

You're done. Click **Start Using warpdrv** to enter the main app.

<!-- SCREENSHOT: The "All Set" completion screen. -->

## Next steps

- [Downloading & running your first AI model](/docs/guides/first-model/) — get a model running and chatting.
