# Creative Phase: @a16njs/models Dependency Strategy

## Context

- **System Requirements:**
  - Plugin returns `AgentCustomization` objects consumed by `@a16njs/engine`
  - Objects cross module boundaries (plugin → engine); must be structurally identical
  - Version mismatches should fail at install time, not silently at runtime
  - Plugin must be independently buildable and testable

- **Technical Constraints:**
  - Pre-1.0 semver: `^0.9.0` means `>=0.9.0 <0.10.0` (narrow range)
  - npm 7+ auto-installs peer deps and errors on conflicts
  - Global install (`npm install -g`) shares `node_modules` flat tree
  - `CustomizationType` is a string enum (safe for equality checks across instances)

## Options Evaluated

### Option 1: Direct `dependencies`
- **Rejected.** npm may install duplicate copies. Objects from different module instances could diverge silently on future class-based types. No install-time error on major version conflict.

### Option 2: `peerDependencies` only
- **Rejected (incomplete).** Correct runtime behavior but broken development experience — `tsc` can't find types without dev dependency.

### Option 3: `peerDependencies` + `devDependencies` (CHOSEN)
- Runtime: single copy guaranteed, npm errors on version conflict
- Development: `devDependencies` provides types for build/test
- Industry standard pattern (ESLint, Babel, Webpack, Prettier plugins)

### Option 4: `dependencies` + `peerDependencies`
- **Rejected.** Defeats purpose — npm falls back to bundled dependency instead of erroring.

## Decision

**`peerDependencies` + `devDependencies`, both `"@a16njs/models": "^0.9.0"`**

```json
{
  "peerDependencies": {
    "@a16njs/models": "^0.9.0"
  },
  "devDependencies": {
    "@a16njs/models": "^0.9.0"
  }
}
```

### Rationale
1. Single module instance at runtime — no prototype/identity mismatches
2. Fail-fast: npm errors at install time on incompatible versions
3. Universal plugin ecosystem pattern
4. Independent development works via devDependencies
5. Conservative `^0.9.0` range; widen after verifying each models release

### Implementation Notes
- `devDependencies` entry will reference a published npm version (not `workspace:*`)
- During development, use `npm link @a16njs/models` from the a16n monorepo build output
- CI will install from npm registry
