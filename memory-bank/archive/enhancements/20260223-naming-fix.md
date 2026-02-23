---
task_id: naming-fix
complexity_level: 3
date: 2026-02-23
status: completed
---

# TASK ARCHIVE: GlobalPrompt Name Field — Complete Implementation

## SUMMARY

Made `GlobalPrompt.name` a **required** field across the entire a16n plugin ecosystem, backed by a centralized `inferGlobalPromptName(sourcePath)` utility in `@a16njs/models`. Previously, emission plugins re-derived filenames from source paths at emit time — a fragile, duplicated pattern that broke for leading-dot filenames (`.cursorrules` was emitted as `rule.mdc` instead of `cursorrules.mdc`). After this work, all discovery plugins set `name` at discovery time, and all emission plugins consume `gp.name` directly with no re-derivation. A subsequent PR review cycle caught two additional bugs and produced further refinements, all addressed via TDD. The `a16n-plugin-cursorrules` package was then bumped to `@a16njs/models@0.11.0` (the published release containing these changes) and its PR updated.

## REQUIREMENTS

- Fix GitHub Issue #6: `.cursorrules` files discovered by `a16n-plugin-cursorrules` were being emitted to the wrong filename by downstream plugins (`rule.mdc` instead of `cursorrules.mdc`)
- Root cause fix, not a patch: the name must be set at discovery time and carried through the IR, not re-derived at emit time
- `GlobalPrompt.name` must be required (`string`, not `string | undefined`) so TypeScript enforces correctness at every construction site
- All discovery plugins must set `name` using the shared `inferGlobalPromptName` utility (or equivalent domain-specific logic)
- All emission plugins must use `gp.name` directly — no fallback derivation from `sourcePath` or `id`
- No `as any` casts anywhere in the a16n plugin codebase
- IR roundtrip must be lossless (name derives from IR filename, not frontmatter — no format change, no version bump)
- 25 `a16n-plugin-cursorrules` tests must pass against the published `@a16njs/models@0.11.0`

## IMPLEMENTATION

### Architecture: Discovery sets name, Emission uses name

The core insight: emission plugins should never need to know how to derive a name from a source path. That derivation belongs at discovery time, where the source path is known and the plugin has domain-specific context.

```
Discovery plugin                IR                     Emission plugin
─────────────────────────────────────────────────────────────────────
inferGlobalPromptName(path) ──► name on IR item ──────► gp.name ──► filename
(set once, at discovery)        (persisted as IR        (consumed
                                 filename, not           directly)
                                 frontmatter)
```

### `inferGlobalPromptName(sourcePath: string): string`

Added to `packages/models/src/helpers.ts` and exported from `packages/models/src/index.ts`.

Logic:
1. `path.basename(sourcePath)` — only the filename matters, not directory
2. If basename starts with `.` (leading-dot file): strip the dot, then strip any remaining extension
3. Otherwise: strip the last extension only
4. Fallback to `'global-prompt'` if result is empty (handles `''` or `'.'` inputs)

Key edge cases handled:
- `.cursorrules` → `cursorrules`
- `.cursorrules.md` → `cursorrules` (leading dot + double extension)
- `.cursorrules.txt` → `cursorrules`
- `CLAUDE.md` → `CLAUDE`
- `AGENTS.md` → `AGENTS`
- `my-rule.mdc` → `my-rule`
- `foo.bar.mdc` → `foo.bar` (multi-part stem: only last extension stripped)
- `README` → `README` (no extension: returned as-is)
- `''` / `'.'` → `'global-prompt'` (degenerate input fallback)

### `GlobalPrompt.name: string` (required)

Changed from `name?: string` in `packages/models/src/types.ts`. JSDoc updated to describe it as the canonical emission filename stem.

### Changes per plugin (a16n monorepo)

