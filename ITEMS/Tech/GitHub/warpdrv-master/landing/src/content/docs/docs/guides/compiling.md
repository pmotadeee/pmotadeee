---
title: Recipes — Compile llama.cpp for your system
description: Use warpdrv's recipe engine to compile llama.cpp (or any other backend) from source with a generated UI form.
---

Sometimes you need a custom llama.cpp build — specific CUDA architectures, a particular branch, or flags the prebuilt binaries don't include. warpdrv's **recipe engine** lets you compile from source right inside the app, with a generated form so you don't have to remember the flags.

## What recipes are

A recipe is a **bash script with a small directive header** that warpdrv parses into a dynamic UI form. You define what inputs the user picks and what steps to run; warpdrv renders the form, runs each step in sequence, and streams the output live.

Recipes are for repeatable compile/build tasks:

- Pulling a branch from any GitHub repo to compile llama.cpp, whisper.cpp, or any other backend.
- Re-running the build when a new version drops.
- Installing dependencies, downloading models, running benchmarks — any repeatable system task.

You can also write your own recipes. Two are provided in the app repository.

> **Bash required.** Recipes run in Bash. On Windows, install [Git for Windows](https://gitforwindows.org/) (Git Bash) or use WSL.

## Where the recipes live

Two recipes ship in the repo at [`docs/recipes/`](https://github.com/mikjee/warpdrv/tree/master/docs/recipes):

| File | Purpose |
|------|---------|
| `llama-cuda-vulcan-recipe.sh.txt` | Builds llama.cpp with CUDA + optional Vulkan. Pick the CUDA arch (Turing through Blackwell). |
| `llama-rocm-recipe.sh.txt` | Builds llama.cpp with ROCm/HIP. Includes pre-flight checks and AMDGPU tuning for Strix Halo (gfx1151). |

Copy either one into the recipe editor to get started.

## The recipe format

Two directives, both written as comment lines (so bash itself ignores them):

| Directive | Purpose | Params |
|-----------|---------|--------|
| `#!input NAME type [modifiers]` | Defines a form field and an env var available in every step | `type`: `string`, `number`, `bool`, `choice` · `default=val` · `description="..."` · `options=a,b,c` (choice only) |
| `#!step Name [cwd=path]` | Splits the script into a named stage | `cwd=path` — optional working directory (supports `~`, `$HOME`) |

**How it works:**

- Each `#!input` becomes a form field in the UI *and* an environment variable inside every step.
- Each `#!step` runs in its own fresh `bash -c` process. Shell variables and `cd` do **not** carry over between steps — only the input env vars persist. Re-`cd` at the top of each step that needs it, or use `cwd=`.
- The UI form is **auto-generated** from the `#!input` lines. You don't write any UI code.
- A non-zero exit code in any step stops the recipe and marks that step as failed in the UI.

## Example: the CUDA + Vulkan recipe

Here's the full `llama-cuda-vulcan-recipe.sh.txt` with each section annotated:

### Inputs (the form)

```bash
#!input REPO_URL string default=https://github.com/ggerganov/llama.cpp
#!input BRANCH string default=master
#!input BUILD_DIR string default=/mnt/ml/llamatest
#!input CUDA_ARCH choice options=75,80,86,89,90,120 default=120 description="GPU compute capability (75=Turing, 86=Ampere, 89=Ada, 90=Hopper, 120=Blackwell)"
#!input ENABLE_VULKAN bool default=true
#!input JOBS number default=8 description="Parallel build jobs"
```

Defines the form: repo URL, branch to check out, build directory, a dropdown for the CUDA compute capability, a toggle for Vulkan, and the number of parallel build jobs.

### Step 1: Clone repository

```bash
#!step Clone repository cwd=~
export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND="ssh -o BatchMode=yes"
git clone --progress -b "$BRANCH" "$REPO_URL" "$BUILD_DIR" || (cd "$BUILD_DIR" && git fetch --progress && git checkout "$BRANCH" && git pull --progress)
```

Clones the repo if it doesn't exist, or fetches and pulls if it does (idempotent). Runs from the home directory. `GIT_TERMINAL_PROMPT=0` prevents git from hanging on a password prompt.

### Step 2: Configure cmake

```bash
#!step Configure cmake
VULKAN_FLAG=""
if [ "$ENABLE_VULKAN" = "true" ]; then VULKAN_FLAG="-DGGML_VULKAN=ON"; fi
cd "$BUILD_DIR"
cmake -B build \
    -DGGML_CUDA=ON \
    -DCMAKE_CUDA_ARCHITECTURES="$CUDA_ARCH" \
    -DCMAKE_BUILD_TYPE=Release \
    $VULKAN_FLAG
```

Configures the build: enables CUDA, sets the GPU compute architecture from the dropdown, and conditionally enables Vulkan if the toggle is on.

### Step 3: Build

```bash
#!step Build
cd "$BUILD_DIR"
cmake --build build --config Release -j "$JOBS"
```

Compiles with the specified number of parallel jobs.

### Step 4: Verify

```bash
#!step Verify
"$BUILD_DIR/build/bin/llama-server" --version
```

Smoke test: runs the freshly built binary and prints its version. If this step passes, the build is good.

<!-- SCREENSHOT: The Recipes page with the CUDA+Vulkan recipe's generated form on the left and the step list on the right. -->

## How to use a recipe

1. Go to the **Recipes** page.
2. Click **New Recipe**, give it a name and description.
3. Paste the recipe contents into the editor.
4. Save. The form on the left is auto-generated from the `#!input` lines.
5. Fill in the form (defaults are pre-filled), click **Run**.
6. Watch each step stream its output. A non-zero exit stops the recipe and highlights the failed step.

Once the build completes, register the resulting `llama-server` binary as a backend — see [Switch to the latest llama.cpp](/docs/guides/backends/).

<!-- SCREENSHOT: A recipe run in progress, showing the step list with outputs streaming and a step marked as completed. -->

## Writing your own

Copy one of the included recipes and tweak it:

- Change the `REPO_URL` default to point at a different repo (e.g. a llama.cpp fork).
- Add a new `#!input` for a flag you want to control.
- Add or reorder `#!step` sections.

**Common gotchas:**

- Forgetting to `cd` at the top of a step that needs the build directory (each step starts fresh).
- Unquoted variables breaking on paths with spaces — always `"$VAR"`.
- Assuming `set -e` from one step carries over — it doesn't.
- Putting `sudo` in a recipe expecting a password prompt — it won't work. Configure passwordless sudo for that command first, or run it manually before triggering the recipe.

## Next steps

- [Switch to the latest llama.cpp](/docs/guides/backends/) — register your build and use backend groups.
- [Downloading & running your first AI model](/docs/guides/first-model/) — get a model running.
