import type {
	IAccessToken,
	ICodeGraphIngestResult,
	ICodeGraphNode,
	ICodeGraphSearchOptions,
	ITodoItem,
} from "@warpcore/shared";
export interface IEmbeddingSearchResult {
	messageId: string;
	text: string;
	distance: number;
}
export interface ITodoResult {
	todos: ITodoItem[];
	etag: string | null;
}
export interface ISubThreadInfo {
	threadId: string;
	title: string;
	pendingMessages: number;
}
export interface ISubthreadResponse {
	threadId: string;
	response?: string;
	backgrounded?: boolean;
	timedOut?: boolean;
}
export interface IWarpmcpDeps {
	isRemote: (req: { ip: string; connection: { remoteAddress: string } }) => boolean;
	validateBearerToken: (authHeader: string | undefined) => Promise<IAccessToken | null>;
	getFsAllowedRoots: () => string[];
	embeddingSearch?: (
		query: string,
		topK: number,
		topic: string,
	) => Promise<IEmbeddingSearchResult[]>;
	todoRead?: (threadId: string) => Promise<ITodoResult>;
	todoAdd?: (threadId: string, todo: ITodoItem, index?: number) => Promise<ITodoItem[]>;
	todoRemove?: (threadId: string, index: number) => Promise<ITodoItem[]>;
	todoUpdate?: (
		threadId: string,
		index: number,
		status: ITodoItem["status"],
	) => Promise<ITodoItem[]>;
	todoClear?: (threadId: string) => Promise<ITodoItem[]>;
	todoWrite?: (threadId: string, todos: ITodoItem[], etag?: string) => Promise<ITodoResult>;
	// getProjectRoot?: (threadId: string) => Promise<string | null>;
	onFileWritten?: (path: string) => Promise<void>;
	codeGraphIngest?: (projectRoot: string, force?: boolean) => Promise<ICodeGraphIngestResult>;
	codeGraphSearch?: (
		projectRoot: string,
		query: string,
		options?: ICodeGraphSearchOptions,
	) => Promise<ICodeGraphNode[]>;
	codeGraphGetSymbol?: (projectRoot: string, symbolId: string) => Promise<ICodeGraphNode | null>;
	codeGraphGetCallers?: (
		projectRoot: string,
		symbolId: string,
		depth?: number,
	) => Promise<ICodeGraphNode[]>;
	codeGraphGetCallees?: (
		projectRoot: string,
		symbolId: string,
		depth?: number,
	) => Promise<ICodeGraphNode[]>;
	codeGraphListFile?: (projectRoot: string, filePath: string) => Promise<ICodeGraphNode[]>;
	codeGraphClear?: (projectRoot: string) => Promise<void>;
	chatSearch?: (
		query: string,
		threadId: string,
		limit: number,
		page: number,
	) => Promise<{
		results: Array<{ messageId: string; snippet: string }>;
		page: number;
		limit: number;
		hasMore: boolean;
	}>;
	chatGetMessage?: (
		messageId: string,
	) => Promise<{ messageId: string; role: string; content: string } | null>;
	listSubthreads?: (threadId: string) => Promise<ISubThreadInfo[]>;
	createSubthread?: (
		threadId: string,
		agentName: string,
		message: string,
		title: string,
		background?: boolean,
	) => Promise<ISubthreadResponse>;
	sendToSubthread?: (
		parentThreadId: string,
		targetSubThreadId: string,
		message: string,
		background?: boolean,
	) => Promise<ISubthreadResponse>;
	sendToSuperthread?: (
		currentThreadId: string,
		message: string,
	) => Promise<{ notificationId: string; threadId: string }>;
	setCurrentStatus?: (threadId: string, status: string) => Promise<{ currentStatus: string }>;
}
export interface IStartArgs extends IWarpmcpDeps {
	port: number;
	exposeExternal: boolean;
}
export interface IStartResult {
	port: number;
	bindHost: string;
}
