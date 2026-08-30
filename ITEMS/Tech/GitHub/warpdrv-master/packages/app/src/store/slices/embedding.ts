import { configureEmbedding } from "@/api/mcpServices";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface EmbeddingSlice {
	selectedEmbeddingServerId: string | null;
	setSelectedEmbeddingServerId: (id: string | null) => void;
}

export const embeddingSlice = (
	setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	selectedEmbeddingServerId: null,
	setSelectedEmbeddingServerId: (id) => {
		setState((draft) => {
			draft.selectedEmbeddingServerId = id;
			if (id) {
				configureEmbedding(id).catch(console.error);
			}
		});
	},
});
