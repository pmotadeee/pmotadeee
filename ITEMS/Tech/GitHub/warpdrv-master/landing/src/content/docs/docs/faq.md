---
title: FAQ
description: Frequently asked questions about warpdrv.
---

## Does warpdrv send any telemetry?

No. warpdrv has **no telemetry, no analytics, and no remote calls** — with one exception: on startup it makes a single update-check request to fetch `release.json` from the GitHub repo so it can tell you when a new version is available. Nothing else is sent anywhere.

## Is it free?

Yes. warpdrv is free and open source.

## What is the license?

warpdrv is licensed under **AGPL-3.0**. If you offer it as a network service, you must publish your modifications under AGPL. If you need a commercial license without the AGPL obligations, join the [Discord](https://discord.gg/Q9kSKhY5) and PM the mods.

## I found a bug. What should I do?

File an issue on [GitHub](https://github.com/mikjee/warpdrv/issues) with as much detail as you can — ideally reproduction steps. Even better, send a PR with a fix.

## I have a feature suggestion. What should I do?

Share it in the [Discord](https://discord.gg/Q9kSKhY5), on [Reddit](https://www.reddit.com/r/warpdrv/), or as a [GitHub Issue](https://github.com/mikjee/warpdrv/issues). User feedback and feature requests are very welcome.

## Where is my data stored? Does it leave my computer?

On Linux, config and data live in `~/.config/warpcore/` — chat database, settings, MCP config, and recipes. Your models stay in whatever folder you point warpdrv at; it only indexes them and never moves or modifies them. Your data never leaves your computer.

## Can I use it commercially?

warpdrv is licensed under AGPL-3.0. If you offer it as a network service, you must publish your modifications under AGPL. For commercial licensing without the AGPL obligations, join the [Discord](https://discord.gg/Q9kSKhY5) and PM the mods.

---

Have something else to ask? Drop by the [Discord](https://discord.gg/Q9kSKhY5). See also the [Introduction](/docs/).
