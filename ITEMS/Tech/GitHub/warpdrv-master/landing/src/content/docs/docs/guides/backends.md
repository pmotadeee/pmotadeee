---
title: Switch to the latest llama.cpp
description: Download or compile a new llama.cpp build, add it to a backend group, and swap it in for all your servers at once.
---

The local-AI scene moves fast. New models are released frequently, and newer llama.cpp versions often bring **performance improvements**, **support for newly released models**, and **new features** (better quantization, speculative decoding improvements, etc.). Keeping your build up to date is how you get the best speed and the widest model compatibility.

This guide shows you how to add a new llama.cpp build and use **backend groups** to swap it in for all your servers with a single click.

## Step 1: Get a llama.cpp build

You need a `llama-server` binary for your OS and GPU. Two options:

- **Download a prebuilt binary** from the [llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases) page. Pick the asset matching your OS and GPU type (CUDA for NVIDIA, ROCm for AMD, Vulkan for any GPU, or CPU).
- **Compile your own** — if you need specific flags or a custom build, see [Recipes — Compile llama.cpp for your system](/docs/guides/compiling/).

## Step 2: Add the backend

1. Go to the **Backends** page.
2. Click **Add** in the llama.cpp backends section.
3. Give it a name (e.g. `llama-b5149-cuda`), browse to the `llama-server` binary you downloaded, and add any default args if needed.
4. Click **Save**. warpdrv validates the binary and detects available GPU devices.

<!-- SCREENSHOT: The Backends page with the Add dialog open, showing the name and binary path fields. -->

## Step 3: Use a backend group

A **backend group** is a named collection of backends with one designated as **active**. Servers that reference the group always use the active backend — so you can swap which build they run without editing each server individually.

1. On the **Backends** page, expand the **Backend Groups** section.
2. Click **Add** to create a new group. Give it a name (e.g. `my-cuda-builds`).
3. Add the backends you want in this group (both the old and the new build).
4. Set the **active** backend — the one your servers should currently use.

<!-- SCREENSHOT: The Backend Groups section with a group card showing multiple member backends and the active one highlighted. -->

## Step 4: Point your servers at the group

For a server to benefit from group switching, it must reference the **group** rather than a direct backend:

1. Open the **Launch Server** dialog (Servers page → Launch Server, or edit an existing server).
2. In the **Backend** section, select the **group** instead of a specific backend.
3. Save and launch.

Any server set to use the group will always resolve to the group's active backend.

## Step 5: Swap to a new version

When you have a new llama.cpp build:

1. Add it as a backend (Step 2).
2. Add it to the group (Step 3).
3. On the group card, click the new backend to **activate** it.

A dialog appears with two options:

- **Switch only** — updates the active backend. Running servers continue with the old binary until you restart them manually.
- **Switch & restart** — updates the active backend *and* restarts all running servers in the group, so they immediately pick up the new build.

<!-- SCREENSHOT: The Activate Backend dialog showing the list of affected servers and the "Switch only" / "Switch & restart" buttons. -->

That's it — all servers using that group now run the new llama.cpp version, with no per-server editing.

## Next steps

- [Recipes — Compile llama.cpp for your system](/docs/guides/compiling/) — build a custom llama.cpp with specific flags.
- [Use the model router](/docs/guides/model-router/) — expose your models to external apps.
