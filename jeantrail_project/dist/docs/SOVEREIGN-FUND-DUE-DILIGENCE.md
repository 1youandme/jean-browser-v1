# Sovereign Fund Due Diligence Brief — Jean Browser v1

Date: [Insert Date]

## 1. Executive Context
Purpose: Provide a neutral, regulator-readable assessment of Jean Browser v1 with respect to governance integrity, regulatory defensibility, and long-term sovereignty value. This brief excludes financial projections, market hype, and user growth metrics.

## 2. Product Posture (What It Refuses To Do)
- No Vendor-Side Telemetry: The browser excludes analytics, crash reporting, performance, or usage collection. Code paths are removed at compile-time.
- No Silent Updates: Updates require explicit user initiation and signed artifact verification; no background polling or auto-installation.
- No Background Services: All processes terminate on window close; no daemons persist.
- Deny-by-Default Networking: Outbound requests are blocked until the user authorizes per-domain access; no remote toggles.
- No Ad-Tech: No programmatic ads, behavioral targeting, or real-time bidding; sponsorship containers render static, signed assets only.
- Signed-Only Extensions: Only audited, signed modules may execute; sideloading disabled for consumer builds.
- Anti-Fingerprinting Controls: API outputs are standardized/salted; sensitive APIs are permission-gated.
- Reproducible Builds & Published Hashes: Releases are reproducible and accompanied by public hashes for independent verification.

References: `GOVERNANCE-MANIFESTO.md`, `FOUNDATION-IMMUTABILITY-CLAUSE.md`, `THREAT-MODEL.md`.

## 3. Non‑Surveillance Monetization Philosophy
- Static Sponsorships: Manually vetted, static assets; no JavaScript execution; no RTB; attribution without identity.
- Enterprise Licensing: Per-seat/site licenses for governance features (policy push, allow-listing, audit export) without centralized data collection.
- Opt-In Paid Features: Contract-based services (encrypted sync, VPN) with region-respectful hosting; users pay with money, not data.
- Explicit Prohibitions: No data selling, cross-site tracking, fingerprinting, or “free” services contingent on background collection.

Reference: `docs/MONETIZATION-WITHOUT-SURVEILLANCE.md`.

## 4. Absence of Growth‑Risk Vectors
- Ads: No programmatic ad integrations; static sponsorship only.
- Data: No collection of personal data by default; no cloud profiling or reputation calls.
- Dependency: Default operation is local-first; no required SaaS dependency for pilot/evaluation builds.
- Background Capture: No background execution or auto-networking that could scale surveillance risk with growth.
- Remote Control: No remote toggles; policy loads locally only.

## 5. Compliance Readiness Levels
The product’s governance guarantees are defined across three profiles. Full matrix is maintained in `docs/REGULATORY-READINESS.md`.
- Core Sovereign
  - Telemetry: MUST NOT exist
  - Updates: MUST be manual-only and signed
  - Networking: MUST be deny-by-default
  - Extensions: MUST be signed-only; no sideloading
  - Reproducible Builds: SHOULD be provided
  - Audit Logs: MAY be enabled (local-only)
  - Distribution: SHOULD support offline evaluation
- Enterprise Sovereign
  - Telemetry: MUST NOT exist
  - Updates: MUST be manual-only and signed; rollback MUST exist
  - Networking: MUST be deny-by-default; org policy MAY pre-authorize domains
  - Extensions: MUST be signed-only; org allow-list MAY apply
  - Anti-Fingerprinting: MUST be enabled by default
  - Evidence Pack: MUST be published
  - Audit Logs: SHOULD be enabled; export MUST be manual
- Regulated Environment
  - Telemetry: MUST NOT exist
  - Updates: MUST be manual-only, signed, reproducible; rollback MUST exist
  - Networking: MUST be deny-by-default; per-domain approvals MUST be logged
  - Extensions: MUST be signed-only; jurisdictional allow-list MUST apply
  - Indicators: MUST show active subsystems; indicator logs MUST exist
  - Data Residency: MUST support jurisdiction-specific residency for opt-in services
  - DPIA/Assessments: MUST be conducted where required; artifacts MUST be available
  - Offline Distribution: MUST be supported for air-gapped environments

## 6. Governance Integrity
- Immutable Principles: No surveillance, no silent updates, no vendor-side telemetry, no ad-tech. Entrenched by the Foundation’s Immutability Clause.
- Certification Control: Releases must pass compile-time exclusion checks, signature validation, and reproducible build verification; non-compliant artifacts are refused certification.
- Signing Key Control: Foundation controls release/extension signing keys and may revoke for violations.
- Violation Protocol: Offending changes are reverted, publicly flagged, and audited; governance freeze applies until root-cause analysis completes.

References: `FOUNDATION-IMMUTABILITY-CLAUSE.md`, `GOVERNANCE-MANIFESTO.md`.

## 7. Regulatory Defensibility
- Legal Posture: Default builds do not process personal data; vendor is not a controller/processor for the pilot or default usage.
- ePrivacy/GDPR/UK GDPR: No tracking technologies or telemetry; consent banners unnecessary for default operation.
- CCPA/CPRA: No sale or sharing of personal information; opt-out flows generally non-applicable.
- Evidence Pack: Threat model, governance manifesto, monetization policy, and build hashes are provided for independent verification.

Reference: `docs/REGULATORY-READINESS.md`.

## 8. Long‑Term Sovereignty Value
- Architectural Guarantees: Deny-by-default, local-first computation, no remote toggles, and reproducible releases increase institutional trust over time.
- Risk Containment: Absence of telemetry/ad-tech and background services reduces systemic exposure as deployments scale.
- Procurement Alignment: Offline-friendly evaluation and manual updates fit public sector deployment constraints and audit practices.
- Ecosystem Discipline: Signed-only extensions and curated allow-lists prevent erosion of guarantees through third-party code.

## 9. Capital Alignment Risks (What Investors Cannot Influence)
- Telemetry Introduction: Investors cannot direct the addition of vendor-side telemetry or analytics.
- Ad-Tech Integration: Programmatic ads, behavioral targeting, and RTB are prohibited.
- Update Policy: Manual-only, signed updates cannot be converted to silent/auto-update channels.
- Remote Toggles: Feature states cannot be changed by server-side configuration.
- Deny-by-Default: Networking and sensitive capabilities cannot be default-enabled to accelerate growth.
- Governance Amendment: Immutable principles cannot be repealed or suspended to meet revenue targets.
- Certification Standards: Reproducible builds, signature controls, and sandboxed extensions remain mandatory.

Reference: `FOUNDATION-IMMUTABILITY-CLAUSE.md`.

## 10. Conclusion
Jean Browser’s governance-first posture provides clear, enforceable guarantees that align with sovereign and public sector priorities. Its regulatory defensibility derives from non-processing defaults, deny-by-default networking, and transparent evidence packs. The long-term value is in structural sovereignty rather than user-scale metrics, and capital alignment is constrained by immutable governance rules that preserve integrity over growth.

