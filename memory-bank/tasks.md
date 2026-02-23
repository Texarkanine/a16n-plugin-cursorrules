---
# Tasks: GlobalPrompt Name Field — Complete Implementation

**Complexity:** Level 3
**Status:** PLAN

## Problem Statement

Discovery plugins know what a GlobalPrompt is called (its source filename stem). Emission plugins currently re-derive this name from the source path at emission time — which is fragile, duplicated across every plugin, and broken for leading-dot filenames like `.cursorrules`.

The fix: a centralized `inferGlobalPromptName(sourcePath)` utility in `@a16njs/models`, combined with making `GlobalPrompt.name` a **required** field (not optional). Every discovery plugin sets `name` at discovery time. Every emission plugin reads `gp.name` directly — no fallback derivation needed, no `as any` casts.

## Design

### `inferGlobalPromptName(sourcePath: string): string`

Logic:
1. Take `path.basename(sourcePath)`
2. Strip leading dot if present: `.cursorrules` → `cursorrules`
3. Strip last extension: `cursorrules.md` → `cursorrules`, `CLAUDE.md` → `CLAUDE`

Test cases:
- `.cursorrules` → `cursorrules`
- `.cursorrules.md` → `cursorrules`
- `.cursorrules.txt` → `cursorrules`
- `CLAUDE.md` → `CLAUDE`
- `AGENTS.md` → `AGENTS`
- `my-rule.mdc` → `my-rule`
- `foo.bar.mdc` → `foo.bar`

### IR Format Unchanged

`GlobalPrompt.name` is NOT serialized to IR frontmatter. The IR filename IS the name (as it already is for all types). When plugin-a16n re-discovers a GlobalPrompt from `.a16n/global-prompt/cursorrules.md`, it sets `name: 'cursorrules'` from the filename. Roundtrip preserved.

### Discovery sets `name`, Emission uses `name`

No emission plugin needs to know how to derive a name — they all just use `gp.name`. If `name` is required, TypeScript enforces correctness at every construction site.

## Work Items

### Phase 1: @a16njs/models (a16n repo)

- [ ] **STUB** `inferGlobalPromptName` in `packages/models/src/helpers.ts` (empty function, correct signature + JSDoc)
- [ ] **STUB** tests for `inferGlobalPromptName` in `packages/models/test/helpers.test.ts` (empty `it()` blocks)
- [ ] **IMPLEMENT** tests (all edge cases listed above)
- [ ] **RUN** tests → expect failures
- [ ] Change `name?: string` → `name: string` on `GlobalPrompt` in `packages/models/src/types.ts`
- [ ] Update JSDoc: "Set at discovery time using `inferGlobalPromptName(sourcePath)`. Used by emission plugins for output filename."
- [ ] Export `inferGlobalPromptName` from `packages/models/src/index.ts`
- [ ] **IMPLEMENT** `inferGlobalPromptName`
- [ ] Fix TypeScript errors in `packages/models/test/types.test.ts` (add `name` to any GlobalPrompt literals)
- [ ] Run `pnpm test` in models — all pass

### Phase 2: plugin-a16n (a16n repo)

- [ ] **STUB** test in `packages/plugin-a16n/test/emit.test.ts`: GlobalPrompt with `name: 'cursorrules'` emits to `cursorrules.md`
- [ ] **STUB** test in `packages/plugin-a16n/test/parse.test.ts` (or discover.test.ts): IR file `cursorrules.md` → parsed GlobalPrompt has `name: 'cursorrules'`
- [ ] **IMPLEMENT** tests → run → expect failures
- [ ] `packages/plugin-a16n/src/parse.ts` — GlobalPrompt case: add `name: nameWithoutExt` (already computed in scope)
- [ ] `packages/plugin-a16n/src/emit.ts` — simplify: `isGlobalPrompt(item)` branch (no `&& item.name` guard needed)
- [ ] Fix any TypeScript errors from required `name` field (test fixtures, etc.)
- [ ] Run `pnpm test` in plugin-a16n — all pass

### Phase 3: plugin-cursor (a16n repo)

- [ ] **STUB** test in `packages/plugin-cursor/test/discover.test.ts`: `alwaysApply: true` rule named `foo.mdc` → GlobalPrompt has `name: 'foo'`
- [ ] **STUB** test in `packages/plugin-cursor/test/emit.test.ts`: GlobalPrompt with `name: 'cursorrules'` → emits to `.cursor/rules/cursorrules.mdc`
- [ ] **IMPLEMENT** tests → run → expect failures
- [ ] `packages/plugin-cursor/src/discover.ts` — `classifyRule()`: add `name: inferGlobalPromptName(sourcePath)` to GlobalPrompt branch; import `inferGlobalPromptName`
- [ ] `packages/plugin-cursor/src/emit.ts` — GlobalPrompt loop: `sanitizeFilename(gp.name)` (remove conditional fallback)
- [ ] Fix TypeScript errors (test fixtures, etc.)
- [ ] Run `pnpm test` in plugin-cursor — all pass

### Phase 4: plugin-claude (a16n repo)

- [ ] **STUB** test in `packages/plugin-claude/test/discover.test.ts`: `CLAUDE.md` → GlobalPrompt has `name: 'CLAUDE'`; `.claude/rules/foo.md` → GlobalPrompt has `name: 'foo'`
- [ ] **STUB** test in `packages/plugin-claude/test/emit.test.ts`: GlobalPrompt with `name: 'cursorrules'` → emits to `.claude/rules/cursorrules.md`
- [ ] **IMPLEMENT** tests → run → expect failures
- [ ] `packages/plugin-claude/src/discover.ts` — CLAUDE.md discovery: add `name: inferGlobalPromptName(normalizedPath)`; .claude/rules/ discovery: same; import `inferGlobalPromptName`
- [ ] `packages/plugin-claude/src/emit.ts` — GlobalPrompt loop: `sanitizeFilename(gp.name)` (currently uses sourcePath, missing the name check entirely)
- [ ] Fix TypeScript errors (test fixtures, etc.)
- [ ] Run `pnpm test` in plugin-claude — all pass

### Phase 5: Full a16n suite

- [ ] Run `pnpm test` from a16n root — all packages pass
- [ ] Confirm no `as any` needed in any a16n plugin

### Phase 6: a16n-plugin-cursorrules (after a16n published)

- [ ] Update `package.json` devDep `@a16njs/models` to the new published version
- [ ] `src/discover.ts` — replace `name: 'cursorrules', } as any` with `name: inferGlobalPromptName(entry.name),`; import `inferGlobalPromptName`
- [ ] Run `pnpm test` — all 25 tests pass (existing name tests now type-safe)

## Invariants

- `GlobalPrompt.name` is always a non-empty string (enforced by TypeScript)
- `name` = sanitized stem of the source filename (enforced by the shared utility)
- IR roundtrip: `name` → IR filename → re-read `name` is lossless
- No emission plugin re-derives names from source paths for GlobalPrompts
- `formatIRFile` does NOT need to change (name stays as filename, not in frontmatter)
- `extractNameFromId` fallback in plugin-a16n's `emitStandardIR` is preserved for non-GlobalPrompt types

## Out of Scope (Future Work)

- plugin-claude "smart subdir" behavior (single GlobalPrompt in subdir → local CLAUDE.md vs hoist with `paths:`). This is orthogonal to `name` — depends on `relativeDir` + count, not name. The `name` field will be available for disambiguation when that work happens.
- plugin-a16n serializing `name` into IR frontmatter (not needed; filename IS the name)
