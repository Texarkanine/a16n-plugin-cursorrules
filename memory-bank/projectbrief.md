# Project Brief: a16n-plugin-cursorrules

## Purpose

Third-party a16n plugin that discovers the legacy `.cursorrules` file format used by Cursor IDE. This is a **discovery-only** plugin — it reads `.cursorrules` but does not emit/write it.

## Goals

1. **Primary:** Provide `.cursorrules` discovery as a standalone npm package (`a16n-plugin-cursorrules`)
2. **Secondary:** Serve as the first real-world smoke test of the a16n plugin framework's third-party plugin support and auto-discoverability
3. **Validation:** Prove that the `a16n-plugin-*` naming convention enables automatic discovery by the a16n CLI/engine

## Scope

- Discover `.cursorrules` file at project root
- Parse as `GlobalPrompt` customization type
- Return unsupported for all emit operations (legacy format, read-only)
- Package as independently installable npm package

## Non-Goals

- Emission support (explicitly excluded per design)
- Support for the modern `.cursor/rules/*.mdc` format (that's `@a16njs/plugin-cursor`)
- Documentation site (README is sufficient)

## Success Criteria

- `npm install -g a16n && npm install -g a16n-plugin-cursorrules` causes:
  - `a16n plugins` to show `cursorrules` plugin
  - `--from cursorrules` to be accepted on the CLI
  - `--to cursorrules` to gracefully report unsupported items
- All tests pass
- CI/CD pipeline functional with release-please
