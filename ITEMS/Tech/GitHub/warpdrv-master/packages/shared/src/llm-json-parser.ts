import { parse as bestEffortParse } from "best-effort-json-parser";
import { jsonrepair } from "jsonrepair";

type TJsonContainer = Record<string, unknown> | Array<unknown>;
type TParseMode = "any" | "object" | "array";

interface IParseOptions {
	mode?: TParseMode;
	// in array mode, wraps a lone object result into a single-element array
	wrapSingle?: boolean;
}

// matches ```lang\n ... ``` and also an unterminated trailing fence
const FENCE_RE = /```[a-zA-Z0-9_+-]*[ \t]*\r?\n?([\s\S]*?)(?:```|$)/g;

function isContainer(value: unknown): value is TJsonContainer {
	return typeof value === "object" && value !== null;
}

function matchesMode(value: TJsonContainer, mode: TParseMode): boolean {
	if (mode === "array") return Array.isArray(value);
	if (mode === "object") return !Array.isArray(value);
	return true;
}

// index of the first { or [, whichever comes first
function firstStructuralIdx(input: string): number {
	const objIdx = input.indexOf("{");
	const arrIdx = input.indexOf("[");
	if (objIdx === -1) return arrIdx;
	if (arrIdx === -1) return objIdx;
	return Math.min(objIdx, arrIdx);
}

// drops any postamble after the last closing bracket
function trimToLastCloser(input: string): string {
	const endIdx = Math.max(input.lastIndexOf("}"), input.lastIndexOf("]"));
	if (endIdx === -1) return input;
	return input.substring(0, endIdx + 1);
}

function buildCandidates(raw: string): Array<string> {
	const candidates: Array<string> = [];
	const push = (value: string | null): void => {
		if (!value) return;
		const trimmed = value.trim();
		if (!trimmed) return;
		if (candidates.indexOf(trimmed) !== -1) return;
		candidates.push(trimmed);
	};

	// fenced blocks are the strongest signal, so they are tried first
	for (const match of raw.matchAll(FENCE_RE)) {
		const inner = match[1];
		if (!inner) continue;
		const innerIdx = firstStructuralIdx(inner);
		if (innerIdx === -1) continue;
		push(trimToLastCloser(inner.substring(innerIdx)));
	}

	const startIdx = firstStructuralIdx(raw);
	if (startIdx !== -1) {
		const sliced = raw.substring(startIdx);
		// complete payload with preamble and postamble removed
		push(trimToLastCloser(sliced));
		// truncated payload, tail kept for the best-effort pass
		push(sliced);
	}

	push(raw);
	return candidates;
}

function attempt(candidate: string): TJsonContainer | null {
	try {
		const value = JSON.parse(candidate);
		if (isContainer(value)) return value;
	} catch {
		// falls through to repair
	}
	try {
		// handles single quotes, unquoted keys, trailing commas, comments
		const value = JSON.parse(jsonrepair(candidate));
		if (isContainer(value)) return value;
	} catch {
		// falls through to best-effort
	}
	try {
		// last resort for truncated or streaming-cut payloads
		const value = bestEffortParse(candidate);
		if (isContainer(value)) return value;
	} catch {
		// candidate is unusable
	}
	return null;
}

export function parseMessyLLMOutput(
	rawInput: unknown,
	options: IParseOptions = {},
): TJsonContainer | null {
	const mode: TParseMode = options.mode ?? "any";
	const wrapSingle: boolean = options.wrapSingle ?? true;

	if (typeof rawInput !== "string") return null;
	const trimmed = rawInput.trim();
	if (!trimmed) return null;

	let fallback: Record<string, unknown> | null = null;
	const candidates = buildCandidates(trimmed);

	for (const candidate of candidates) {
		const result = attempt(candidate);
		if (!result) continue;
		if (matchesMode(result, mode)) return result;
		// object found while an array was requested, held in case a real array appears later
		if (mode === "array" && wrapSingle && !Array.isArray(result) && !fallback) {
			fallback = result as Record<string, unknown>;
		}
	}

	if (fallback) return [fallback];
	return null;
}

export function parseMessyLLMArray(
	rawInput: unknown,
	wrapSingle: boolean = true,
): Array<unknown> | null {
	const result = parseMessyLLMOutput(rawInput, { mode: "array", wrapSingle });
	if (!Array.isArray(result)) return null;
	return result;
}
