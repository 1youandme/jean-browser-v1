**Phase 15 – Controlled Real Execution**
- Execution is explicitly invoked and never automatic
- Autonomy is bounded and verified before any action
- User sovereignty is absolute with a kill‑switch ethos

**Gating Requirements**
- `isReadyForExecution(state) === true`
- `state.autonomy === 'bounded'`
- Valid user confirmation token present
- Adapter declares `sandboxed === true`

**Adapter Layer**
- Pluggable, swappable adapters implement `execute(action, input)`
- No UI hooks, no network/filesystem/device access except via adapters
- Adapters are required to run in sandboxed contexts

**Execution Modes**
- Symbolic: returned when any gate fails (`status: blocked`)
- Real: returned only when all gates pass and adapter executes

**Execution Receipt**
- Fields: `id`, `timestamp`, `mode`, `status`, `action`, `toolId`, `reversible`, `report`, `data`
- `reversible` true when adapter returns a `rollbackToken`
- `report` conveys adapter‑level audit information

**Reversibility and Reportability**
- Real executions should provide a `rollbackToken` when possible
- All executions are reportable via receipt `report` and `data`

**Sovereignty Guarantees**
- No hidden execution paths
- No hardcoded tools
- Adapters are swappable without refactoring core
