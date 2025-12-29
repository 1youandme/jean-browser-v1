# Jean Internal Core Architecture

Status: Sovereign, deterministic, offline

Components:
- PolicyGraph: static mapping of decision types to outcomes
- MemorySchema_v1: read-only view over advisory entries
- JeanCoreDecisionEngine: deterministic evaluator using PolicyGraph

Constraints:
- No live calls to Ninja
- No self-modification
- No autonomy
- No external APIs

Logs:
- Ninja logs used as reference only, not dependency
- Core decisions reproducible without logs
