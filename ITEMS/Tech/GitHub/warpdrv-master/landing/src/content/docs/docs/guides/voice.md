---
title: Set up voice and push to talk
description: Dictation, voice chat mode, and push-to-talk in warpdrv — powered by Whisper and Kokoro TTS.
---

warpdrv has two voice capabilities, both powered by a **Whisper** speech-to-text model:

- **Dictation** — speak, and it's automatically transcribed to text.
- **Voice chat mode** — also uses Whisper, but the moment you stop speaking it automatically triggers inference and sends your text to the model. As the reply starts to stream in, it reads the response aloud using the Kokoro voice you've selected in Settings.

To use either feature you need a running **Whisper server**, which requires two things: a **Whisper model** (the `.bin` file) and a **Whisper backend** (the `whisper-server` program). Set them up once and you're done.

## Step 1: Download a Whisper model

A Whisper model is a `.bin` file — **different from the GGUF chat models** you use for inference.

1. Open the **Hub** page.
2. In the search box, type `ggml`. The results will be Whisper models in ggml format (e.g. `ggml-org/whisper-ggml`).
3. Pick a model size:
   - **`ggml-medium`** — a good balance of accuracy and speed (~1.5 GB). Recommended for most setups.
   - **`ggml-large-v3-turbo`** — the best quality, but needs more VRAM (~3 GB).
4. Click **Download** and wait for it to finish. The model is saved into your model folder and indexed automatically.

<!-- SCREENSHOT: The Hub page with "ggml" typed in the search box, showing a whisper-ggml model in the results. -->

## Step 2: Get a Whisper backend

The backend is the `whisper-server` binary that runs the model. You can get it two ways:

### Option A: Auto-install (recommended)

The easiest way is through onboarding:

1. Go to **Settings** and click **Re-run Onboarding** (or just finish onboarding if you're still going through it).
2. On the **Backends** step, you'll see a section for **whisper.cpp backends** below the llama.cpp ones.
3. Check the box next to a whisper backend (pick one matching your hardware — CUDA for NVIDIA, ROCm for AMD, CPU if no GPU).
4. Click **Install & continue**. warpdrv downloads and registers it automatically.

### Option B: Add it manually

If you'd rather do it by hand:

1. Download the `whisper-server` binary for your OS from the [whisper.cpp releases](https://github.com/ggml-org/whisper.cpp/releases) page.
2. In warpdrv, go to the **Backends** page and expand the **Whisper.cpp Backends** section.
3. Click **Add**.
4. Give the backend a name (e.g. `whisper-cuda`), click the file-picker to browse to the `whisper-server` binary you downloaded, and click **Save**.

<!-- SCREENSHOT: The Backends page with the Whisper.cpp Backends section expanded and the Add dialog open, showing the name and binary path fields. -->

## Step 3: Launch the Whisper server

1. Go to the **Servers** page.
2. Click **Launch Whisper**.
3. In the dialog, pick the Whisper model you downloaded and the backend you registered.
4. Click **Launch**.

<!-- SCREENSHOT: The Launch Whisper dialog with a model and backend selected. -->

> **Tip:** Enable the **auto-launch** toggle in the dialog so the Whisper server starts every time the app opens — that way dictation and voice chat are always available without manual setup.

## Dictation & push-to-talk

- Click the **mic** button in the chat composer to dictate. Your speech is transcribed and inserted into the input.
- Use the **push-to-talk (PTT) button** for hands-free control: hold to record, release to transcribe.

The PTT key is configurable in **Settings** (default is `Insert`). We recommend setting it to a modifier combination like `Ctrl+Shift` or `Alt+Shift` so it doesn't clash with normal typing. Settings also offers a **Hold** mode and a **Global PTT** key that works even when warpdrv isn't the focused window.

<!-- SCREENSHOT: The chat composer with the mic and push-to-talk buttons visible. -->

## Text-to-speech (Kokoro)

Kokoro TTS works out of the box — no setup required.

- Press the small **TTS** button at the end of any message to hear it read aloud.
- Or select a message (or part of the text) and use the **TTS** button in the small pop-up that appears.

The same selection pop-up also lets you **dictate** or **annotate** the selected text.

## Annotating with voice

When you select text and start an annotation via the selection pop-up, you can keep using voice:

- **Dictation mode** — your spoken words are transcribed straight into the annotation/comment input box.
- **Voice chat mode** — as soon as you stop speaking, the annotation is saved as a new note. Inference is *not* triggered; it waits so you can keep annotating as many times as you like.

<!-- SCREENSHOT: The selection pop-up open over a highlighted chunk of chat text, showing the TTS, dictation, and annotate options. -->

## Next steps

- [Use the model router](/docs/guides/model-router/) — expose your models to external apps.
