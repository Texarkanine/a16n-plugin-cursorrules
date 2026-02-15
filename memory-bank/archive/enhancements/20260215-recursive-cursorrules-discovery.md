# Enhancement Archive: Recursive .cursorrules Discovery

## Summary

Expanded discover.ts to find `.cursorrules`, `.cursorrules.md`, `.cursorrules.txt` anywhere in the directory tree, emitting all as GlobalPrompt with locality-preserving `relativeDir`. This enhancement enables the plugin to discover cursorrules files in subdirectories, not just the project root.

## Date Completed

2026-02-15

## Complexity Level

Level 2

## Key Files Modified

- `src/discover.ts` - Replaced single-file root lookup with recursive traversal
- `test/discover.test.ts` - Added 4 new test cases for recursive discovery
- `test/fixtures/` - Added new test fixtures for subdirectory scenarios

## Requirements Addressed

- Discover `.cursorrules` files in any subdirectory, not just root
- Support multiple file extensions: `.cursorrules`, `.cursorrules.md`, `.cursorrules.txt`
- Preserve subdirectory locality via `relativeDir` in the IR
- Skip directories that should not be traversed (node_modules, .git, etc.)
- Maintain GlobalPrompt representation (not FileRule) to preserve round-trip fidelity

## Implementation Details

### Approach

Replaced the single-file root lookup with a recursive directory traversal using `readdir({ withFileTypes: true })`. The implementation:

1. **Traversal Pattern**: Adopted the same recursive traversal pattern used in plugin-cursor and plugin-claude
2. **File Matching**: Uses regex `/^\.cursorrules(\.(md|txt))?$/` to match all valid extensions
3. **Locality Preservation**: Sets `relativeDir` to preserve subdirectory information
   - Root files: `relativeDir = undefined`
   - Subdirectory files: `relativeDir = "path/to/dir"` (forward-slash-separated)
4. **Directory Skipping**: Added `SKIP_DIRS` constant to skip node_modules, .git, dist, coverage, etc.

### Design Decision: GlobalPrompt vs FileRule

**Key Insight:** A GlobalPrompt in a subdirectory is semantically a FileRule, but representationally it should stay a GlobalPrompt with location metadata.

**Rationale:**
- **Preserve intent**: The IR should preserve the original format's intent, not optimize semantics
- **Round-trip fidelity**: Premature normalization loses information
- **Emitters derive**: Emitters can interpret GlobalPrompt with `relativeDir` as FileRule if needed
- **Discoverers preserve**: Discovery plugins should preserve the source format's structure

This decision aligns with a16n's philosophy that discoverers preserve and emitters derive.

### Convention Alignment

- **`relativeDir` usage**: Adopted the same `dir === '.' ? undefined : dir` convention as other plugins
- **Traversal pattern**: Used `readdir({ withFileTypes: true })` like plugin-cursor and plugin-claude
- **Path handling**: Forward-slash-separated relative paths, `undefined` at root

## Testing Performed

### New Test Cases (4 tests)

1. **Multiple extension support**: Verifies `.cursorrules`, `.cursorrules.md`, `.cursorrules.txt` are all discovered
2. **Subdirectory discovery**: Tests that files in nested directories are found
3. **relativeDir preservation**: Validates that subdirectory paths are correctly set
4. **Directory false matches**: `.cursorrules/rules.md` should NOT match (directory name doesn't count)

### Test Results

- **16/16 tests passing** (all new tests + original tests)
- Build clean (tsc)
- All tests green on first implementation run (zero iteration cycles)

### Fixture Design

Added strategic test fixtures:
- `with-multiple-extensions/` - Contains .cursorrules, .cursorrules.md, .cursorrules.txt
- `with-subdirs/` - Contains files in nested directories
- `cursorrules-is-dir/` - Edge case: `.cursorrules/` directory (should not match files inside)
- `with-non-matching-ext/` - Contains `.cursorrules.yaml`, `.cursorrules.json` (should not match)

## Lessons Learned

### What Worked Well

1. **Design discussion before coding**: The back-and-forth on GlobalPrompt vs FileRule for subdirectory files was essential. The user's insight about round-trip fidelity and information loss from premature normalization changed the design correctly.

2. **TDD process**: 4 new tests written and confirmed failing before implementation. Zero iteration cycles needed — implementation passed on first run.

3. **Convention alignment**: Checked `relativeDir` usage in plugin-cursor and plugin-claude before implementing. Adopted the same patterns for consistency.

4. **Fixture design**: The `cursorrules-is-dir` fixture (`.cursorrules/rules.md`) is a good edge case — validates that a `.cursorrules` directory doesn't produce false matches since the files inside don't have matching basenames.

### Key Insight

**IR should preserve intent, not optimize semantics.** This principle applies broadly across the a16n ecosystem:
- Discoverers preserve the source format's structure
- The IR maintains locality information via `relativeDir`
- Emitters derive target-specific semantics (e.g., GlobalPrompt → FileRule)

This separation of concerns ensures:
- Round-trip fidelity (source → IR → source preserves information)
- Flexibility for emitters (same IR can target different output formats)
- Transparency (the IR shows what was actually discovered, not an interpretation)

### Process Success

The design discussion happened in `/niko` mode before `/build`. This was the right sequencing — no wasted implementation effort. The implementation phase was straightforward because the design questions were already resolved.

## Related Work

- Initial implementation: `memory-bank/archive/features/20260215-initial-implementation.md`
- Follows patterns from plugin-cursor and plugin-claude in the a16n monorepo

## Notes

### CI Build Issue (Resolved)

There was a brief CI failure for `TS2307: Cannot find module '@a16njs/models'` which was resolved in commit 8fb2e14 (lockfile fix). The issue was not in this enhancement's code, but in the dependency resolution.

### Cross-Plugin Consistency

This enhancement maintains consistency with other a16n plugins:
- Same `relativeDir` convention as plugin-cursor and plugin-claude
- Same recursive traversal pattern
- Same directory-skipping behavior (SKIP_DIRS)

This consistency makes the a16n plugin ecosystem more maintainable and predictable.
