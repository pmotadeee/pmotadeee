import type { IAgent, IAgentCreatePayload } from "@warpcore/shared";
import { genAgentId } from "@warpcore/shared";
import { Router } from "express";
import { persistence } from "../index";
import { sseManager } from "../services/sseManagerInstance";

export const agentsRouter = Router();

// GET /api/agents
agentsRouter.get("/", async (_req, res) => {
	try {
		const agents = await persistence.listAgents();
		res.json({ ok: true, data: agents, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// GET /api/agents/:id
agentsRouter.get("/:id", async (req, res) => {
	try {
		const agent = await persistence.getAgent(decodeURIComponent(req.params.id));
		if (!agent)
			return res.status(404).json({ ok: false, data: null, error: "Agent not found" });
		res.json({ ok: true, data: agent, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/agents
agentsRouter.post("/", async (req, res) => {
	try {
		const payload = req.body as IAgentCreatePayload;
		if (!payload.name?.trim()) {
			res.status(400).json({ ok: false, data: null, error: "Name is required" });
			return;
		}
		if (!payload.serverId) {
			res.status(400).json({ ok: false, data: null, error: "Server ID is required" });
			return;
		}

		const id = genAgentId();
		const now = Date.now();
		const agent: IAgent = {
			id,
			name: payload.name.trim(),
			serverId: payload.serverId,
			promptId: payload.promptId || undefined,
			tools: payload.tools || [],
			autoApproveTools: payload.autoApproveTools || [],
			description: payload.description || "",
			reasoningEffort: payload.reasoningEffort,
			guardrails: payload.guardrails || [],
			createdAt: now,
			updatedAt: now,
		};

		await persistence.createAgent(agent);
		sseManager.emit("agents:update", agent);
		res.status(201).json({ ok: true, data: agent, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PUT /api/agents/:id
agentsRouter.put("/:id", async (req, res) => {
	try {
		const id = decodeURIComponent(req.params.id);
		const existing = await persistence.getAgent(id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Agent not found" });
			return;
		}

		const body = req.body as Partial<IAgent>;
		await persistence.updateAgent(id, {
			name: body.name?.trim(),
			serverId: body.serverId,
			promptId: body.promptId,
			tools: body.tools,
			autoApproveTools: body.autoApproveTools,
			description: body.description,
			reasoningEffort: body.reasoningEffort,
			guardrails: body.guardrails,
		});

		const updated = await persistence.getAgent(id);
		if (!updated)
			return res
				.status(500)
				.json({ ok: false, data: null, error: "Agent disappeared after update" });

		sseManager.emit("agents:update", updated);
		res.json({ ok: true, data: updated, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// DELETE /api/agents/:id
agentsRouter.delete("/:id", async (req, res) => {
	try {
		const id = decodeURIComponent(req.params.id);
		const existing = await persistence.getAgent(id);
		if (!existing) {
			res.status(404).json({ ok: false, data: null, error: "Agent not found" });
			return;
		}
		await persistence.deleteAgent(id);
		sseManager.emit("agents:delete", { id });
		res.json({ ok: true, data: null, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});
