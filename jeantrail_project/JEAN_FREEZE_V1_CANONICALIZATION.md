# Jean v1 Freeze & Canonicalization (Constitutional Document)

**Effective:** v1.0  
**Authority:** Sovereign Product Governor  
**Scope:** Code, Documentation, UX Labels, and Store Artifacts

---

## 1. Freeze v1 Declaration
The following foundations are frozen and may not change without a version bump to v2. Any violation constitutes a breaking change and must be rejected.

- Architecture & Governance
  - The human user is the sole decision authority; absolute veto applies.
  - Execution pipeline separation is mandatory: Planner → User Approval → Scheduler → Executor → Reviewer.
  - Fail‑closed kill switch is mandatory; STOP halts all executors and queues immediately.
- Execution Boundaries
  - No auto‑execution; all tasks require explicit user approval.
  - High‑risk actions require typed confirmation; destructive defaults are deny‑by‑default.
  - No background processing; no silent indexing; no hidden side effects.
- Consent & Privacy
  - Consent is explicit, scoped, time‑bound, revocable; defaults are deny‑by‑default.
  - Local‑first operation with no telemetry and no cloud dependency by default.
  - Data scopes (ephemeral/session/workspace/persistent) must honor opt‑in persistence only.
- Auditability & Explainability
  - Content‑free, local, immutable audit summaries must be maintained.
  - Decision gates and readiness checks must expose pass/fail reasons.
- Legal & Ethical Boundaries
  - No scraping, no bypassing protections, no unauthorized automation.
  - No commerce execution (payments, shipping, brokerage) in v1.
  - Store suggestions are advisory, optional, dismissible, and non‑repeating; no ads or manipulation.
- Mobile Companion Boundaries
  - Read‑only by default; no file access; no task execution; no background processing.
  - Control plane only: consent proposals and global STOP; never execution coupling.
- OCR/PDF Capability Boundaries
  - Local‑only, read‑only, manual start; refuse DRM circumvention; outputs separate from sources.

Forbidden in v1:
- Feature classes that alter execution boundaries (auto‑run, background tasks, external automation).
- Commerce functions (payments, orders, supplier messaging, brokerage).
- Telemetry or cloud training; proxies/IP rotation; always‑on listening.

---

## 2. Canonical Naming Map
All teams must use canonical terms consistently across code, docs, marketing, and UX labels.

| Old/Ambiguous Term | Canonical Term |
| --- | --- |
| Execution | Execution Blueprint |
| Plan | Structured Plan |
| Task | Task Unit |
| Approve | User Approval Checkpoint |
| Ready Gate | Execution Readiness Gate |
| Decision Gate | Policy Decision Gate |
| Thought | Explainability Timeline Event |
| Consent | Scoped Consent Token |
| Audit | Privacy Audit Event |
| Store | Digital Execution Store |
| Blueprint (Store) | Starter Blueprint |
| Recipe (Store) | Execution Recipe |
| Design Kit | Design System |
| Browser | Builder Browser |
| Mobile App | Governance Companion (Jean Mobile) |
| Kill Switch | Global STOP |
| OCR | Local OCR/PDF Extraction |
| Agent | Executor (Worker) |
| Orchestrator/Planner | Planner (Architect) |
| Queue | Scheduler (Gatekeeper) |
| Reviewer | Reviewer (Auditor) |
| Tabs: Local/Web/Emulator/Proxies | Local Tab / Web Tab / Emulator Tab (Experimental) / Proxies Tab (Disabled) |
| Data Scope | Ephemeral / Session / Workspace / Persistent |
| Permissions | Scope & Permission Inspector |
| Suggestions | Advisory Suggestions |

Notes:
- “Agent” must not be used in public‑facing materials; internal references to Executor/Planner/Scheduler/Reviewer only.
- “Browser” must always be qualified as “Builder Browser.”
- “Mobile App” must always be qualified as “Governance Companion.”

---

## 3. Change Control Rules
- Breaking Changes (require v2)
  - Altering authority hierarchy or removing the absolute user veto.
  - Changing the execution pipeline sequence or reducing approval friction.
  - Modifying gate semantics (readiness/decision) or disabling typed confirmations.
  - Introducing background processing, telemetry, cloud dependencies, or auto‑execution.
  - Enabling commerce functions or supplier messaging.
  - Changing mobile companion boundaries (execution/file access/background).
  - Altering OCR/PDF boundaries (DRM bypass, non‑local processing).
  - Renaming canonical terms without an updated canonical map and governance sign‑off.
- Governance Review Required (may proceed only after formal approval; version bump may be required)
  - Any changes to consent models, audit schemas, store manifest schemas, kill switch behavior, or network whitelisting.
  - Any integration, partnership, or pricing structure that could affect user authority or trust signals.
  - Any tab status changes (enabling Proxies; removing Experimental from Emulator).
  - Any modifications to disclaimers, boundaries, or refusal logic.
- Cosmetic Iteration (allowed without version bump; must not change behavior)
  - UX wording improvements that preserve meaning and friction.
  - Documentation clarity updates that preserve canonical terms.
  - Visual theming, iconography, layout adjustments with no functional impact.
  - Reordering non‑functional store categories; adding examples to documentation.

Enforcement:
- This document overrides conflicting language elsewhere.
- Violations must be rejected at review time and cannot be merged under v1.
- All accepted changes must reference compliance with this document.

