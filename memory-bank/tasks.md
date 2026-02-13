# Tasks: a16n-plugin-cursorrules

## Current Task: Initial Implementation

**Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)
**Branch:** `initialdev`
**Status:** Planning Complete — Ready for Implementation

### Creative Phases
- [x] Dependency strategy (`@a16njs/models` peer + dev) → `creative/creative-dependency-strategy.md`

### Implementation Checklist

#### Phase 1: Project Scaffolding
- [ ] `package.json` — name, version 0.1.0, ESM, scripts, peer/dev deps
- [ ] `tsconfig.json` — extends a16n conventions (ES2022, ESNext, bundler, strict)
- [ ] `vitest.config.ts` — globals, test include, coverage config
- [ ] `.gitignore` — node_modules, dist, coverage, tsbuildinfo
- [ ] `.nvmrc` — Node 24 (match a16n)
- [ ] `README.md` — purpose, install, usage, API

#### Phase 2: Test Infrastructure (TDD Step 1-2)
- [ ] `test/fixtures/with-cursorrules/.cursorrules` — sample content
- [ ] `test/fixtures/empty-cursorrules/.cursorrules` — empty file
- [ ] `test/fixtures/no-cursorrules/.gitkeep` — no .cursorrules file
- [ ] `test/discover.test.ts` — stub test suites:
  - discovers .cursorrules and returns GlobalPrompt
  - returns empty results when no .cursorrules exists
  - handles empty .cursorrules file
  - reads correct file content
  - sets correct metadata (id, type, version, sourcePath)
- [ ] `test/index.test.ts` — stub test suites:
  - plugin has correct id, name, supports
  - plugin exports as default export
  - emit returns all items as unsupported
  - emit returns empty written array

#### Phase 3: Stub Interfaces (TDD Step 2)
- [ ] `src/index.ts` — plugin object stub with empty discover/emit
- [ ] `src/discover.ts` — discover function stub

#### Phase 4: Implement Tests (TDD Step 3)
- [ ] Fill out all test implementations
- [ ] Run tests — all should FAIL (red phase)

#### Phase 5: Implement Code (TDD Step 4)
- [ ] `src/discover.ts` — full implementation
- [ ] `src/index.ts` — wire up discover, implement emit (return unsupported)
- [ ] Run tests — iterate until all PASS (green phase)

#### Phase 6: CI/CD
- [ ] `.github/workflows/ci.yaml` — build, typecheck, test+coverage
- [ ] `.github/workflows/release.yaml` — release-please + npm publish
- [ ] `.release-please-manifest.json`
- [ ] `release-please-config.json`

#### Phase 7: Verification
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] All test cases green
- [ ] Coverage acceptable

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
