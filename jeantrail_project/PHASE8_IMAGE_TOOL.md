# Phase 8 — Image Tool Plugin Contract

Status: ADDITIVE ONLY (Symbolic description, no execution)

Scope
- Same kernel constraints apply
- No canvas, no rendering, no AI calls
- No runtime hooks

Contract
- `ImageToolTypes.ts` defines `ImageTask` and `ImageResult`
- `ImageToolContract.ts` exposes `runImageTool(task)` returning description only:
  - prompt
  - resolution
  - style
  - output metadata

Declaration
- Symbolic only, no execution

