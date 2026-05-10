/**
 * @shipispec/tsmend — LLM-driven TypeScript error repair.
 *
 * Layer 2–4 companion to @shipispec/tsfix. Layer 2 (single-file LLM mend +
 * bounded retry loop) is the v0.1.0 surface; Layers 3–4 are deferred.
 *
 * The package re-exports the contract types from `@shipispec/tsfix` so
 * downstream consumers can import them from either package interchangeably.
 */

export type { MendContext, LayerEvent, Diagnostic } from "@shipispec/tsfix";

export { getTypeContext, resetTypeContextCache } from "./typeContext.js";
export type { TypeContextOptions, TypeContext } from "./typeContext.js";

export { parseEditBlocks, applySingleBlock, applyEditBlocks } from "./applyEditBlock.js";
export type {
	EditBlock,
	ApplyEditBlocksOptions,
	ApplyResult,
	SingleBlockResult,
} from "./applyEditBlock.js";

export { mendSingleFile } from "./mendAgent.js";
export type { MendSingleFileOptions, MendSingleFileResult, LLMCall } from "./mendAgent.js";

export { runMendLoop } from "./runMendLoop.js";
export type {
	RunMendLoopOptions,
	RunMendLoopResult,
	MendLoopIteration,
	StopReason,
} from "./runMendLoop.js";
