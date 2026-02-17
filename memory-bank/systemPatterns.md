# System Patterns: a16n-plugin-cursorrules

## Plugin Architecture

The plugin implements the `A16nPlugin` interface from `@a16njs/models`:

```typescript
interface A16nPlugin {
  id: string;                                  // 'cursorrules'
  name: string;                                // 'Legacy .cursorrules'
  supports: CustomizationType[];               // [GlobalPrompt]
  pathPatterns?: PluginPathPatterns;            // optional path patterns
  discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult>;
  emit(models: AgentCustomization[], rootOrWorkspace: string | Workspace, options?: EmitOptions): Promise<EmitResult>;
}
```

The plugin exports this as the **default export** of the package entry point.

### Workspace Parameter Handling

Both `discover()` and `emit()` accept `string | Workspace`. The plugin uses `resolveRoot()` from `@a16njs/models` to extract the root path string, then continues using `node:fs/promises` directly. This matches the pattern used by the built-in plugins (plugin-cursor, plugin-claude).

```typescript
import { resolveRoot, type Workspace } from '@a16njs/models';

export async function discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
  const root = resolveRoot(rootOrWorkspace);
  // ... use root string with node:fs/promises as before
}
```

## Discovery Pattern

Following existing plugins (`plugin-cursor`, `plugin-claude`):

1. Accept `string | Workspace` and extract root via `resolveRoot()`
2. Recursively traverse directory tree for `.cursorrules`, `.cursorrules.md`, `.cursorrules.txt`
3. Skip well-known non-project directories (node_modules, .git, etc.)
4. Return each match as `GlobalPrompt` with `createId()` and `CURRENT_IR_VERSION`
5. Set `relativeDir` for files in subdirectories (posix-normalized)
6. Return empty results if no files found

## Emit Pattern (No-Op)

Since `.cursorrules` is a legacy read-only format:

1. Accept `string | Workspace` (parameter is unused)
2. Return all input items as `unsupported`
3. Return empty `written` array
4. No warnings needed

The plugin lists `GlobalPrompt` in `supports` because it can discover GlobalPrompts. Emit returning all items as unsupported is intentional and self-documenting — the format is legacy/read-only.

## Naming Conventions

- Plugin ID: `cursorrules` (derived from package name `a16n-plugin-cursorrules` minus prefix)
- Test fixtures: directories simulating project roots with/without `.cursorrules`
- Source files: `index.ts` (entry), `discover.ts` (logic) — no `emit.ts` needed (inline in index)

## Error Handling

- Missing `.cursorrules`: Return empty `DiscoveryResult` (not an error)
- Empty `.cursorrules`: Return `GlobalPrompt` with empty content
- Read errors on individual files: Silently skip (continue traversal)
- Unreadable directories: Silently skip (continue traversal)
