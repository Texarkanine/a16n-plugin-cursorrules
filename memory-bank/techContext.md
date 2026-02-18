# Tech Context: a16n-plugin-cursorrules

## Language & Runtime

- **Language:** TypeScript 5.4+
- **Runtime:** Node.js 18+ (match a16n's `engines` requirement)
- **Module system:** ESM (`"type": "module"`)

## Dependencies

- **Peer:** `@a16njs/models ^0.10.0` (types + CustomizationType enum + helpers)
- **Dev:** `@a16njs/models ^0.10.0`, TypeScript, Vitest, @types/node, rimraf

## Build

- **Compiler:** `tsc` (TypeScript compiler, no bundler)
- **Output:** `dist/` directory
- **tsconfig:** Extends conventions from a16n (ES2022, ESNext modules, bundler resolution, strict)

## Testing

- **Framework:** Vitest with globals
- **Pattern:** `test/**/*.test.ts`
- **Fixtures:** `test/fixtures/` with sample project directories
- **Coverage:** v8 provider, lcov + text reporters

## Package Structure

```text
a16n-plugin-cursorrules/
├── src/
│   ├── index.ts          # Plugin default export
│   └── discover.ts       # Discovery logic
├── test/
│   ├── fixtures/         # Test project directories
│   ├── discover.test.ts  # Discovery tests
│   └── index.test.ts     # Plugin interface tests
├── dist/                 # Build output (gitignored)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .nvmrc
├── LICENSE               # AGPL-3.0 (already exists)
└── README.md
```

## CI/CD

- **CI:** GitHub Actions — build, typecheck, test with coverage
- **Release:** release-please (single package, not monorepo)
- **Publish:** npm OIDC trusted publishing

## npm Package

- **Name:** `a16n-plugin-cursorrules` (unscoped, matches auto-discovery pattern)
- **Main:** `./dist/index.js`
- **Types:** `./dist/index.d.ts`
- **Files:** `["dist"]`

## Conventions (from a16n)

- AGPL-3.0 license
- `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo` gitignored
- Vitest for testing, v8 for coverage
- No ESLint/Prettier (matching a16n's current state)
