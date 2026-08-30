// ============================================================
// warpbridge/src/server.ts
// Backend entry point — exports everything.
// ============================================================

// sse broadcaster
export { SseBroadcaster } from "./broadcaster/sseBroadcaster";
// MCP (Node only)
export { McpClientManager } from "./mcp/client";
export { McpConfig } from "./mcp/config";
// Orchestrator (Node only)
export {
	type IOrchestratorConfig,
	type IPureCompletionResult,
	Orchestrator,
	type TPureCompletionChunkHandler,
} from "./orchestrator";
// Parser (universal)
export * from "./parser";
// Permissions (universal)
export { PermissionManager } from "./permissions";
export type { IBetterSqlitePersistenceOptions } from "./persistence/betterSqlite";
// Persistence (Node only)
export { SqlitePersistence } from "./persistence/betterSqlite";
export { SqlitePersistenceWithBroadcast } from "./persistence/sqliteBroadcast";
// Store (universal)
export { createChatStoreSlice, type IChatStoreState, type ImmerGet, type ImmerSet } from "./store";
// Types
export * from "./types";
export type { IBridgeBroadcaster } from "./types/interfaces";
export * from "./types/interfaces";
// Validation (universal)
export { cleanSchema, isSafePath, validateToolArgs } from "./validation";
