# Jean Sovereign Risk Audit (Permanent Reference)

**Role:** Sovereign Product Architect & Risk Auditor  
**Scope:** Builder Browser, Execution Blueprint, Task System, Store, Mobile Companion, OCR, Marketing Narrative, GTM Plan  
**Principle:** Trust-first, fail-closed, consent-bound, local-only by default

---

## 1. Non-Negotiable Foundations (HARD FREEZE)
- Governance Sovereignty (HARD FREEZE)
  - The human user is the sole decision authority.
  - Zero autonomy: systems never execute without explicit approval.
  - Mandatory STOP: kill switch halts execution immediately; no override.
- Execution Boundaries (HARD FREEZE)
  - Planner cannot execute; Executor acts only after Scheduler approval.
  - High-risk actions require typed confirmation; destructive defaults are deny-by-default.
- Consent & Privacy (HARD FREEZE)
  - Consent is explicit, scoped, time-bound, and revocable.
  - Data scopes: ephemeral/session/workspace/persistent with opt-in persistence only.
  - No telemetry, no background processing, no cloud dependency by default.
- Auditability & Explainability (HARD FREEZE)
  - Content-free audit logs are local, immutable, and human-readable.
  - Decision gates and readiness checks are visible with pass/fail reasons.
- Ethical Monetization (HARD FREEZE)
  - No ads, no behavioral manipulation, no data sale.
  - Suggestions ≠ ads; store items are optional, dismissible, and non-repeating.
- Legal Boundaries (HARD FREEZE)
  - No scraping, no bypass of protections, no unauthorized automation.
  - No commerce execution (payments, shipping, brokerage) in V1.
- Mobile Companion Limits (HARD FREEZE)
  - Read-only, no file access, no task execution, no background processing.
  - Control plane only: consent proposals and global HALT, never execution coupling.
- Local-First OCR/PDF (HARD FREEZE)
  - Local-only, read-only, manual start; refuses DRM circumvention; outputs separate from sources.

---

## 2. Anticipated Risk Scenarios

### Technical
- Risk: Execution creep from Planner to Executor
  - Emergence: Convenience pressure to “auto-run easy tasks.”
  - Signals: Planner emitting runnable scripts; hidden auto-start flags; reduced confirmations.
  - Mitigation: Fail-closed; enforce separation; require approval checkpoints; ban auto-run.
- Risk: Tight coupling between UX and runtime
  - Emergence: UI changes that silently alter executor behavior.
  - Signals: UI toggles that change execution without review; missing plan preview.
  - Mitigation: Redesign; maintain strict “Plan → Approve → Execute” pipeline; refuse hidden side-effects.
- Risk: Background processing introduced
  - Emergence: Indexers or “smart assistants” running continuously.
  - Signals: CPU/GPU spikes at idle; periodic disk/network touches.
  - Mitigation: Delay; disable background tasks; require manual start and visible status.

### Legal
- Risk: Jurisdictional data handling violations
  - Emergence: Accidental cloud sync or telemetry defaults.
  - Signals: External endpoints in configs; unreviewed analytics SDKs.
  - Mitigation: Refusal; local-only enforcement; SBOM/legal review before any external dependency.
- Risk: Commerce misunderstandings
  - Emergence: Store language implying purchasing or brokerage.
  - Signals: “Buy,” “Order,” “Checkout” copy in UI or documentation.
  - Mitigation: Rename; replace with “Inspiration,” “Blueprint,” “Recipe”; explicit disclaimers.
- Risk: Terms-of-service breaches
  - Emergence: Automation against protected sites.
  - Signals: Headless navigation, scraping modules, captcha bypass attempts.
  - Mitigation: Fail-closed; hard-block automation; suggest official APIs only when user-authorized.

### Ethical
- Risk: Dark patterns for engagement
  - Emergence: nags, pop-ups, or growth hacks.
  - Signals: time-on-page goals; “rate us” interruptions; coercive prompts.
  - Mitigation: Refusal; remove engagement metrics; adopt “time saved” outcomes only.
- Risk: Autonomy creep messaging
  - Emergence: marketing suggesting “agent does the work.”
  - Signals: copy implying replacement; promises of unsupervised execution.
  - Mitigation: Rename; reinforce “glass box, human-in-the-loop” language; review content.
- Risk: Trust erosion via hidden context use
  - Emergence: system reading files without disclosure.
  - Signals: unexplained access to non-selected paths.
  - Mitigation: Fail-closed; context chips listing read files; permission prompts per path.

