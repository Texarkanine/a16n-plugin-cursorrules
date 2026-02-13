# a16n-plugin-cursorrules

[a16n](https://github.com/Texarkanine/a16n) plugin for discovering legacy `.cursorrules` files.

## What it does

This plugin reads the legacy `.cursorrules` file (a single plain-text file at the project root) and presents it as a `GlobalPrompt` customization. This enables migration from `.cursorrules` to modern formats like `.cursor/rules/*.mdc` or `CLAUDE.md`.

**Discovery only** — this plugin does not emit/write `.cursorrules` files. The format is legacy and read-only.

## Install

```bash
npm install -g a16n-plugin-cursorrules
```

The plugin is automatically discovered by a16n via the `a16n-plugin-*` naming convention.

## Usage

```bash
# List available plugins (should show cursorrules)
a16n plugins

# Discover what's in a .cursorrules file
a16n discover --from cursorrules .

# Convert .cursorrules to modern Cursor rules
a16n convert --from cursorrules --to cursor .

# Convert .cursorrules to CLAUDE.md
a16n convert --from cursorrules --to claude .
```

## API

The plugin exports a default `A16nPlugin` object:

```typescript
import plugin from 'a16n-plugin-cursorrules';

// plugin.id       === 'cursorrules'
// plugin.name     === 'Legacy .cursorrules'
// plugin.supports === [CustomizationType.GlobalPrompt]

const result = await plugin.discover('/path/to/project');
// result.items: GlobalPrompt[] found in .cursorrules
// result.warnings: Warning[]
```

## Supported types

| Type | Discover | Emit |
|------|----------|------|
| GlobalPrompt | Yes | No (unsupported) |

## License

AGPL-3.0
