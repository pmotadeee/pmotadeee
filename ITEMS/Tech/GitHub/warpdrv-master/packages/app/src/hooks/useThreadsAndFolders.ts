import type { IChatThread as IBridgeChatThread, IFolder as IChatFolder } from "@warpcore/bridge";
import { useCallback, useMemo } from "react";
import { createFolder, deleteFolder, fetchFolders, updateFolder } from "@/api/services";
import { useStore } from "@/store";

// Extend bridge thread type with computed fields from API
interface IChatThread extends IBridgeChatThread {
	messageCount?: number;
	totalTokens?: number;
	starred?: boolean;
}

// ============================================================
// Hooks
// ============================================================
export function useThreadsAndFolders() {
	// Select the Record directly (stable reference), convert to array in a memo
	const threadsRecord = useStore((s) => s.threads);
	const threads = useMemo(() => Object.values(threadsRecord) as IChatThread[], [threadsRecord]);
	const setCurrentThreadId = useStore((s) => s.setCurrentThreadId);
	const setThreads = useStore((s) => s.setThreads);
	const folders = useStore((s) => s.folders);
	const setFolders = useStore((s) => s.setFolders);

	const patchThread = useCallback(async (id: string, patch: Partial<IChatThread>) => {
		const res = await fetch(`/api/chat/threads/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		});
		// SSE will update store via applyThreadUpdated
		return res;
	}, []);

	const removeThread = useCallback(
		async (id: string) => {
			await fetch(`/api/chat/threads/${id}`, { method: "DELETE" });
			const next: Record<string, IChatThread> = {};
			let changed = false;
			for (const [k, v] of Object.entries(threads)) {
				if (k !== id) {
					next[k] = v;
				} else {
					changed = true;
				}
			}
			// Only update if thread actually existed
			if (changed) setThreads(next);
		},
		[threads],
	);

	const removeAllThreads = useCallback(async () => {
		if (threads.length === 0) return;
		for (const t of threads) {
			await fetch(`/api/chat/threads/${t.id}`, { method: "DELETE" });
		}
		setThreads({} as Record<string, IChatThread>);
	}, [threads]);

	const addFolder = useCallback(
		async (name: string) => {
			const res = await createFolder(name);
			if (res.ok) setFolders([...folders, res.data]);
		},
		[folders],
	);

	const patchFolder = useCallback(
		async (id: string, patch: Partial<IChatFolder>) => {
			await updateFolder(id, patch);
			setFolders(folders.map((f) => (f.id === id ? { ...f, ...patch } : f)));
		},
		[folders],
	);

	const removeFolder = useCallback(
		async (id: string) => {
			await deleteFolder(id);
			setFolders(folders.filter((f) => f.id !== id));
			// Move threads from this folder to root
			const threadsRecord: Record<string, IChatThread> = {};
			let changed = false;
			for (const t of threads) {
				if (t.folderId === id) {
					threadsRecord[t.id] = { ...t, folderId: null };
					changed = true;
				} else {
					threadsRecord[t.id] = t;
				}
			}
			// Only update if threads were actually moved
			if (changed) setThreads(threadsRecord);
		},
		[folders, threads],
	);

	const refreshFolders = useCallback(async () => {
		const fRes = await fetchFolders();
		if (fRes.ok) setFolders(fRes.data);
	}, []);

	return {
		threads,
		folders,
		patchThread,
		removeThread,
		removeAllThreads,
		addFolder,
		patchFolder,
		removeFolder,
		refreshFolders,
		setCurrentThreadId,
	};
}
