# Feature Archive: a16n-plugin-cursorrules Initial Implementation

**Feature ID:** initial-implementation
**Date Archived:** 2026-02-15
**Status:** COMPLETED & ARCHIVED
**Related Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)
**Branch:** `initialdev`

## 1. Feature Overview

Built a complete a16n plugin package from scratch that discovers legacy `.cursorrules` files and presents them as `GlobalPrompt` customizations. The plugin is discovery-only (no emission) and follows the `A16nPlugin` interface from `@a16njs/models`. This enables a16n to read `.cursorrules` files and convert them to other formats (like Cursor IDE's `.cursorrules` format).

## 2. Key Requirements Met

- **A16nPlugin Interface Compliance**: Implements the standard `A16nPlugin` interface with `discover()` and `emit()` methods
- **Discovery Functionality**: Finds `.cursorrules` files in project directories
- **IR Conversion**: Converts discovered files to `GlobalPrompt` intermediate representation
- **Type Safety**: Full TypeScript support with strict type checking
- **Testing**: Comprehensive test coverage (94.87% overall)
- **CI/CD**: Automated build, test, and release pipeline
- **Documentation**: Complete README with usage examples

## 3. Design Decisions & Creative Outputs

### Dependency Strategy for @a16njs/models

**Context:**
- Plugin returns `AgentCustomization` objects consumed by `@a16njs/engine`
- Objects cross module boundaries (plugin → engine); must be structurally identical
- Version mismatches should fail at install time, not silently at runtime
- Plugin must be independently buildable and testable

**Options Evaluated:**

1. **Direct `dependencies`** - Rejected. npm may install duplicate copies. Objects from different module instances could diverge silently on future class-based types. No install-time error on major version conflict.

2. **`peerDependencies` only** - Rejected (incomplete). Correct runtime behavior but broken development experience — `tsc` can't find types without dev dependency.

3. **`peerDependencies` + `devDependencies`** - **CHOSEN**. Runtime: single copy guaranteed, npm errors on version conflict. Development: `devDependencies` provides types for build/test. Industry standard pattern (ESLint, Babel, Webpack, Prettier plugins).

4. **`dependencies` + `peerDependencies`** - Rejected. Defeats purpose — npm falls back to bundled dependency instead of erroring.

**Decision:**

Use `peerDependencies` + `devDependencies`, both `"@a16njs/models": "^0.9.0"`

```json
{
  "peerDependencies": {
    "@a16njs/models": "^0.9.0"
  },
  "devDependencies": {
    "@a16njs/models": "^0.9.0"
  }
}
```

**Rationale:**
1. Single module instance at runtime — no prototype/identity mismatches
2. Fail-fast: npm errors at install time on incompatible versions
3. Universal plugin ecosystem pattern
4. Independent development works via devDependencies
5. Conservative `^0.9.0` range; widen after verifying each models release

### Emit Behavior

**Decision:** Return all items as `unsupported` — no file writing

**Rationale:** The `.cursorrules` format is a legacy format primarily used for discovery. The plugin's purpose is to read these files and convert them to a16n's IR, not to write them back. Combined with `supports: [GlobalPrompt]`, this honestly communicates the plugin's capabilities.

## 4. Implementation Summary

### Architecture

The plugin follows a simple two-module architecture:
- **`src/index.ts`**: Plugin entry point, exports the `A16nPlugin` object
- **`src/discover.ts`**: Discovery logic for finding and parsing `.cursorrules` files

### Key Components

1. **Plugin Object** (`src/index.ts`):
   - Implements `A16nPlugin` interface
   - Exports `id`, `version`, `supports`, `discover()`, and `emit()` methods
   - `discover()` delegates to the discovery module
   - `emit()` returns all items as unsupported

2. **Discovery Function** (`src/discover.ts`):
   - Searches for `.cursorrules` file in project root
   - Uses `fs.readFile()` with UTF-8 encoding
   - Handles missing files gracefully (returns empty results)
   - Creates deterministic IDs using `createId()` from `@a16njs/models`
   - Returns `DiscoveryResult` with `GlobalPrompt` customization

### Technologies & Libraries

- **TypeScript**: ES2022, ESNext modules, strict mode
- **Vitest**: Testing framework with coverage reporting (@vitest/coverage-v8)
- **@a16njs/models**: Core types and utilities (peer + dev dependency)
- **Node.js**: Requires >=18 (tested on 18, 20, 22)

### Implementation Phases (TDD)

1. **Phase 1: Project Scaffolding** - package.json, tsconfig, vitest config, .gitignore, .nvmrc, README
2. **Phase 2: Test Infrastructure** - 3 fixtures, 2 test files with 9 stubs
3. **Phase 3: Stub Interfaces** - Empty implementations in src/
4. **Phase 4: Implement Tests** - 9 tests, 7 failed in red phase
5. **Phase 5: Implement Code** - All 9 tests green
6. **Phase 6: CI/CD** - GitHub Actions workflows for build/test/release
7. **Phase 7: Verification** - Build, typecheck, test, coverage all passing

## 5. Testing Overview

### Test Strategy

Strict TDD methodology: stubs → red phase → green phase. All tests written before implementation code.

### Test Suites

1. **Discovery Tests** (`test/discover.test.ts`):
   - Discovers .cursorrules in root directory
   - Handles empty .cursorrules file
   - Returns empty results when no .cursorrules exists
   - Creates proper GlobalPrompt with content and metadata
   - Generates deterministic IDs

2. **Plugin Interface Tests** (`test/index.test.ts`):
   - Exports valid A16nPlugin object
   - Plugin has correct id and version
   - Supports GlobalPrompt type
   - emit() returns unsupported for all items

### Test Fixtures

- `test/fixtures/with-cursorrules/` - Contains sample .cursorrules file
- `test/fixtures/empty-cursorrules/` - Contains empty .cursorrules file
- `test/fixtures/no-cursorrules/` - No .cursorrules file present

### Test Results

- **9/9 tests passing** (green phase achieved)
- **Coverage: 94.87% overall**
  - `discover.ts`: 100% coverage
  - `index.ts`: 89.47% coverage (gap is the discover() wrapper method, tested through discover.test.ts)

### CI/CD Testing

- Node.js matrix: 18, 20, 22
- All platforms: build ✓, typecheck ✓, test ✓

## 6. Reflection & Lessons Learned

### What Went Well

1. **TDD discipline paid off.** The stub → red → green cycle was clean. All 7 implementation-dependent tests failed in red phase exactly as expected, and the fix was straightforward — no test rewrites needed during green phase.

2. **`@a16njs/models` API is well-designed.** The `A16nPlugin` interface, `DiscoveryResult`, `EmitResult`, `createId()`, and `CURRENT_IR_VERSION` all worked exactly as documented. No surprises or workarounds needed.

3. **Minimal code, complete functionality.** The entire plugin is ~40 lines of implementation code across 2 source files. The format's simplicity (single plain-text file) maps cleanly to the plugin interface.

4. **Creative phase dependency decision was correct.** `peerDependencies` + `devDependencies` for `@a16njs/models` installed cleanly and typechecked without issues.

5. **Phased approach kept things organized.** Each phase had a clear gate (tests pass, build passes) before proceeding, which prevented compounding issues.

### Challenges

1. **`@vitest/coverage-v8` version mismatch.** The latest `@vitest/coverage-v8` (v4.x) was incompatible with `vitest@^2.0.0`. Required pinning to `@vitest/coverage-v8@^2.1.9`. Minor issue but not anticipated in the plan.

2. **`.nvmrc` version discrepancy.** Plan specified Node 24 to match a16n, but the development environment has Node 22. Used Node 22 as the practical choice. The `engines` field correctly specifies `>=18` which covers both.

3. **Coverage gap on `index.ts` discover wrapper.** The plugin's `discover()` method delegates to the imported `discover()` function. The wrapper line itself isn't directly hit in `index.test.ts` (it's tested through `discover.test.ts`). This is a coverage reporting artifact, not a testing gap.

### Lessons Learned

1. **Always include coverage tooling in initial devDependencies.** The `@vitest/coverage-v8` package should have been in the plan's Phase 1 scaffolding, not discovered during Phase 7 verification.

2. **Check version compatibility of peer tools early.** The vitest ↔ coverage-v8 version mismatch could have been caught during QA validation if we'd done a dry-run install.

3. **Simple formats make great first plugins.** `.cursorrules` was ideal as a reference third-party plugin — trivial parsing, single file, no edge cases beyond "file exists or doesn't." Future plugin authors can use this as a template.

### Process Improvements

1. **QA validation should include a test `npm install` dry-run** to catch dependency resolution issues before BUILD phase.

2. **Plan should explicitly list all devDependencies** including coverage and tooling packages, not just the primary ones.

### Technical Observations

1. **`createId()` generates deterministic IDs** from type + sourcePath, which means the same `.cursorrules` file at the same path always produces the same ID. Good for idempotency.

2. **Empty file handling is clean.** An empty `.cursorrules` file still produces a valid `GlobalPrompt` with empty content — no special casing needed.

3. **The `emit()` returning all items as `unsupported` is the simplest correct behavior.** Combined with `supports: [GlobalPrompt]`, it honestly communicates the plugin's capabilities.

## 7. Known Issues or Future Considerations

### Blocked Work

**Phase 8: Integration Testing** - Blocked on a16n auto-discovery feature. Once available:
- `npm link` this plugin
- Verify `a16n plugins` shows cursorrules
- Test `a16n convert --from cursorrules --to cursor` command
- Verify unsupported emission works gracefully

### Future Enhancements

1. This plugin can serve as a **template** for other third-party a16n plugins
2. Consider adding support for additional file extensions (e.g., `.cursorrules.md`, `.cursorrules.txt`)
3. Explore multi-file support if .cursorrules conventions evolve

## Key Files and Components

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| Plugin entry | `src/index.ts` | Default export of A16nPlugin | ✅ Complete |
| Discovery | `src/discover.ts` | Find and parse .cursorrules | ✅ Complete |
| Discovery tests | `test/discover.test.ts` | Test discovery logic | ✅ 5/5 tests passing |
| Plugin tests | `test/index.test.ts` | Test plugin interface | ✅ 4/4 tests passing |
| Fixtures | `test/fixtures/` | Sample project directories | ✅ 3 fixtures |
| Config | `package.json` | Package metadata and scripts | ✅ Complete |
| Config | `tsconfig.json` | TypeScript configuration | ✅ Complete |
| Config | `vitest.config.ts` | Test configuration | ✅ Complete |
| CI | `.github/workflows/ci.yaml` | Build/test automation | ✅ Complete |
| CI | `.github/workflows/release.yaml` | Release automation | ✅ Complete |
| Docs | `README.md` | Usage documentation | ✅ Complete |
