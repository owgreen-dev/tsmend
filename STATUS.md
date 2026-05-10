# tsmend — Status

> Snapshot: 2026-05-10. Read alongside `README.md` (orientation), `CHANGELOG.md` (per-feature history).

## TL;DR

Pre-release. Layer 2 single-file LLM mend works end-to-end against Anthropic Haiku 4.5: 35/35 benchmark fixtures pass at $0.036 total ($0.001 avg per fixture). Hand-authored + auto-generated fixture corpus covers TS2339, TS7006, TS2741 across simple and realistic shapes. Next: scale fixtures to 100 across 10 error codes for an honest performance baseline before publishing v0.1.0.

`@shipispec/tsmend` is the LLM-driven Layer 2-4 companion to [`@shipispec/tsfix`](https://github.com/owgreen-dev/tsfix). It picks up the ~44% of TypeScript errors deterministic Layer 0/1 can't fix (TS2339, TS7006, TS2741, cross-file ripples, API drift).

---

## What works

### Public API
- `getTypeContext(opts)` — TS Language Service type-declaration injection. The architectural moat.
- `mendSingleFile(opts)` — Vercel AI SDK + Anthropic Haiku 4.5 LLM call.
- `applyEditBlocks(opts)` / `parseEditBlocks(text)` / `applySingleBlock(text, search, replace)` — SEARCH/REPLACE format with 3-tier fuzzy match.
- `runMendLoop(opts)` — bounded retry (default 3) with no-progress / regression detection.
- Type re-exports: `MendContext`, `LayerEvent`, `Diagnostic` from `@shipispec/tsfix`.

### Fixture corpus (35 total)
- **3 minimal** (`mend-ts2339-property-typo`, `mend-ts7006-implicit-any`, `mend-ts2741-missing-prop`) — single-error single-file.
- **2 realistic** (`realistic-multi-error-user-helpers` 3-error single-file with `taskDescription`, `realistic-rename-ripple` 2-file iteration test).
- **30 generated** via `npm run generate-fixtures` (ts-morph AST mutators across 3 codes × 3 seeds × 10 each).

### Benchmark
- `npm run benchmark` runs all fixtures against Anthropic. Per-fixture cost / iteration / latency. Skips cleanly without `ANTHROPIC_API_KEY`.
- `npm run generate-fixtures` produces fixtures deterministically (mulberry32 RNG with `--rng-seed`). Validates each mutation by running tsc + tsfix's Layer 0 and rejecting any that produce wrong errors or that Layer 0 already fixes.

### Tests + CI
- 33 unit tests (vitest, mocked LLM via injectable `_callLLM`).
- GitHub Actions: check-types + vitest + benchmark on every push.

### Performance signals (35-fixture run)

| Metric | Target | Observed |
|---|---|---|
| Pass rate | ≥70% (Haiku floor) | 100% |
| Iter-1 success | ≥40% | 97% |
| Cost / fixture | ≤$0.005 | $0.001 avg |
| Latency / fixture | P95 ≤25s | ~1.5s |

Caveat: 30 of 35 fixtures are single-error mutations of 3 seeds. Real-world diversity will lower the pass rate.

---

## What's planned

### Engine sprint (in flight)
- **Day 2** — 4 more mutators (TS2322, TS2345, TS2554, TS2532). Target: 70 generated fixtures.
- **Day 3** — 3 final mutators (TS2304, TS2365, TS2551 negative test). Target: 100 generated fixtures.
- **Day 4** — Harness improvements: `p-limit(8)` parallelism (~5 min for 100 fixtures vs ~50 min serial), file-based response cache (re-runs free).

After Day 4, run the full 100-fixture suite against Haiku 4.5 / Sonnet 4 / Opus 4.7 baseline. Publish on README as the first public TypeScript-compile-error-repair leaderboard.

### v0.1.0 publish gate
- 100 generated fixtures + ≥70% pass rate sustained on Haiku 4.5
- README + CHANGELOG public-facing rewrite (current README is internal-orientation)
- Flip `package.json#private` → false, `npm publish --access public`

### Deferred (v0.2+)
- **Layer 3** (multi-file mend via `ts.LanguageService.findReferences()`) — eliminates "fix one caller, break another" failure mode. Currently the loop iterates per file as a substitute.
- **Layer 4** (stub-and-continue escape hatch) — for errors no LLM can resolve.
- **`onLayerEvent` callback** wired through `runValidationLoop` in tsfix v0.4 — unified Layer 0/1/2 telemetry stream.
- **Real-failure fixture mining** from spectoship2 production runs — synthetic mutators predict you'll need a parser for `<file path="…">` wrappers; real failures will reveal a dozen more edge cases.
- **Prompt-cache breakpoint optimization** — Anthropic's 5-min ephemeral cache offers ~60% token reduction on repeat calls. Defer until benchmark data justifies the complexity.

---

## Current gaps

### Synthetic fixture diversity
30 of 35 fixtures come from 3 seeds. Mutators produce structurally similar errors (same shapes, same indentation, same property names). Real LLM output is noisier. Engine sprint Days 2-3 partially address by adding more error codes; full diversity needs LLM-driven synthesis (planned post-v0.1.0) or real-failure capture.

### TS2741 mutator only succeeds on apiRouter seed
The `ts2741-missing-property` mutator skipped 18 attempts on userCrud.ts and validators.ts to produce 10 successes — all from apiRouter.ts. Either the contextual-type detection in ts-morph misses some literal contexts, or those seeds genuinely don't have qualifying object literals. Worth investigating once Day 2 lands more error codes.

### No npm publish yet
`package.json#private: true`. v0.1.0 publish gate is "100 fixtures + ≥70% pass rate sustained". Until then, consumers can use via local file path or git URL only.

### Single-file-mend ceiling
`mendSingleFile` only processes `erroredFiles[0]` per LLM call. Multi-file errors converge through the loop iterating across files, but each iteration is one full LLM call per file. Layer 3 (deferred) collapses N file-edits into one call via `findReferences()`-driven blast-radius detection.
