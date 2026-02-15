# Product Context: a16n-plugin-cursorrules

## Target Users

- Developers migrating from legacy Cursor `.cursorrules` to modern formats
- Users who want to convert `.cursorrules` content to Claude, Cursor MDC, or other formats
- a16n plugin framework developers (this is a reference third-party implementation)

## Use Cases

1. **Migration:** `a16n convert --from cursorrules --to cursor .` converts legacy `.cursorrules` to modern `.cursor/rules/*.mdc`
2. **Migration:** `a16n convert --from cursorrules --to claude .` converts legacy `.cursorrules` to `CLAUDE.md`
3. **Inspection:** `a16n discover --from cursorrules .` shows what's in a `.cursorrules` file
4. **Plugin listing:** `a16n plugins` shows cursorrules as an available format

## The .cursorrules Format

- Single file at project root: `.cursorrules`
- Plain text content (entire file is the prompt)
- No frontmatter, no YAML, no special structure
- Always-applied (maps to `CustomizationType.GlobalPrompt`)
- Legacy format superseded by `.cursor/rules/*.mdc` with MDC frontmatter

## Constraints

- Must work as a standalone npm package (not part of the a16n monorepo)
- Must be auto-discoverable by the a16n engine via `a16n-plugin-*` naming
- Must use `@a16njs/models` as a peer dependency
- No emission support — `.cursorrules` is a legacy read-only format
