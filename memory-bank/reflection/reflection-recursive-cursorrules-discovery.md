# Reflection: Recursive .cursorrules Discovery

**Task:** Expand discover.ts to find `.cursorrules`, `.cursorrules.md`, `.cursorrules.txt` anywhere in the directory tree, emitting all as GlobalPrompt with locality-preserving `relativeDir`.

**Complexity:** Level 2

## Summary

Replaced single-file root lookup with recursive `readdir({ withFileTypes: true })` traversal matching `/^\.cursorrules(\.(md|txt))?$/`. Added `relativeDir` to preserve subdirectory locality in the IR.

## What Went Well

- **Design discussion before coding** — The back-and-forth on GlobalPrompt vs FileRule for subdirectory files was essential. The user's insight about round-trip fidelity and information loss from premature normalization changed the design correctly.
- **TDD process** — 4 new tests written and confirmed failing before implementation. Zero iteration cycles needed — implementation passed on first run.
- **Convention alignment** — Checked `relativeDir` usage in plugin-cursor and plugin-claude before implementing. Adopted the same `dir === '.' ? undefined : dir` convention and the same `readdir({ withFileTypes: true })` traversal pattern.
- **Fixture design** — The `cursorrules-is-dir` fixture (`.cursorrules/rules.md`) is a good edge case — validates that a `.cursorrules` directory doesn't produce false matches since the files inside don't have matching basenames.

## Challenges

- **None significant.** The scope was well-defined by the time we hit `/build`. The design discussion absorbed the complexity.

## Lessons Learned

- **IR should preserve intent, not optimize semantics.** A GlobalPrompt in a subdirectory is semantically a FileRule, but representationally it should stay a GlobalPrompt with location metadata. Emitters derive; discoverers preserve.
- **`relativeDir` is the locality mechanism across the a16n IR.** Every plugin uses it the same way — `undefined` at root, forward-slash-separated relative path otherwise.

## Process Improvements

- The design discussion happened in `/niko` mode before `/build`. This was the right sequencing — no wasted implementation effort.

## Status

- 16/16 tests passing
- Build clean (tsc) — verified locally; CI failure for `TS2307: Cannot find module '@a16njs/models'` was resolved in commit 8fb2e14 (lockfile fix)
- Ready for `/archive`
