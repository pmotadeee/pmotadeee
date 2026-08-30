import type { IChatPrompt, IChatPromptCreatePayload } from "@warpcore/shared";
import { genPromptId } from "@warpcore/shared";
import { Router } from "express";
import { persistence } from "../index";
import { sseManager } from "../services/sseManagerInstance";

export const promptsRouter = Router();

// GET /api/prompts
promptsRouter.get("/", async (_req, res) => {
	try {
		const prompts = await persistence.listChatPrompts();
		res.json({ ok: true, data: prompts, total: prompts.length, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// GET /api/prompts/:id
promptsRouter.get("/:id", async (req, res) => {
	try {
		const prompt = await persistence.getChatPrompt(req.params.id);
		if (!prompt) return res.status(404).json({ ok: false, data: null, error: "Not found" });
		res.json({ ok: true, data: prompt, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/prompts
promptsRouter.post("/", async (req, res) => {
	try {
		const payload = req.body as IChatPromptCreatePayload;
		if (!payload.name?.trim()) {
			res.status(400).json({ ok: false, data: null, error: "Name is required" });
			return;
		}
		if (!payload.content) {
			res.status(400).json({ ok: false, data: null, error: "Content is required" });
			return;
		}

		const id = genPromptId();
		const now = Date.now();
		const prompt: IChatPrompt = {
			id,
			name: payload.name.trim(),
			content: payload.content,
			meta: payload.meta ?? null,
			createdAt: now,
			updatedAt: now,
		};

		await persistence.createChatPrompt(prompt);
		sseManager.emit("prompts:update", prompt);
		res.status(201).json({ ok: true, data: prompt, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PUT /api/prompts/:id
promptsRouter.put("/:id", async (req, res) => {
	try {
		const existing = await persistence.getChatPrompt(req.params.id);
		if (!existing) return res.status(404).json({ ok: false, data: null, error: "Not found" });

		const payload = req.body as Partial<IChatPromptCreatePayload>;
		await persistence.updateChatPrompt(req.params.id, {
			name: payload.name?.trim(),
			content: payload.content,
			meta: payload.meta ?? null,
		});

		const updated = await persistence.getChatPrompt(req.params.id);
		if (!updated)
			return res
				.status(500)
				.json({ ok: false, data: null, error: "Prompt disappeared after update" });

		sseManager.emit("prompts:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// DELETE /api/prompts/:id
promptsRouter.delete("/:id", async (req, res) => {
	try {
		const existing = await persistence.getChatPrompt(req.params.id);
		if (!existing) return res.status(404).json({ ok: false, data: null, error: "Not found" });
		await persistence.deleteChatPrompt(req.params.id);
		sseManager.emit("prompts:delete", { id: req.params.id });
		res.json({ ok: true, data: null, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});
