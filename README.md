# a16n-plugin-cursorrules

[![npm version](https://img.shields.io/npm/v/a16n-plugin-cursorrules.svg)](https://www.npmjs.com/package/a16n-plugin-cursorrules    )
[![codecov](https://codecov.io/gh/Texarkanine/a16n-plugin-cursorrules/graph/badge.svg)](https://codecov.io/gh/Texarkanine/a16n-plugin-cursorrules)

[a16n](https://github.com/Texarkanine/a16n) plugin for discovering legacy `.cursorrules` files.

This plugin reads the [legacy Cursor `.cursorrules` file](https://web.archive.org/web/20250130024806/https://docs.cursor.com/context/rules-for-ai) and presents it as a `GlobalPrompt` customization.

* ⚠️ **Discovery only** - this plugin does not emit `.cursorrules` files. The format is legacy and read-only.
* **Tryhard Support** - this plugin also finds technically-out-of-spec file patterns that were commonly used in the `.cursorrules` era:
    - `.cursorrules.md`
    - `.cursorrules.txt`

This enables migration from `.cursorrules` to modern formats.

## Install

```bash
npm install -g a16n-plugin-cursorrules
```

The plugin is automatically discovered by a16n via the [`a16n-plugin-*` naming convention](https://texarkanine.github.io/a16n/plugin-development/).

## Usage

Migrate off legacy `.cursorrules` to modern Cursor rules:

```bash
a16n convert --from cursorrules --to cursor .
```

## Supported types

| Type | Discover | Emit |
|------|----------|------|
| GlobalPrompt | Yes | No (unsupported) |
