# Phase 11 — Self-Verification Policy

Status: ADDITIVE ONLY (Deterministic policy, no AI)

Policy
- Trust: Output verified as `pass`.
- Rework: Output verified as `warn`.
- Refusal: Output verified as `fail`.

Execution Gate
- Failed verification blocks execution.
- Warning requires rework before any execution path.
- Only `pass` can proceed to a future execution gate.

Files
- `src/verify/VerificationPolicy.ts`
- `src/verify/Verifier.ts`
- `src/verify/VerificationTypes.ts`

