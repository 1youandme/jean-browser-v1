# Phase 7 — Bounded Autonomy

Status: ADDITIVE ONLY (High constraint, execution gated)

Purpose
- Autonomy is bounded and requires explicit approval via mode.
- Wraps the Controlled Executor with limits and modes.
- No AI or ML used.
- No automatic execution paths exist.

Modes
- `disabled`: autonomy off; returns `autonomy_disabled`.
- `manual`: requires human or shell approval; returns `rejected`.
- `bounded`: limited execution allowed within budget.

Budget
- Execution attempts must be below a given limit.
- If exceeded, returns `quota_exceeded`.

Philosophy
- Kill switch via mode `disabled`.
- Manual mode exists to require explicit approval.
- Autonomy is OFF by default.

Files
- `src/autonomy/AutonomyTypes.ts`
- `src/autonomy/AutonomyBudget.ts`
- `src/autonomy/BoundedExecutor.ts`