**plugin-a16n (`packages/plugin-a16n/`)**
- `src/parse.ts`: GlobalPrompt case in `parseIRFile` — added `name: nameWithoutExt` (already computed from the IR filename; just needed to be assigned)
- `src/emit.ts`: simplified GlobalPrompt branch from `isGlobalPrompt(item) && item.name` to `isGlobalPrompt(item)` — the guard is unnecessary now that `name` is always present

**plugin-cursor (`packages/plugin-cursor/`)**
- `src/discover.ts`: `classifyRule()` — added `name: inferGlobalPromptName(sourcePath)` to the GlobalPrompt branch
- `src/emit.ts`: GlobalPrompt loop — replaced `sanitizeFilename(gp.name)` (which incorrectly strips extensions, breaking multi-part stems) with inline dot-to-hyphen normalization: `gp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rule'`; updated `sanitizeFilename` JSDoc to clarify it expects full source paths, not pre-derived stems

**plugin-claude (`packages/plugin-claude/`)**
- `src/discover.ts`: two discovery sites (CLAUDE.md scan, `.claude/rules/` scan) — added `name: inferGlobalPromptName(normalizedPath)` with `as GlobalPrompt` cast (required because TypeScript's excess property checking doesn't narrow object literals pushed to union-typed arrays)
- `src/emit.ts`: added `sanitizeName(name: string)` helper that normalizes chars without calling `path.basename` or stripping extensions; replaced `sanitizeFilename(gp.name)` with `sanitizeName(gp.name)` in the GlobalPrompt loop

### Changes in a16n-plugin-cursorrules

- `src/discover.ts`: replaced `name: 'cursorrules', } as any` with `name: inferGlobalPromptName(entry.name),`; removed `as any` cast; imported `inferGlobalPromptName` from `@a16njs/models`
- `package.json`: peer + dev dep bumped from `^0.10.x` to `^0.11.0`; lock file updated from local `file:../a16n/packages/models` to published npm package

### IR format: unchanged, no version bump

`GlobalPrompt.name` is stored as the IR **filename** (e.g., `.a16n/global-prompt/cursorrules.md`), not as a frontmatter field. The on-disk format is identical before and after. No IR version bump was required.

### PR feedback cycle (post-QA)

After the initial build passed niko-qa (849 tests green), a PR review surfaced 8 findings addressed in a separate commit:

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | Blocking | `inferGlobalPromptName('')`/`'.'` returns `''` | Added `\|\| 'global-prompt'` fallback |
| 2 | Blocking | `sanitizeFilename(gp.name)` in cursor strips multi-part stems (`'react.hooks'` → `'react'`) | Inline dot-to-hyphen in GlobalPrompt loop |
| 3 | Blocking | Same bug in claude emit | New `sanitizeName` helper |
| 4 | Medium | `GlobalPrompt` fixture in `types.test.ts` missing `version` | Added `version: CURRENT_IR_VERSION` |
| 5 | Nitpick | Missing test for extension-less basename in helpers | Added `'README'` → `'README'` case |
| 6 | Nitpick | Misleading test description in plugin-a16n emit.test.ts | "from item IDs" → "from item name" |
| 7 | Nitpick | Name test misplaced in error-handling describe in parse.test.ts | Moved to GlobalPrompt describe |
| 8 | Nitpick | `sanitizeFilename` JSDoc/naming misleading | JSDoc clarified |

All 8 addressed via TDD for the blocking bugs (new failing tests first, then fixes), then full suite green.

## TESTING

- **niko-qa** passed after the main 6-phase build: 849 tests across all a16n monorepo packages
- **PR feedback TDD**: new failing tests added for each blocking bug before fixing; all confirmed to fail then pass
- **Final monorepo suite**: all packages pass after PR feedback fixes
- **a16n-plugin-cursorrules**: 25 tests pass against published `@a16njs/models@0.11.0` (resolved from npm, not local `file:` path)
- **Scope reassessment**: operator challenged whether the architecture was fundamentally correct post-QA; analysis confirmed the approach doesn't block future enhancements (Claude plugin CLAUDE.md optimization, subdirectory GlobalPrompts with `paths:` frontmatter)
- **IR versioning**: confirmed no version bump needed — `name` is not in IR frontmatter

