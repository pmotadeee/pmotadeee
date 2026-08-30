import type { IPersistence } from "@warpcore/bridge/types/interfaces";
import type { TThreadId } from "@warpcore/bridge/types";

export class ThreadStatusLineManager {
	constructor(private persistence: IPersistence) {}

	async setCurrentStatus(
		threadId: TThreadId,
		status: string,
	): Promise<{ currentStatus: string }> {
		await this.persistence.updateThreadState(threadId, { currentStatus: status });
		return { currentStatus: status };
	}
}
