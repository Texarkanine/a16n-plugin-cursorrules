# Active Context: GlobalPrompt Name — Complete Implementation

## Current Task
**Phase:** REFLECT - COMPLETE

## What Was Done

All 6 implementation phases complete. 849 tests pass. `GlobalPrompt.name` is now a required field backed by `inferGlobalPromptName(sourcePath)` in `@a16njs/models`. All discovery plugins set `name` at discovery time; all emission plugins consume `gp.name` directly. Zero `as any` casts.

Reflection document written: `memory-bank/reflection/reflection-naming-fix.md`

## Next Step

Run `/niko-archive` to archive this task and clean up the memory bank.
