**Phase 17 – Sovereign Privacy & Zero-Trust Core**
- User owns all data
- System forgets by default
- Nothing executes or persists without consent

**Non-Negotiable Rules**
- Additive only
- No telemetry
- No logging of user content
- No hidden memory
- No silent persistence
- No cloud dependency

**DataScope**
- `ephemeral`, `session`, `workspace`, `persistent` (opt-in only)
- No cross-scope reads
- No implicit retention

**Sovereign Consent**
- Token is explicit and scoped
- Required for execution, memory, context switching

**Privacy Kernel**
- Zero trust by default
- Enforces consent boundaries
- Enforces scope isolation
- Symbolic audit only

**Audit**
- `PrivacyAuditEvent` and `PrivacyAuditReport`
- Records decisions without user content
- No telemetry or external reporting
