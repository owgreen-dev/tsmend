# tsmend has moved

`@shipispec/tsmend` has been folded into [`@shipispec/tsfix`](https://github.com/owgreen-dev/tsfix).

The original plan (per [tsfix roadmap decision D3](https://github.com/owgreen-dev/tsfix/blob/main/tsc-defense-roadmap.md#decisions-resolved)) was for tsmend to ship as a sister package: tsfix would handle Layer 0/1 (deterministic LSP auto-fix), tsmend would handle Layer 2+ (LLM-driven repair). D3 was reversed on 2026-05-14 — the sister package proved to be pre-publish (`private: true`) and had no independent consumers, so folding it in eliminated a release-coordination tax that wasn't paying for itself.

This repo was archived before tsmend was ever published to npm.

## Where the code lives now

| Was here | Is now |
|---|---|
| `src/typeContext.ts` | [`@shipispec/tsfix` `src/typeContext.ts`](https://github.com/owgreen-dev/tsfix/blob/main/src/typeContext.ts) |
| `src/mendAgent.ts` | [`@shipispec/tsfix` `src/mendAgent.ts`](https://github.com/owgreen-dev/tsfix/blob/main/src/mendAgent.ts) |
| `src/applyEditBlock.ts` | [`@shipispec/tsfix` `src/applyEditBlock.ts`](https://github.com/owgreen-dev/tsfix/blob/main/src/applyEditBlock.ts) |
| `src/runMendLoop.ts` | [`@shipispec/tsfix` `src/runMendLoop.ts`](https://github.com/owgreen-dev/tsfix/blob/main/src/runMendLoop.ts) |
| `fixtures/` (35 Layer-2 fixtures) | [`@shipispec/tsfix` `fixtures/`](https://github.com/owgreen-dev/tsfix/tree/main/fixtures) (mixed with the 14 Layer-0 fixtures) |
| `scripts/generate-fixtures.mjs` + `scripts/lib/mutators/` + `seeds/` | [`@shipispec/tsfix` `scripts/`](https://github.com/owgreen-dev/tsfix/tree/main/scripts) + `seeds/` |
| `benchmark/run-benchmark.ts` | [`@shipispec/tsfix` `benchmark/run-llm-benchmark.ts`](https://github.com/owgreen-dev/tsfix/blob/main/benchmark/run-llm-benchmark.ts) (renamed to disambiguate from the Layer-0 benchmark) |

All 9 of this repo's commits were preserved in tsfix's history via `git merge --allow-unrelated-histories` — search the [tsfix commit log](https://github.com/owgreen-dev/tsfix/commits/main) for "ts-morph fixture engine", "runMendLoop", "mendSingleFile", "applyEditBlock", "getTypeContext", etc.

## Install

```bash
npm install @shipispec/tsfix
```

## API mapping

```ts
// Was:
import { runMendLoop, mendSingleFile, getTypeContext } from "@shipispec/tsmend";

// Now:
import { runMendLoop, mendSingleFile, getTypeContext } from "@shipispec/tsfix";
```

The function signatures, option shapes, and result shapes are unchanged. The contract types (`MendContext`, `LayerEvent`, `Diagnostic`) were always exported from `@shipispec/tsfix` (since v0.3.0), so consumers already importing them from there see no change.

## Why archive, not delete

Archived (read-only) instead of deleted so:
- Old links keep resolving.
- The 9 commits of provenance — the seed mutators, the editblock parser, the prompt-design iterations — stay browsable for anyone interested in the development history.
- npm registry references to `@shipispec/tsmend` (none in production, but possible in WIP forks) lead somewhere informative instead of 404.
