# Tasks: a16n-plugin-cursorrules

## Current Task: Initial Implementation

**Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)
**Branch:** `initialdev`
**Status:** Reflection Complete ✅ — Ready for Archive

### Creative Phases
- [x] Dependency strategy (`@a16njs/models` peer + dev) → `creative/creative-dependency-strategy.md`

### Implementation Checklist

#### Phase 1: Project Scaffolding ✅
- [x] `package.json` — name, version 0.1.0, ESM, scripts, peer/dev deps
- [x] `tsconfig.json` — ES2022, ESNext, bundler resolution, strict
- [x] `vitest.config.ts` — globals, test include, coverage config
- [x] `.gitignore` — node_modules, dist, coverage, tsbuildinfo
- [x] `.nvmrc` — Node 22
- [x] `README.md` — purpose, install, usage, API

#### Phase 2: Test Infrastructure (TDD Step 1-2) ✅
- [x] `test/fixtures/with-cursorrules/.cursorrules` — sample content
- [x] `test/fixtures/empty-cursorrules/.cursorrules` — empty file
- [x] `test/fixtures/no-cursorrules/.gitkeep` — no .cursorrules file
- [x] `test/discover.test.ts` — stub test suites (5 tests)
- [x] `test/index.test.ts` — stub test suites (4 tests)

#### Phase 3: Stub Interfaces (TDD Step 2) ✅
- [x] `src/index.ts` — plugin object stub with empty discover/emit
- [x] `src/discover.ts` — discover function stub

#### Phase 4: Implement Tests (TDD Step 3) ✅
- [x] Fill out all 9 test implementations
- [x] Run tests — 7 failed, 2 passed (red phase confirmed)

#### Phase 5: Implement Code (TDD Step 4) ✅
- [x] `src/discover.ts` — full implementation (readFile, createId, CURRENT_IR_VERSION)
- [x] `src/index.ts` — wire up discover, implement emit (return unsupported)
- [x] Run tests — all 9 PASS (green phase)

#### Phase 6: CI/CD ✅
- [x] `.github/workflows/ci.yaml` — build, typecheck, test+coverage (Node 18/20/22 matrix)
- [x] `.github/workflows/release.yaml` — release-please + npm publish with provenance
- [x] `.release-please-manifest.json`
- [x] `release-please-config.json`

#### Phase 7: Verification ✅
- [x] `npm run build` passes
- [x] `npm run typecheck` passes
- [x] `npm run test` passes — 9/9 tests green
- [x] Coverage: 94.87% overall (discover.ts 100%, index.ts 89.47%)

#### Phase 8: Integration Test (depends on a16n auto-discovery)
- [ ] `npm link` in this repo
- [ ] `npm link a16n-plugin-cursorrules` in a16n
- [ ] `a16n plugins` shows cursorrules
- [ ] `a16n convert --from cursorrules --to cursor <fixture>` works
- [ ] `a16n convert --from cursor --to cursorrules <fixture>` returns unsupported gracefully

### Components

| Component | File | Purpose |
|-----------|------|---------|
| Plugin entry | `src/index.ts` | Default export of A16nPlugin |
| Discovery | `src/discover.ts` | Find and parse .cursorrules |
| Discovery tests | `test/discover.test.ts` | Test discovery logic |
| Plugin tests | `test/index.test.ts` | Test plugin interface |
| Fixtures | `test/fixtures/` | Sample project directories |

---

## Current Task: CodeRabbit PR #2 Fixes

**Status:** COMPLETE
**PR URL:** https://github.com/Texarkanine/a16n-plugin-cursorrules/pull/2
**Rate Limit Until:**
**Last Updated:** 2026-02-14T15:20:00Z

### Actionable Items
- [x] ID: release-npm - Switch `pnpm publish` to `npm publish --access public` for OIDC trusted publishing
- [x] ID: qa-pkgmgr - Fix package manager label "npm" → "pnpm" in .qa_validation_status
- [x] ID: nvmrc-ver - Fix .nvmrc version mismatch in activeContext.md (22 → 24)
- [x] ID: syspatterns-err - Fix error handling doc in systemPatterns.md to match code behavior
- [x] ID: skip-dirs - Add SKIP_DIRS to recursive traversal to skip node_modules, .git, etc.
- [x] ID: tasks-md058 - Add blank line before table in tasks.md (MD058)
- [x] ID: tech-md040 - Add language identifier to fenced code block in techContext.md (MD040)
- [x] ID: reflect-build - Update build status in reflection doc to be accurate

### Ignored
- ID: pnpm-version - "Consider updating pinned pnpm version" — Low priority nitpick, not a correctness issue
- ID: silent-catch - "Silent catch swallows all FS errors" — Intentional design; all FS errors during discovery should be non-fatal
- ID: nonmatch-test - "Test for non-matching extensions doesn't exercise the filter" — Updated test to use `with-non-matching-ext` fixture with `.cursorrules.yaml` and `.cursorrules.json` files