### Market
- Risk: Mispositioning as general browser or agent platform
  - Emergence: feature parity marketing vs. Chrome/agents.
  - Signals: comparisons implying casual browsing or autonomous agents.
  - Mitigation: Rename; emphasize “Builder Browser”; avoid agent claims; highlight planning/execution separation.
- Risk: Wrong customer pressure
  - Emergence: demands for scraping, commerce, or automation.
  - Signals: roadmap requests from prospects for disallowed features.
  - Mitigation: Refusal; point to Non-Negotiables; offer advisory alternatives only.

### Organizational
- Risk: Feature creep before governance review
  - Emergence: unvetted PRs enabling execution or telemetry.
  - Signals: merges touching executor paths or adding analytics without audit.
  - Mitigation: Delay; require governance checklist; block until sign-off.
- Risk: Premature enterprise sales
  - Emergence: pilots without maturity milestones.
  - Signals: bespoke requests for surveillance or admin overrides.
  - Mitigation: Refusal; enforce Enterprise Preparation phase; deny “boss-ware.”

---

## 3. Experiment-Safe Zone
- UX wording
  - Allowed: Clearer labels, error phrasing, trust messages.
  - Boundaries: No autonomy or replacement claims; no commerce language.
- Store content types
  - Allowed: Blueprints, recipes, design systems that are additive and ejectable.
  - Boundaries: No items implying payments, scraping, or external automation.
- Task system education
  - Allowed: Thought-slot phrasing, tutorial prompts, non-executing demos.
  - Boundaries: No auto-run; no hidden actions; advisory-only.
- Pricing presentation
  - Allowed: Structure exploration (tiers, naming) without amounts.
  - Boundaries: No urgency timers, FOMO, or upsell flows; no revenue-driven authority changes.

---

## 4. Deferred Capabilities Register
- Autonomous payments
  - Why: High-stakes risk; requires escrow logic and multi-step confirmations.
  - Condition: Proven multi-layer approvals and reversible transactions.
  - Breaks early: Financial loss, trust collapse.
- Supplier messaging / RFQs
  - Why: Legal and TOS exposure; misinterpreted as brokerage.
  - Condition: Legal framework and explicit user-side systems.
  - Breaks early: Platform bans; legal liability.
- Cloud model training / telemetry
  - Why: Sovereignty breach; privacy risk.
  - Condition: Opt-in federated designs with strong anonymization.
  - Breaks early: Irreversible data leakage; regulatory risk.
- Social graph integrations
  - Why: Consent complexity and third-party data issues.
  - Condition: Clear per-identity consent; sandboxed read-only viewers.
  - Breaks early: Privacy violations; trust erosion.
- Proxies / IP rotation
  - Why: Abuse potential; TOS risk.
  - Condition: Enterprise-only, single static proxy with compliance.
  - Breaks early: Blocklists; reputational damage.
- Always-on listening
  - Why: Surveillance concerns.
  - Condition: Hardware indicators, tight buffers, explicit modes.
  - Breaks early: User anxiety; adoption drop.
- Third-party automation
  - Why: TOS violations; security risks.
  - Condition: Official APIs with granular consent and proofs.
  - Breaks early: Account bans; legal exposure.

---

## 5. Governance Drift Prevention Checklist
- Feature additions
  - Non-Negotiables referenced; confirm no execution coupling or telemetry.
  - Data flow mapped; consent scopes and approvals defined.
  - Risk rating set; high-risk gates enforced; audit entries maintained.
  - Legal review for TOS and jurisdictions; documentation updated.
- Partnerships
  - Confirm no authority escalation; no surveillance features.
  - Verify local-only defaults; no dependency that requires cloud tracking.
  - Clear joint responsibilities; refusal paths documented.
- Pricing changes
  - No dark patterns; no urgency tactics; no autonomy trade-offs.
  - Ethical monetization preserved; suggestions remain advisory.
  - Docs updated with boundaries and user rights.
- Enterprise conversations
  - Enforce “Sovereignty at Scale”: deny boss-ware; no remote view/execute.
  - Provide compliance pack; maintain user-first control plane.
  - Defer custom features until preparation milestones are met.

---

## 6. Final Sovereignty Declaration
- What Jean will never become
  - A surveillance platform, a marketplace broker, a scraping engine, or an autonomous agent that acts without you.
- What users can always rely on
  - Local-first operation, explicit consent, fail-closed safety, human-in-the-loop control, and content-free auditability.
- Why this product is safe by design
  - Governance is hard-frozen; execution requires approval; privacy is enforced by default; legal boundaries are structural; monetization never overrides trust.