## LESSONS LEARNED

- **`sanitizeFilename(pre-derived-stem)` is a category error.** `sanitizeFilename` calls `path.basename` and strips the last extension — it's designed for source paths. Passing a clean stem like `'react.hooks'` causes it to strip `.hooks`, silently producing the wrong filename. Any function whose name includes "filename" and whose implementation calls `path.basename` should not receive pre-derived stems.

- **Multi-part stem edge cases need end-to-end emit tests.** The unit tests for `inferGlobalPromptName` correctly verified `'foo.bar.mdc'` → `'foo.bar'`. But no emit test exercised what happens when that multi-part stem flows through the emit sanitizer. The bugs were invisible until a human reviewer traced the call chain. Emit test suites should include at least one multi-part-stem fixture.

- **niko-qa is not a substitute for PR review.** niko-qa passed a build containing two blocking bugs. Both were invisible to 849 tests because every fixture used single-part names where `sanitizeFilename` is a no-op. niko-qa is strong at "does the code match the plan and do all tests pass"; it is weaker at "does the plan's specified function have the right contract for this call site."

- **TypeScript union push pattern.** Pushing `{ type: CustomizationType.GlobalPrompt, name: '...' }` to `AgentCustomization[]` triggers excess property checking against the union base type, not the narrowed discriminant. Fix: `as GlobalPrompt` (not `as any`) at the push site. Will recur whenever new fields are added to discriminated union members in discovery functions.

- **Required beats optional for invariants.** `name?: string` forced defensive `?` and `||` handling everywhere and still didn't prevent omission at construction sites. `name: string` enforces correctness at the compiler. When the invariant is "always present at all consuming sites," the field must be required.

- **`name` in IR filename ≠ IR version bump.** IR version bumps are for on-disk format changes. When data lives in the filename (not frontmatter), making the corresponding TypeScript field required changes nothing on disk.

## PROCESS IMPROVEMENTS

- **Specify behavior in the plan, not function names.** The plan said `sanitizeFilename(gp.name)` — naming the function, not the behavior. If it had said "normalize `gp.name` to a safe stem *without stripping extensions*," someone would have caught the mismatch. Plan specs for code-level details should describe the contract, not the implementation.

- **Emit test suites need multi-part-stem fixtures.** Single-part names like `'cursorrules'` or `'CLAUDE'` exercise only the trivial path through sanitizers. Add at least one `'foo.bar'`-style fixture to every emit test suite to catch extension-stripping bugs.

- **Post-QA scope reassessment is a useful checkpoint for L3+.** The operator's architectural challenge after QA pass was productive and fast (anchored by the "Out of Scope" section in tasks.md). Consider formalizing this as a step in the L3 workflow.

- **"Out of Scope" sections earn their keep.** The tasks.md "Out of Scope (Future Work)" section was cited directly during the scope reassessment, making the conversation fast and decisive.

## TECHNICAL IMPROVEMENTS

- The `sanitizeFilename` function in both plugin-cursor and plugin-claude accepts a parameter named `sourcePath` but is now sometimes called with pre-derived stems. A future refactor could split it into `sanitizeFilenameFromPath(sourcePath)` (strips basename + extension) and `sanitizeStem(stem)` (normalizes chars only) — or just consistently use the existing `sanitizePromptName` for the stem case in cursor. For now, `sanitizeName` in claude and the inline in cursor handle the immediate need.

## NEXT STEPS

- The a16n monorepo changes (on branch `gp-naming`) need their own PR review and merge before `a16n-plugin-cursorrules` PR #7 can be merged to main.
- `a16n-plugin-cursorrules` PR #7 is open, up to date with `@a16njs/models@0.11.0`, and ready for review.
- Future: Claude plugin "single CLAUDE.md" optimization (emit one GlobalPrompt as `CLAUDE.md` if no contention). This is orthogonal to `name` — `gp.name` is available for disambiguation when the time comes; nothing in this work blocks it.
