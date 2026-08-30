import type { INotificationCreatePayload, INotificationUpdatePayload } from "@warpcore/shared";
import { Router } from "express";
import { broadcaster, persistence, subthreadService } from "../index";

export const notificationsRouter = Router();

// GET /api/chat/notifications/:threadId
// Default: exclude consumed AND hidden.
// ?consumed=true includes consumed. ?hidden=true includes hidden.
notificationsRouter.get("/:threadId", async (req, res) => {
	try {
		const threadId = req.params.threadId;
		const consumedParam = req.query.consumed as string | undefined;
		const hiddenParam = req.query.hidden as string | undefined;
		const includeConsumed = consumedParam === "true";
		const includeHidden = hiddenParam === "true";
		const notifications = await persistence.notificationList(
			threadId,
			includeConsumed,
			includeHidden,
		);
		res.json({ ok: true, data: notifications, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// GET /api/chat/notifications/:threadId/:id
notificationsRouter.get("/:threadId/:id", async (req, res) => {
	try {
		const notification = await persistence.notificationGet(req.params.id);
		if (!notification) {
			res.status(404).json({ ok: false, data: null, error: "Notification not found" });
			return;
		}
		res.json({ ok: true, data: notification, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/chat/notifications
notificationsRouter.post("/", async (req, res) => {
	try {
		const payload = req.body as INotificationCreatePayload;
		if (!payload.threadId || !payload.notificationType) {
			res.status(400).json({
				ok: false,
				data: null,
				error: "threadId and notificationType are required",
			});
			return;
		}
		const notification = await persistence.notificationCreate(payload);
		broadcaster.emit({ type: "notification.created", notification });
		res.json({ ok: true, data: notification, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// PATCH /api/chat/notifications/:threadId/:id/payload
notificationsRouter.patch("/:threadId/:id/payload", async (req, res) => {
	try {
		const payload = req.body as INotificationUpdatePayload;
		const notification = await persistence.notificationUpdatePayload(req.params.id, payload);
		broadcaster.emit({ type: "notification.updated", notification });
		res.json({ ok: true, data: notification, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/chat/notifications/:threadId/consume
// Consume a batch of subthread-originated notifications (the superthread's
// inbox). Combines them per sender into USER messages and triggers inference
// on the last one. Body: { ids: string[], headMessageId: string | null }
notificationsRouter.post("/:threadId/consume", async (req, res) => {
	try {
		const threadId = req.params.threadId;
		const { ids, headMessageId } = req.body as { ids: string[]; headMessageId: string | null };
		if (!Array.isArray(ids) || ids.length === 0) {
			res.status(400).json({ ok: false, data: null, error: "ids array is required" });
			return;
		}
		const result = await subthreadService.consumeSubthreadMessages(
			threadId,
			ids,
			headMessageId ?? null,
		);
		if (!result.ok) {
			res.status(409).json({ ok: false, data: null, error: result.error });
			return;
		}
		res.json({ ok: true, data: result.data, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/chat/notifications/:threadId/background
// Background a waiting subthread tool call — resolves the pending wait with backgrounded: true
notificationsRouter.post("/:threadId/background", async (req, res) => {
	try {
		const threadId = req.params.threadId;
		subthreadService.backgroundSubthread(threadId);
		res.json({ ok: true, data: { threadId }, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/chat/notifications/:threadId/:id/consume
notificationsRouter.post("/:threadId/:id/consume", async (req, res) => {
	try {
		const notification = await persistence.notificationConsume(req.params.id);
		broadcaster.emit({ type: "notification.updated", notification });
		res.json({ ok: true, data: notification, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// POST /api/chat/notifications/:threadId/:id/hide
notificationsRouter.post("/:threadId/:id/hide", async (req, res) => {
	try {
		const notification = await persistence.notificationHide(req.params.id);
		broadcaster.emit({ type: "notification.updated", notification });
		res.json({ ok: true, data: notification, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});

// DELETE /api/chat/notifications/:threadId/:id
notificationsRouter.delete("/:threadId/:id", async (req, res) => {
	try {
		await persistence.notificationDelete(req.params.id);
		res.json({ ok: true, data: null, error: null });
	} catch (err) {
		res.status(500).json({ ok: false, data: null, error: String(err) });
	}
});
