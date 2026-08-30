// ============================================================
// Shared registry of in-flight inference AbortControllers, keyed
// by thread id. Both the chat routes (superthread completions /
// tool-call resumes) and the SubthreadService (server-started
// subthread inferences) register here so that a single cancel
// endpoint can stop any in-flight inference regardless of who
// started it.
// ============================================================

const controllers = new Map<string, AbortController>();

/**
 * Register a controller for a thread, aborting any previous
 * in-flight inference for the same thread.
 */
export function registerAbort(threadId: string, controller: AbortController): void {
	const previous = controllers.get(threadId);
	if (previous) previous.abort();
	controllers.set(threadId, controller);
}

/**
 * Abort the in-flight inference for a thread, if any.
 * Returns true if a controller was found and aborted.
 */
export function abortThread(threadId: string): boolean {
	const ac = controllers.get(threadId);
	if (!ac) return false;
	ac.abort();
	controllers.delete(threadId);
	return true;
}

/**
 * Remove a controller from the registry, but only if it is still
 * the registered one (identity check). This lets a caller clean up
 * in a .finally() without clobbering a newer controller that may
 * have replaced it.
 */
export function clearIfSame(threadId: string, controller: AbortController): void {
	if (controllers.get(threadId) === controller) {
		controllers.delete(threadId);
	}
}
