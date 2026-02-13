# System Patterns: a16n-plugin-cursorrules

## Plugin Architecture

The plugin implements the `A16nPlugin` interface from `@a16njs/models`:

```typescript
interface A16nPlugin {
  id: string;                    // 'cursorrules'
  name: string;                  // 'Legacy .cursorrules'
  supports: CustomizationType[]; // [GlobalPrompt]
  discover(root: string): Promise<DiscoveryResult>;
  emit(models: AgentCustomization[], root: string, options?: EmitOptions): Promise<EmitResult>;
}
```

The plugin exports this as the **default export** of the package entry point.

## Discovery Pattern

Following existing plugins (`plugin-cursor`, `plugin-claude`):

1. Check if `.cursorrules` exists at `root`
2. Read file contents
3. Return as `GlobalPrompt` with `createId()` and `CURRENT_IR_VERSION`
4. Return empty results if file doesn't exist

## Emit Pattern (No-Op)

Since `.cursorrules` is a legacy read-only format:

1. Return all input items as `unsupported`
2. Return empty `written` array
3. No warnings needed (the `supports` array already communicates this is limited)

Wait - actually the plugin supports `GlobalPrompt` in its `supports` array, and we still return everything as unsupported in emit. This is intentional: the plugin can READ GlobalPrompts from `.cursorrules` but cannot WRITE them back. The `supports` array describes what types can be discovered. The emit returning unsupported is the correct behavior per the issue ("NO EMISSION").

**Correction:** The `supports` array is used by both discover and emit. If we list `GlobalPrompt` in supports but can't emit it, that's misleading. Options:
1. List `GlobalPrompt` in supports (accurate for discover, misleading for emit)
2. Empty supports array (misleading for discover)
3. Add separate `discoverySupports` / `emitSupports` to the plugin interface

For now: keep `supports: [GlobalPrompt]` since the existing plugins use it and the emit returning unsupported is self-documenting. If the framework needs to differentiate, that's a framework enhancement.

## Naming Conventions

- Plugin ID: `cursorrules` (derived from package name `a16n-plugin-cursorrules` minus prefix)
- Test fixtures: directories simulating project roots with/without `.cursorrules`
- Source files: `index.ts` (entry), `discover.ts` (logic) — no `emit.ts` needed (inline in index)

## Error Handling

- Missing `.cursorrules`: Return empty `DiscoveryResult` (not an error)
- Empty `.cursorrules`: Return `GlobalPrompt` with empty content (warn? or just return it)
- Read errors: Throw (let the engine handle)
