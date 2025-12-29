# Ninja Advisory Integration — Phase 1

Status: Advisory-only

Scope: Connection layer without runtime authority

Guarantees:
- No modification to RuntimeContext
- No new capabilities
- No execution of actions
- No bidirectional memory sync

Behavior:
- Sends structured decision queries to Ninja
- Receives advisory responses only
- Stores logs under `logs/ninja-advisory` when running in Node
- UI may ignore outputs safely

Removal Safety:
- System runs fully without Ninja
- Removing adapter causes zero breakage
- All outputs are ignorable

Artifacts:
- `src/services/NinjaDecisionAdapter.ts`
- `NinjaDecisionLog.schema.json`
- `PHASE1_ADVISORY_ONLY.md`
