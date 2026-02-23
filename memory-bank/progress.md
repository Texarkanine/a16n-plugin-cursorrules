# Progress: Issue #6 Implementation - COMPLETED

## Task: Fix .cursorrules filename in emission (GitHub Issue #6)

### Phase 1: Investigation ✅ COMPLETED
- Analyzed problem: GlobalPrompt items were losing filename information during emission
- Root cause: a16n framework's emit logic didn't support custom names for GlobalPrompt
- Solution identified: Add optional `name` field to GlobalPrompt interface

### Phase 2: Framework Changes ✅ COMPLETED

**a16n/packages/models/src/types.ts**
- Added `name?: string` field to GlobalPrompt interface (optional, mirrors SimpleAgentSkill pattern)
- Documentation explains purpose: "Name for emission (e.g., 'cursorrules' for .cursorrules files)"

**a16n/packages/plugin-a16n/src/emit.ts**
- Imported `isGlobalPrompt` helper
- Updated `emitStandardIR()` to check `isGlobalPrompt(item) && item.name` before falling back to ID parsing
- Preserves backward compatibility for GlobalPrompts without explicit name

**a16n/packages/plugin-cursor/src/emit.ts**
- Updated GlobalPrompt emission to prefer `gp.name` over `gp.sourcePath || gp.id`
- Uses existing `sanitizeFilename()` function for consistent naming across all types

### Phase 3: Plugin Updates ✅ COMPLETED

**a16n-plugin-cursorrules/src/discover.ts**
- Set `name: 'cursorrules'` on all discovered GlobalPrompt items
- Used `as any` cast (temporary until types propagate)

**a16n-plugin-cursorrules/test/discover.test.ts**
- Added 4 comprehensive tests:
  - Root `.cursorrules` file has name field
  - `.cursorrules.md` variant has name field
  - `.cursorrules.txt` variant has name field
  - All nested files have correct name field

### Phase 4: Verification ✅ COMPLETED
- All 25 cursorrules tests pass
- All 97 plugin-a16n tests pass (existing tests still work)
- All 123 plugin-cursor tests pass (existing tests still work)
- No regressions introduced

### Phase 5: Documentation ✅ COMPLETED
- Created comprehensive investigation document
- Active context updated with current state
- Progress tracked for future reference

## Final Deliverables
✅ a16n framework changes ready for publication
✅ cursorrules plugin changes ready for publication
✅ All tests passing
✅ Backward compatibility maintained
✅ Architecture documented
✅ Type-safe implementation (with temporary `as any` during transition)

## Status: READY FOR PUBLICATION
Awaiting a16n maintainer publication of:
- @a16njs/models@0.10.2+
- @a16njs/plugin-a16n@next
- @a16njs/plugin-cursor@next

## 2026-02-23 - REFLECT - COMPLETE

* Work completed
    - Reflection document written: `memory-bank/reflection/reflection-naming-fix.md`
    - Active context updated to REFLECT - COMPLETE
* Insights
    - TypeScript union type discrimination doesn't narrow object literals pushed into typed arrays — requires `as ConcreteType` cast at push sites
    - Leading-dot file naming in Node.js requires pre-processing before `extname`/`basename` — `inferGlobalPromptName` is the canonical fix
    - Required fields are strictly better than optional fields when the invariant is "always present at all consuming sites"
    - Explicit "Out of Scope" in the plan pays dividends during QA scope reassessment
