---
title: Installation
description: Install warpdrv on Linux, Windows, or macOS.
---

## System requirements

warpdrv works with any standard `llama-server` binary, so hardware compatibility tracks llama.cpp's own support matrix:

| Backend | Hardware |
|---------|----------|
| CUDA | NVIDIA GPUs |
| ROCm | AMD GPUs |
| Vulkan | Any GPU (Intel, AMD, NVIDIA) |
| CPU | Any machine (no GPU required) |

> **Note:** warpdrv does not bundle a llama.cpp binary. You'll download or compile one separately — covered in the [Downloading & running your first AI model](/docs/guides/first-model/) guide.

## Download

Head to the [releases page](https://github.com/mikjee/warpdrv/releases) and grab the latest build for your platform.

<!-- SCREENSHOT: GitHub releases page showing the downloadable assets (.deb, .AppImage, .rpm, .msi) for the latest release. -->

## Install

### Linux

**`.deb` (Debian, Ubuntu, Mint):**

```bash
sudo dpkg -i warpdrv_*.deb
```

**RPM (Fedora, openSUSE, RHEL):**

```bash
sudo rpm -i warpdrv_*.rpm
```

**`.AppImage` (any distro):**

```bash
chmod +x warpdrv-*.AppImage
./warpdrv-*.AppImage
```

### Windows

Download the `.msi` installer and run it through the standard Windows installer wizard.

> **Note:** The **Recipes** feature (automated llama.cpp builds) requires Bash. On Windows, install [Git for Windows](https://gitforwindows.org/) or use WSL to get a Bash environment.

### macOS

No prebuilt binary is available yet. You'll need to build from source — see the [Compiling](/docs/guides/compiling/) guide. Untested on Apple Silicon; contributions welcome.

## First run

On first launch, warpdrv shows an **onboarding welcome screen** that walks you through:

1. Adding a folder where your GGUF models live (or where to download them).
2. Optionally installing a llama.cpp backend.
3. A short slideshow of next steps.

See the [Onboarding](/docs/guides/onboarding/) guide for a detailed walkthrough.

<!-- SCREENSHOT: The onboarding welcome screen on first launch. -->

## Where your data is stored

- **Config & data:** `~/.config/warpcore/` (Linux) — chat database, settings, MCP config, recipes.
- **Models:** Stay in whatever folder you point warpdrv at. warpdrv only indexes them; it never moves or modifies your model files.

Your data is preserved across updates and reinstalls.

## Updating

warpdrv checks for updates on startup. If a new version is available, a banner appears at the top of the app. Click it to open the releases page, download the new version, and install. Your data is preserved.

<!-- SCREENSHOT: The update banner at the top of the app indicating a new version is available. -->

## Next steps

- [Onboarding](/docs/guides/onboarding/) — a detailed walkthrough of the first-run setup.
- [Downloading & running your first AI model](/docs/guides/first-model/) — get a model running and chatting.
