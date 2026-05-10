# Changelog

All notable changes to `@shipispec/tsmend` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Pre-release. Not yet on npm — `package.json` is `"private": true` until the v0.1.0 surface stabilizes.

### Public API (Layer 2 — single-file LLM mend)
- **`getTypeContext(opts)`** — TS Language Service helper. Resolves an error site to its declaring type via `getTypeAtLocation()` + `getDeclarations()`, slices ±3 lines around the error site and ±20 lines around the declaration. Bounded walk-up (4 hops) plus a special case for `PropertyAccessExpression` so TS2339 errors resolve to the *receiver's* type, not the non-existent property's. The architectural moat — no other OSS tool does this for TypeScript specifically.
- **`mendSingleFile(opts)`** — single-LLM repair via Vercel AI SDK + `@ai-sdk/anthropic`. Uses top-level `system:` parameter (v6 pattern), markdown-headered file delimiters in the prompt (XML wrappers caused Claude to mirror them in output and break the parser). Returns `rawResponse`, parsed `blocks`, `apply` result, token counts, latency.
- **`applySingleBlock(content, search, replace)`** + **`applyEditBlocks(opts)`** + **`parseEditBlocks(text)`** — Aider-style `editblock` parser and 3-tier fuzzy applier (exact → rstrip → strip). Defensive parser handles `<file path="…">` wrappers Claude emits when the system prompt uses XML markers. Abstains on ambiguous matches (multiple hits) rather than guess.
- **`runMendLoop(opts)`** — bounded retry (default 3 iterations) with no-progress / regression detection via error-signature-set comparison. Streams per-iteration data: `patchesApplied`, `patchesFailed`, `inputTokens`, `outputTokens`, `latencyMs`, `rawResponse`. Stop reasons: `noErrors`, `fixed`, `noProgress`, `regressed`, `maxIterations`.
- Re-exports `MendContext`, `LayerEvent`, `Diagnostic` from `@shipispec/tsfix` so consumers can import contract types from either package.

### Fixtures (Layer 0 cannot fix, Layer 2 should fix)
- **3 hand-authored minimal fixtures** — single-error, single-file: `mend-ts2339-property-typo`, `mend-ts7006-implicit-any`, `mend-ts2741-missing-prop`. Validate the basic mend mechanics.
- **2 hand-authored realistic fixtures** — `realistic-multi-error-user-helpers` (3 errors, 1 file, `taskDescription` populated), `realistic-rename-ripple` (2 errors, 2 files — exercises the iteration loop across files).
- **30 auto-generated fixtures** via `scripts/generate-fixtures.mjs` (ts-morph AST mutators across 3 codes × 3 seeds × 10 each). Total fixture corpus: **35**.

### Benchmark harness (`benchmark/run-benchmark.ts`, `npm run benchmark`)
- Iterates all `fixtures/<name>/` directories with an `expected.json`. For each: snapshot files → build `MendContext` (merging optional fields from `expected.json#mendContext`) → run `runMendLoop` against Anthropic via Vercel AI SDK → compare to expected → restore snapshot.
- Per-fixture cost estimate (Haiku 4.5 pricing baked in: $0.80 input / $4.00 output per million tokens), iteration count, latency, pass/fail.
- Skips silently with exit 0 when `ANTHROPIC_API_KEY` is unset — keeps CI green until the secret is configured.

### Fixture-generation engine (`scripts/generate-fixtures.mjs`)
- ts-morph AST mutators that introduce one targeted error per fixture into a valid TypeScript seed file. Mutation strategy: text splice based on AST node positions (avoids ts-morph's `replaceWithText` which doesn't propagate reliably under `useInMemoryFileSystem`).
- Three mutators: `ts2339-property-not-exist` (rename property access to no-near-match), `ts7006-implicit-any` (strip parameter type annotation), `ts2741-missing-property` (delete required property from object literal whose contextual type has 2+ required props).
- Three seeds: `userCrud.ts`, `validators.ts`, `apiRouter.ts` (~30-50 lines each, common LLM-output shapes).
- Validation gate: every mutation runs through `runInProcessTsc` from tsfix to confirm exactly the expected error code fires, then through `runValidationLoop` to confirm Layer 0 abstains (otherwise the fixture isn't Layer 2 territory).
- Memory-bounded: shared ts-morph Project + shared validation tempDir + explicit cache resets between iterations. Without sharing, each mutation leaks ~160MB through tsfix's `programCache` and OOMs by ~50 attempts.
- CLI: `--code=TS2339`, `--count=10`, `--seed=userCrud.ts`, `--rng-seed=42` (deterministic), `VERBOSE=1` (rejection reasons), `KEEP_SHARED_DIR=1` (debug).

### Tests
- **33 unit tests** across 4 files (`typeContext`, `applyEditBlock`, `mendAgent`, `runMendLoop`). Mocked LLM call via injectable `_callLLM` override — tests never hit the real API.
- **35 live LLM benchmark fixtures** (3 minimal + 2 realistic + 30 generated) — passing 35/35 against `claude-haiku-4-5` at total cost $0.036.

### CI (`.github/workflows/test.yml`)
- `actions/checkout@v5` + `actions/setup-node@v5`, Node 20, `rm -f package-lock.json && npm install` (npm bug 4828 workaround for rollup linux binding).
- Runs check-types + vitest + benchmark on every PR + main push. Benchmark skips cleanly when `ANTHROPIC_API_KEY` is absent.

### Performance signals (35-fixture run vs research-derived targets)

| Metric | Research target | Observed |
|---|---|---|
| Pass rate | ≥70% Haiku 4.5 (production floor) | **100%** (35/35) |
| Iter-1 success | ≥40% | **97%** (34/35) |
| Iter-3 fallback | ≤35% | **0%** |
| Cost / fixture | ≤$0.005 uncached | **$0.001 avg** |
| Latency / fixture | P95 ≤25s | ~1.5s |

Caveat: generated fixtures are similar shapes (single-error, mutated from 3 seeds). Real-world diversity will dent these numbers. Continuing to expand the fixture corpus to 100+ across 10 error codes will give a more honest baseline.

### Roadmap status

| Phase | Status |
|---|---|
| 2a — `MendContext`/`LayerEvent` types in `@shipispec/tsfix` v0.3.0 | ✅ shipped (npm) |
| 2b — Bootstrap repo | ✅ |
| 2c — `getTypeContext` (the moat) | ✅ |
| 2d — `mendSingleFile` (LLM call) | ✅ |
| 2e — `applyEditBlock` (parser + applier) | ✅ |
| 2f — `runMendLoop` (bounded retry) | ✅ |
| 2g — Fixtures (TS2339/TS7006/TS2741 + 2 realistic) | ✅ |
| 2h — CI green with benchmark step | ✅ |
| Day 1 engine — ts-morph mutators × 3, 30 fixtures generated | ✅ |
| Day 2 engine — TS2322, TS2345, TS2554, TS2532 mutators (target 70 fixtures) | pending |
| Day 3 engine — TS2304, TS2365, TS2551 mutators (target 100 fixtures) | pending |
| Day 4 engine — `p-limit(8)` parallelism + file-based response cache | pending |
| v0.1.0 publish gate (after 100 fixtures + ≥70% pass rate sustained) | pending |
| Layer 3 — multi-file mend via `findReferences()` | deferred to v0.2 |
| Layer 4 — stub-and-continue escape hatch | deferred to v0.3 |
| Real-failure fixture mining from spectoship2 | deferred until first production failure |

[Unreleased]: https://github.com/owgreen-dev/tsmend/compare/HEAD...HEAD
