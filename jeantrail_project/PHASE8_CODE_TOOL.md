# Phase 8 — Code Tool Plugin Contract

Status: ADDITIVE ONLY (Symbolic, no execution)

Supported Tasks
- Apps
- Sites
- Games

Behavior
- Symbolic only, no execution
- No filesystem access
- No runtime hooks
- No AI calls

Files
- `src/tools/code/CodeToolTypes.ts` defines `CodeTask` and `CodeResult`
- `src/tools/code/CodeToolContract.ts` provides `runCodeTool(task)` returning a placeholder or unsupported

