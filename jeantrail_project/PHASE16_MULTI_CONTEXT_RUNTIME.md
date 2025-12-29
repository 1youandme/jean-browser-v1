**Phase 16 – Multi-Context Runtime**
- Contexts are sovereign
- No silent switching
- User consent required per context

**Context Types**
- `web`
- `proxy`
- `local`
- `emulator`

**Contracts**
- Each context declares `capabilities`, `restrictions`, `auditBoundaries`
- No network calls
- No device access
- No shared mutable state
- No cross-context memory

**Routing**
- Router returns symbolic decisions only
- Requires explicit consent token per target context
- Rejects cross-context memory references
- Logs all routes symbolically

**Switching**
- Explicit context switching only
- Logged symbolically with consent flag
- No execution performed during switching

**Guarantees**
- Isolation is enforced by declarative descriptors
- Decisions are recorded via audit events
- Execution is never performed by the router
