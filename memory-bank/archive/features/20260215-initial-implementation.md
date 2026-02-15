# Feature Archive: a16n-plugin-cursorrules Initial Implementation

**Feature ID:** initial-implementation
**Date Archived:** 2026-02-15
**Status:** COMPLETED & ARCHIVED
**Related Issue:** [Texarkanine/a16n#54](https://github.com/Texarkanine/a16n/issues/54)
**Branch:** `initialdev`

## 1. Feature Overview

Built a complete a16n plugin package from scratch that discovers legacy `.cursorrules` files (including variants `.cursorrules.md` and `.cursorrules.txt`) anywhere in a directory tree and presents them as `GlobalPrompt` customizations. The plugin is discovery-only (no emission) and follows the `A16nPlugin` interface from `@a16njs/models`. This enables a16n to read `.cursorrules` files and convert them to other formats (like Cursor IDE's `.cursorrules` format).

The implementation includes:
- Complete plugin scaffolding with TypeScript, Vitest, and CI/CD
- Recursive directory traversal to find cursorrules files in any subdirectory
- Support for multiple file extensions (`.cursorrules`, `.cursorrules.md`, `.cursorrules.txt`)
- Locality preservation via `relativeDir` in the intermediate representation
- Comprehensive test coverage with TDD methodology

## 2. Key Requirements Met

- **A16nPlugin Interface Compliance**: Implements the standard `A16nPlugin` interface with `discover()` and `emit()` methods
- **Recursive Discovery**: Finds `.cursorrules` files throughout the directory tree, not just at the root
- **Multi-Extension Support**: Discovers `.cursorrules`, `.cursorrules.md`, and `.cursorrules.txt` files
- **Locality Preservation**: Uses `relativeDir` to preserve subdirectory information in the IR
- **IR Conversion**: Converts discovered files to `GlobalPrompt` intermediate representation
- **Type Safety**: Full TypeScript support with strict type checking
- **Testing**: Comprehensive test coverage (16 tests, 100% passing, coverage at 94.87%)
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

### Discovery Strategy: Recursive vs Root-Only

**Initial Implementation**: Single-file root lookup
**Enhancement**: Recursive directory traversal

**Design Evolution:**
The initial implementation only looked for `.cursorrules` at the project root. This was later enhanced to support recursive discovery for several reasons:
1. Real-world projects may have cursorrules files in subdirectories for component-specific rules
2. Consistency with other a16n plugins (cursor, claude) which use recursive traversal
3. Better support for monorepos and complex project structures

### GlobalPrompt vs FileRule Representation

**Key Design Decision:** Preserve GlobalPrompt representation even for subdirectory files

**The Question:** Should a `.cursorrules` file in a subdirectory be represented as:
- A `GlobalPrompt` with `relativeDir` metadata?
- A `FileRule` (since it's scoped to a subdirectory)?

**Decision:** Use GlobalPrompt with `relativeDir`

**Rationale:**
- **Preserve intent**: The IR should preserve the original format's intent, not optimize semantics
- **Round-trip fidelity**: Premature normalization loses information. A GlobalPrompt → FileRule conversion loses the fact that the source was a `.cursorrules` file
- **Emitters derive**: Emitters can interpret GlobalPrompt with `relativeDir` as FileRule if needed for their target format
- **Discoverers preserve**: Discovery plugins should preserve the source format's structure

This aligns with a16n's philosophy that discoverers preserve and emitters derive. The `relativeDir` field provides the locality information without changing the semantic type.

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
   - Performs recursive directory traversal using `readdir({ withFileTypes: true })`
   - Matches files against regex `/^\.cursorrules(\.(md|txt))?$/`
   - Skips directories that should not be traversed (node_modules, .git, dist, coverage, etc.)
   - Reads file contents with UTF-8 encoding
   - Creates deterministic IDs using `createId()` from `@a16njs/models`
   - Preserves locality via `relativeDir` field (undefined for root, forward-slash path for subdirs)
   - Returns `DiscoveryResult` with `GlobalPrompt` customizations

### Recursive Traversal Implementation

**Pattern Alignment**: Adopted the same recursive traversal pattern used in plugin-cursor and plugin-claude:
- `readdir({ withFileTypes: true })` for efficient directory reading
- Skip list (SKIP_DIRS) to avoid node_modules, .git, dist, coverage, etc.
- Forward-slash-separated relative paths
- `relativeDir = undefined` for root files, `relativeDir = "path/to/dir"` for subdirectory files

**File Matching**:
- Regex: `/^\.cursorrules(\.(md|txt))?$/`
- Matches: `.cursorrules`, `.cursorrules.md`, `.cursorrules.txt`
- Does NOT match: `.cursorrules.yaml`, `.cursorrules.json`, files inside a `.cursorrules/` directory

### Technologies & Libraries

- **TypeScript**: ES2022, ESNext modules, strict mode
- **Vitest**: Testing framework with coverage reporting (@vitest/coverage-v8)
- **@a16njs/models**: Core types and utilities (peer + dev dependency)
- **Node.js**: Requires >=18 (tested on 18, 20, 22)

### Implementation Phases (TDD)

1. **Phase 1: Project Scaffolding** - package.json, tsconfig, vitest config, .gitignore, .nvmrc, README
2. **Phase 2: Test Infrastructure** - 3 initial fixtures, 2 test files with 9 stubs
3. **Phase 3: Stub Interfaces** - Empty implementations in src/
4. **Phase 4: Implement Tests** - 9 tests, 7 failed in red phase (initial implementation)
5. **Phase 5: Implement Code** - All 9 tests green (initial implementation)
6. **Phase 6: CI/CD** - GitHub Actions workflows for build/test/release
7. **Phase 7: Verification** - Build, typecheck, test, coverage all passing
8. **Enhancement: Recursive Discovery** - Added 4 new tests + recursive traversal implementation (all 16 tests passing)

## 5. Testing Overview

### Test Strategy

Strict TDD methodology: stubs → red phase → green phase. All tests written before implementation code.

For the recursive discovery enhancement: Design discussion first, then 4 new tests written and confirmed failing, then implementation (passed on first run).

### Test Suites

1. **Discovery Tests** (`test/discover.test.ts`) - 12 tests:
   - Discovers .cursorrules in root directory
   - Handles empty .cursorrules file
   - Returns empty results when no .cursorrules exists
   - Creates proper GlobalPrompt with content and metadata
   - Generates deterministic IDs
   - **Recursive Discovery Tests:**
     - Discovers all three file extensions (.cursorrules, .cursorrules.md, .cursorrules.txt)
     - Finds files in subdirectories
     - Preserves `relativeDir` for subdirectory files
     - Does NOT match files inside a `.cursorrules/` directory
     - Skips non-matching extensions (.cursorrules.yaml, .cursorrules.json)

2. **Plugin Interface Tests** (`test/index.test.ts`) - 4 tests:
   - Exports valid A16nPlugin object
   - Plugin has correct id and version
   - Supports GlobalPrompt type
   - emit() returns unsupported for all items

### Test Fixtures

**Initial Implementation:**
- `test/fixtures/with-cursorrules/` - Contains sample .cursorrules file
- `test/fixtures/empty-cursorrules/` - Contains empty .cursorrules file
- `test/fixtures/no-cursorrules/` - No .cursorrules file present

**Recursive Discovery Enhancement:**
- `test/fixtures/with-multiple-extensions/` - Contains .cursorrules, .cursorrules.md, .cursorrules.txt
- `test/fixtures/with-subdirs/` - Contains files in nested directories
- `test/fixtures/cursorrules-is-dir/` - Edge case: `.cursorrules/` directory (should not match files inside)
- `test/fixtures/with-non-matching-ext/` - Contains `.cursorrules.yaml`, `.cursorrules.json` (should not match)

### Test Results

- **16/16 tests passing** (9 initial + 7 recursive discovery)
- **Coverage: 94.87% overall**
  - `discover.ts`: 100% coverage
  - `index.ts`: 89.47% coverage (gap is the discover() wrapper method, tested through discover.test.ts)
- **Zero iteration cycles** for recursive discovery implementation (tests passed on first run after implementation)

### CI/CD Testing

- Node.js matrix: 18, 20, 22
- All platforms: build ✓, typecheck ✓, test ✓

## 6. Reflection & Lessons Learned

### What Went Well

1. **TDD discipline paid off.** The stub → red → green cycle was clean for both initial implementation and enhancement. All 7 implementation-dependent tests failed in red phase exactly as expected, and the fix was straightforward — no test rewrites needed during green phase. For the recursive discovery enhancement, 4 new tests failed as expected, and implementation passed on the first run.

2. **`@a16njs/models` API is well-designed.** The `A16nPlugin` interface, `DiscoveryResult`, `EmitResult`, `createId()`, and `CURRENT_IR_VERSION` all worked exactly as documented. No surprises or workarounds needed.

3. **Minimal code, complete functionality.** The entire plugin remains concise even with recursive discovery. The format's simplicity (plain-text files) maps cleanly to the plugin interface.

4. **Creative phase dependency decision was correct.** `peerDependencies` + `devDependencies` for `@a16njs/models` installed cleanly and typechecked without issues.

5. **Phased approach kept things organized.** Each phase had a clear gate (tests pass, build passes) before proceeding, which prevented compounding issues.

6. **Design discussion before coding (recursive discovery).** The back-and-forth on GlobalPrompt vs FileRule for subdirectory files was essential. The insight about round-trip fidelity and information loss from premature normalization led to the correct design decision.

7. **Convention alignment.** Checking `relativeDir` usage in plugin-cursor and plugin-claude before implementing the enhancement ensured consistency across the a16n plugin ecosystem.

8. **Fixture design excellence.** The `cursorrules-is-dir` fixture (`.cursorrules/rules.md`) is a good edge case — validates that a `.cursorrules` directory doesn't produce false matches since the files inside don't have matching basenames.

### Challenges

1. **`@vitest/coverage-v8` version mismatch.** The latest `@vitest/coverage-v8` (v4.x) was incompatible with `vitest@^2.0.0`. Required pinning to `@vitest/coverage-v8@^2.1.9`. Minor issue but not anticipated in the plan.

2. **`.nvmrc` version discrepancy.** Plan specified Node 24 to match a16n, but the development environment has Node 22. Used Node 22 as the practical choice. The `engines` field correctly specifies `>=18` which covers both.

3. **Coverage gap on `index.ts` discover wrapper.** The plugin's `discover()` method delegates to the imported `discover()` function. The wrapper line itself isn't directly hit in `index.test.ts` (it's tested through `discover.test.ts`). This is a coverage reporting artifact, not a testing gap.

4. **CI build issue (resolved).** Brief CI failure for `TS2307: Cannot find module '@a16njs/models'` after the recursive discovery enhancement, resolved in commit 8fb2e14 (lockfile fix). Not a code issue, but a dependency resolution artifact.

### Lessons Learned

1. **Always include coverage tooling in initial devDependencies.** The `@vitest/coverage-v8` package should have been in the plan's Phase 1 scaffolding, not discovered during Phase 7 verification.

2. **Check version compatibility of peer tools early.** The vitest ↔ coverage-v8 version mismatch could have been caught during QA validation if we'd done a dry-run install.

3. **Simple formats make great first plugins.** `.cursorrules` was ideal as a reference third-party plugin — trivial parsing, single file format, no complex edge cases. Future plugin authors can use this as a template.

4. **IR should preserve intent, not optimize semantics.** This is a core principle that applies broadly across the a16n ecosystem:
   - Discoverers preserve the source format's structure
   - The IR maintains locality information via `relativeDir`
   - Emitters derive target-specific semantics (e.g., GlobalPrompt → FileRule)
   - This separation ensures round-trip fidelity and flexibility

5. **Design discussions before implementation prevent wasted effort.** The GlobalPrompt vs FileRule discussion happened before the recursive discovery implementation, which meant zero iteration cycles during the BUILD phase.

6. **Cross-plugin consistency matters.** Using the same `relativeDir` convention and traversal patterns as plugin-cursor and plugin-claude makes the a16n plugin ecosystem more maintainable and predictable.

### Process Improvements

1. **QA validation should include a test `npm install` dry-run** to catch dependency resolution issues before BUILD phase.

2. **Plan should explicitly list all devDependencies** including coverage and tooling packages, not just the primary ones.

3. **Design phase before enhancement implementation** was the right sequencing — the recursive discovery enhancement had zero wasted effort because design questions were resolved first.

### Technical Observations

1. **`createId()` generates deterministic IDs** from type + sourcePath, which means the same `.cursorrules` file at the same path always produces the same ID. Good for idempotency.

2. **Empty file handling is clean.** An empty `.cursorrules` file still produces a valid `GlobalPrompt` with empty content — no special casing needed.

3. **The `emit()` returning all items as `unsupported` is the simplest correct behavior.** Combined with `supports: [GlobalPrompt]`, it honestly communicates the plugin's capabilities.

4. **`relativeDir` is the locality mechanism across the a16n IR.** Every plugin uses it the same way:
   - `undefined` for files at the project root
   - Forward-slash-separated relative path for subdirectory files
   - This convention enables consistent handling across the plugin ecosystem

## 7. Known Issues or Future Considerations

### Blocked Work

**Phase 8: Integration Testing** - Blocked on a16n auto-discovery feature. Once available:
- `npm link` this plugin
- Verify `a16n plugins` shows cursorrules
- Test `a16n convert --from cursorrules --to cursor` command
- Verify unsupported emission works gracefully

### Future Enhancements

1. This plugin can serve as a **template** for other third-party a16n plugins due to its simplicity and clean structure
2. If `.cursorrules` conventions evolve to include additional extensions, the regex pattern can be easily extended
3. The recursive discovery pattern is now fully aligned with other a16n plugins, making it easy to maintain

## Key Files and Components

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| Plugin entry | `src/index.ts` | Default export of A16nPlugin | ✅ Complete |
| Discovery | `src/discover.ts` | Recursive discovery and parsing | ✅ Complete |
| Discovery tests | `test/discover.test.ts` | Test discovery logic | ✅ 12/12 tests passing |
| Plugin tests | `test/index.test.ts` | Test plugin interface | ✅ 4/4 tests passing |
| Fixtures | `test/fixtures/` | Sample project directories | ✅ 7 fixtures |
| Config | `package.json` | Package metadata and scripts | ✅ Complete |
| Config | `tsconfig.json` | TypeScript configuration | ✅ Complete |
| Config | `vitest.config.ts` | Test configuration | ✅ Complete |
| CI | `.github/workflows/ci.yaml` | Build/test automation | ✅ Complete |
| CI | `.github/workflows/release.yaml` | Release automation | ✅ Complete |
| Docs | `README.md` | Usage documentation | ✅ Complete |
