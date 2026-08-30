import type { INotification } from "@warpcore/shared";
import type { TThreadId } from "@warpcore/bridge";
import type { ImmerGet, ImmerSet } from "../types";
import type { AppState } from "../types";

interface NotificationsSlice {
	notificationsByThread: Record<TThreadId, Record<string, INotification>>;
	applyNotificationCreated: (notification: INotification) => void;
	applyNotificationUpdated: (notification: INotification) => void;
	seedThreadNotifications: (threadId: TThreadId, notifications: INotification[]) => void;
}

export const notificationsSlice = (
	setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	notificationsByThread: {},
	applyNotificationCreated: (notification: INotification) =>
		setState((state) => {
			const threadNotifs = state.notificationsByThread[notification.threadId] ?? {};
			threadNotifs[notification.id] = notification;
			state.notificationsByThread[notification.threadId] = threadNotifs;
		}),
	applyNotificationUpdated: (notification: INotification) =>
		setState((state) => {
			const threadNotifs = state.notificationsByThread[notification.threadId];
			if (!threadNotifs) return;
			// If notification is consumed or hidden, remove it from the store
			if (notification.consumed || notification.hidden) {
				delete threadNotifs[notification.id];
			} else {
				threadNotifs[notification.id] = notification;
			}
		}),
	seedThreadNotifications: (threadId: TThreadId, notifications: INotification[]) =>
		setState((state) => {
			const threadNotifs: Record<string, INotification> = {};
			for (const n of notifications) {
				threadNotifs[n.id] = n;
			}
			state.notificationsByThread[threadId] = threadNotifs;
		}),
});
