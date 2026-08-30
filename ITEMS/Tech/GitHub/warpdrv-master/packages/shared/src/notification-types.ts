// ============================================================
// warpcore/shared/src/notification-types.ts
// Notification types — part of the chat/thread domain.
// ============================================================

export interface INotification {
	id: string; // n_ prefix
	threadId: string;
	notificationType: string;
	notificationSubtype: string;
	senderType: string;
	senderId: string;
	payload: Record<string, unknown>;
	consumed: boolean;
	hidden: boolean;
	createdAt: number;
}

export interface INotificationCreatePayload {
	threadId: string;
	notificationType: string;
	notificationSubtype?: string;
	senderType?: string;
	senderId?: string;
	payload?: Record<string, unknown>;
}

export interface INotificationUpdatePayload {
	payload: Record<string, unknown>;
}
