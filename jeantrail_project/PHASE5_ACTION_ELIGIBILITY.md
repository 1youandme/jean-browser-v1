# Phase 5 — Action Eligibility Matrix (Step 5.4)

Status: ADDITIVE ONLY (Silent, deterministic logic)

Scope
- No execution
- No behavior change
- No UI
- No runtime hooks
- No timers
- No logs
- No AI usage
- Pure functions only
- Not wired anywhere before Phase 6

Behavior
- Determines whether an action is allowed or denied based on decision and presence state.
- Returns only `allowed` or `denied`.
- Does not trigger actions or modify state.

Files
- `src/action/ActionTypes.ts`
- `src/action/ActionPolicy.ts`
- `src/action/ActionEligibility.ts`

Phase Policy
- Last silent layer before Phase 6.
- Must NOT be wired before Phase 6.

