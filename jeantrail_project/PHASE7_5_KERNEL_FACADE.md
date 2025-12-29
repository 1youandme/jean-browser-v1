# Phase 7.5 — Kernel Facade

Status: CONTRACT LAYER ONLY (Additive, pure, decoupled)

Declaration
- This file defines the ONLY legal entry point to the kernel pipeline.
- Internal modules must never be called directly from outside this facade.
- No runtime wiring is allowed in this phase.

Pipeline
- `runKernel(input)` calls, in order:
  - `detectIntent`
  - `decide`
  - `isActionAllowed`
  - `executeWithAutonomy`

Scope
- Additive only
- Pure functions only
- No side effects
- No execution wiring
- No AI usage
- No comments in code
- Do not modify existing files

