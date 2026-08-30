import type {
	IGuardrailCreatePayload,
	IGuardrailDefinition,
	IToolAttachment,
} from "@warpcore/shared";
import { Router } from "express";
import { nanoid } from "nanoid";
import { persistence } from "../index";
import { sseManager } from "../services/sseManagerInstance";

export const guardrailsRouter = Router();

// GET /api/guardrails
guardrailsRouter.get("/", async (_req, res) => {
	try {
		const guardrails = await persistence.listGuardrails();
		const result: Record<string, IGuardrailDefinition> = {};
		for (const [id, g] of Object.entries(guardrails)) {
			result[id] = {
				id: g.id,
				name: g.name,
				serverId: g.serverId,
				prompt: g.prompt,
				triggerOnTools: g.triggerOnTools as IToolAttachment[],
				inferenceParams: g.inferenceParams,
				messagesCount: g.messagesCount,
				includeBaseMessage: g.includeBaseMessage,
			};
		}
		res.json({ ok: true, data: result, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/guardrails
guardrailsRouter.post("/", async (req, res) => {
	try {
		const body = req.body as IGuardrailCreatePayload;
		const guardrail: IGuardrailDefinition = {
			id: nanoid(),
			name: body.name,
			serverId: body.serverId,
			promptId: body.promptId || undefined,
			prompt: body.prompt,
			triggerOnTools: body.triggerOnTools || [],
			inferenceParams: body.inferenceParams || {},
			messagesCount: body.messagesCount ?? 0,
			includeBaseMessage: body.includeBaseMessage ?? false,
		};
		await persistence.upsertGuardrail(guardrail);
		sseManager.emit("guardrails:update", guardrail);
		res.json({ ok: true, data: guardrail, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PUT /api/guardrails/:id
guardrailsRouter.put("/:id", async (req, res) => {
	try {
		const body = req.body as Partial<IGuardrailDefinition>;
		const id = decodeURIComponent(req.params.id);
		const existing = (await persistence.listGuardrails())[id];
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Guardrail not found" });
			return;
		}
		const updated: IGuardrailDefinition = {
			...existing,
			...(body.serverId !== undefined && { serverId: body.serverId }),
			...(body.promptId !== undefined && { promptId: body.promptId }),
			...(body.prompt !== undefined && { prompt: body.prompt }),
			...(body.triggerOnTools !== undefined && { triggerOnTools: body.triggerOnTools }),
			...(body.inferenceParams !== undefined && { inferenceParams: body.inferenceParams }),
			...(body.messagesCount !== undefined && { messagesCount: body.messagesCount }),
			...(body.includeBaseMessage !== undefined && {
				includeBaseMessage: body.includeBaseMessage,
			}),
		};
		await persistence.upsertGuardrail(updated);
		sseManager.emit("guardrails:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// DELETE /api/guardrails/:id
guardrailsRouter.delete("/:id", async (req, res) => {
	try {
		const id = decodeURIComponent(req.params.id);
		const existing = (await persistence.listGuardrails())[id];
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Guardrail not found" });
			return;
		}
		await persistence.deleteGuardrail(id);
		sseManager.emit("guardrails:delete", { id });
		res.json({ ok: true, data: null, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});
