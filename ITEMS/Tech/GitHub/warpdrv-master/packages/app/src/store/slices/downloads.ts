import type { IDownload, TDownloadId } from "@warpcore/shared";
import type { AppState, ImmerGet, ImmerSet } from "../types";

interface DownloadsSlice {
	downloads: Record<TDownloadId, IDownload>;
}

export const downloadsSlice = (
	_setState: ImmerSet<AppState>,
	_getState: ImmerGet<AppState>,
): Partial<AppState> => ({
	downloads: {},
});
