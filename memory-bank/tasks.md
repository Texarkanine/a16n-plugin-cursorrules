# Tasks: a16n-plugin-cursorrules

## Current Task: Adapt to New Plugin Interface (Workspace Support)

**Status:** Reflection Complete — Ready for Archive
**Complexity:** Level 2 (Enhancement)
**Branch:** TBD (suggest `feat/workspace-support`)

### Background

The `A16nPlugin` interface in `@a16njs/models` has changed. Both `discover()` and `emit()` now accept `string | Workspace` instead of plain `string`. A new optional `pathPatterns` property was also added. The plugin must be updated to conform to the new interface.

### Gap Analysis

| Aspect | Current | Required |
|---|---|---|
| `discover` param | `root: string` | `rootOrWorkspace: string \| Workspace` |
| `emit` param | `_root: string` | `_rootOrWorkspace: string \| Workspace` |
| `pathPatterns` | absent | optional `PluginPathPatterns` |
| FS operations | direct `node:fs/promises` | `resolveRoot()` to extract string (matches plugin-cursor pattern) |
| Workspace imports | none | `Workspace`, `resolveRoot` from `@a16njs/models` |

### Design Decision: `resolveRoot()` vs Full Workspace Abstraction

The built-in plugins (`plugin-cursor`, `plugin-claude`) use `resolveRoot()` — they accept `string | Workspace` but extract the root path string to continue using `node:fs/promises` directly. This is the pragmatic migration path:

- **Pro:** Minimal code change, proven pattern, no behavioral changes
- **Pro:** Recursive directory traversal (which this plugin does) maps naturally to `node:fs` but would need manual reimplementation with `Workspace.readdir()` (single-level only)
- **Con:** Doesn't leverage Workspace abstraction for testing (but `LocalWorkspace` just wraps `node:fs` anyway)

**Decision:** Use `resolveRoot()`, matching the built-in plugin pattern.

### Implementation Checklist

#### Phase 1: Test Modifications (TDD)

##### 1.1 Update `test/discover.test.ts`
- [x]Import `LocalWorkspace` from `@a16njs/models`
- [x]Add test: "accepts a Workspace instance" — pass a `LocalWorkspace` wrapping an existing fixture dir, verify identical results to passing the string directly
- [x]Add test: "works with Workspace for nested discovery" — pass `LocalWorkspace` wrapping `nested-cursorrules` fixture

##### 1.2 Update `test/index.test.ts`
- [x]Import `LocalWorkspace` from `@a16njs/models`
- [x]Add test: "discover accepts Workspace parameter" — call `plugin.discover(new LocalWorkspace(...))` with a fixture
- [x]Add test: "emit accepts Workspace parameter" — call `plugin.emit(items, new LocalWorkspace(...))` and verify unsupported behavior
- [x]Verify existing `string`-parameter tests still pass (backward compatibility)

##### 1.3 Run Tests — All New Tests Should FAIL
- [x]`npm run test` — new workspace tests fail (signatures don't accept Workspace yet), existing tests pass

#### Phase 2: Code Changes

##### 2.1 Update `src/discover.ts`
- [x]Add `Workspace` type and `resolveRoot` to imports from `@a16njs/models`
- [x]Change signature: `discover(root: string)` → `discover(rootOrWorkspace: string | Workspace)`
- [x]Add `const root = resolveRoot(rootOrWorkspace);` as first line
- [x]Remove the old `root` parameter usage (it becomes the extracted string)
- [x]All `node:fs/promises` usage remains unchanged — `root` is still a string

##### 2.2 Update `src/index.ts`
- [x]Add `Workspace` type import from `@a16njs/models`
- [x]Change `discover(root: string)` → `discover(rootOrWorkspace: string | Workspace)`
- [x]Change `emit(models, _root: string, ...)` → `emit(models, _rootOrWorkspace: string | Workspace, ...)`
- [x]Add `pathPatterns` property (optional but recommended for consistency):
  ```typescript
  pathPatterns: {
    prefixes: [],         // .cursorrules lives at project root, no directory prefix
    extensions: [''],     // no extension (bare .cursorrules), plus .md, .txt tryhard variants
  }
  ```
  **Note:** pathPatterns may not be a great fit for cursorrules since files are at root level with no directory prefix and the primary file has no extension. Evaluate whether to include it or leave it absent. The field is optional.

##### 2.3 Run Tests — All Should PASS
- [x]`npm run test` — all tests pass including new workspace tests

#### Phase 3: Verification
- [x]`npm run build` passes
- [x]`npm run typecheck` passes
- [x]`npm run test` passes (full suite)
- [x]All test cases green
- [x]Coverage acceptable

#### Phase 4: Memory Bank Updates
- [x]Update `systemPatterns.md` with new interface
- [x]Update `techContext.md` if needed
- [x]Update `activeContext.md`
- [x]Update `progress.md`

### Components

| Component | File | Change Type |
|-----------|------|-------------|
| Discovery | `src/discover.ts` | Signature change + `resolveRoot()` |
| Plugin entry | `src/index.ts` | Signature change + optional `pathPatterns` |
| Discovery tests | `test/discover.test.ts` | Add Workspace parameter tests |
| Plugin tests | `test/index.test.ts` | Add Workspace parameter tests |

### Risk Assessment

- **Low risk:** This is a signature-compatible change. Passing `string` still works because `string | Workspace` is a widening of the parameter type.
- **No behavioral change:** `resolveRoot()` extracts the same string that was previously passed directly.
- **Backward compatible:** Existing callers passing strings are unaffected.
- **@a16njs/models version:** Bumped to `^0.10.0` which includes `Workspace`, `resolveRoot`, `toWorkspace`, `LocalWorkspace`.
