# Active Context: a16n-plugin-cursorrules

## Current Focus

Planning complete. Ready to begin Phase 1 (scaffolding) and Phase 2 (test infrastructure) implementation.

## Recent Decisions

1. **Dependency strategy:** `@a16njs/models` as `peerDependencies` + `devDependencies`, both `^0.9.0` (see `creative/creative-dependency-strategy.md`)
2. **Emit behavior:** Return all items as `unsupported` — graceful, honest, and the `supports` array + `a16n plugins` output make it obvious before anyone runs it
3. **Plugin ID:** `cursorrules` (matches package name pattern `a16n-plugin-{id}`)
4. **Scope:** Discovery only, GlobalPrompt only, no emission

## Key Context

- This is the FIRST third-party plugin for a16n
- Auto-discovery (`a16n-plugin-*` pattern) is not yet implemented in a16n — that work is tracked separately in the a16n repo
- Plugin can be fully built and unit-tested independently; integration testing requires the auto-discovery feature in a16n
- The `.cursorrules` format is trivial: single plain-text file at project root

## Immediate Next Steps

1. Scaffold project (package.json, tsconfig, vitest, gitignore, nvmrc)
2. Create test fixtures
3. Stub tests and interfaces (TDD)
4. Implement tests → implement code → verify

## Parallel Work

The a16n repo auto-discovery feature is being planned/built in parallel. This plugin does NOT depend on that for Phases 1-7. Phase 8 (integration test) requires it.
