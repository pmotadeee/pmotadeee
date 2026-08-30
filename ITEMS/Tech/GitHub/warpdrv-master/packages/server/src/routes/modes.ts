import type { IMode, IModeCreatePayload, IToolAttachment } from "@warpcore/shared";
import { Router } from "express";
import { nanoid } from "nanoid";
import { deleteMode, getMode, putMode } from "../services/modeStore";
import { sseManager } from "../services/sseManagerInstance";

export const modesRouter = Router();

// POST /api/modes
modesRouter.post("/", async (req, res) => {
	try {
		const body = req.body as IModeCreatePayload;
		const mode: IMode = {
			id: nanoid(6),
			name: body.name,
			scope: body.scope,
			color: body.color || "#a78bfa",
			promptId: body.promptId || undefined,
			prompt: body.prompt || undefined,
			allowedTools: body.allowedTools || [],
			allowedAgents: body.allowedAgents || [],
			activeGuardrails: body.activeGuardrails || [],
		};
		await putMode(mode);
		sseManager.emit("modes:update", mode);
		res.json({ ok: true, data: mode, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PUT /api/modes/:id
modesRouter.put("/:id", async (req, res) => {
	try {
		const existing = await getMode(req.params.id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Mode not found" });
			return;
		}
		const body = req.body as Partial<IMode>;
		const updated: IMode = {
			...existing,
			...(body.name !== undefined && { name: body.name }),
			...(body.scope !== undefined && { scope: body.scope }),
			...(body.color !== undefined && { color: body.color }),
			...(body.promptId !== undefined && { promptId: body.promptId }),
			...(body.prompt !== undefined && { prompt: body.prompt }),
			...(body.allowedTools !== undefined && { allowedTools: body.allowedTools }),
			...(body.allowedAgents !== undefined && { allowedAgents: body.allowedAgents }),
			...(body.activeGuardrails !== undefined && { activeGuardrails: body.activeGuardrails }),
		};
		await putMode(updated);
		sseManager.emit("modes:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// DELETE /api/modes/:id
modesRouter.delete("/:id", async (req, res) => {
	try {
		const existing = await getMode(req.params.id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Mode not found" });
			return;
		}
		await deleteMode(req.params.id);
		sseManager.emit("modes:delete", existing);
		res.json({ ok: true, data: null, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PATCH /api/modes/:id/tools
modesRouter.patch("/:id/tools", async (req, res) => {
	try {
		const existing = await getMode(req.params.id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Mode not found" });
			return;
		}
		const body = req.body as { tools: IToolAttachment[] };
		const updated: IMode = { ...existing, allowedTools: body.tools || [] };
		await putMode(updated);
		sseManager.emit("modes:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PATCH /api/modes/:id/guardrails
modesRouter.patch("/:id/guardrails", async (req, res) => {
	try {
		const existing = await getMode(req.params.id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Mode not found" });
			return;
		}
		const body = req.body as { activeGuardrails: string[] };
		const updated: IMode = { ...existing, activeGuardrails: body.activeGuardrails || [] };
		await putMode(updated);
		sseManager.emit("modes:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PATCH /api/modes/:id/agents
modesRouter.patch("/:id/agents", async (req, res) => {
	try {
		const existing = await getMode(req.params.id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Mode not found" });
			return;
		}
		const body = req.body as { allowedAgents: string[] };
		const updated: IMode = { ...existing, allowedAgents: body.allowedAgents || [] };
		await putMode(updated);
		sseManager.emit("modes:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});
