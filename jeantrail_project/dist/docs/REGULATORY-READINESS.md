# Regulatory Readiness Overview

**Product:** Jean Browser (Governance-First, Local-First)  
**Build Types:** Review Builds (UI-only), Operational Builds (v2 roadmap)  
**Principles:** Deny-by-Default, No Telemetry, No Background Services

## Data Flow Declaration
- Default Operation
  - No user analytics, no behavioral telemetry, no fingerprinting, no cloud profiling.
  - No background services; all processes terminate when the main window closes.
  - Networking occurs only after explicit user action; per-domain authorization is required.
  - Static sponsorships render from local or signed static configuration; no third-party requests.
  - Updates are manual-only; no silent checks or downloads.
- Optional, Opt-In Features (Operational builds)
  - Encrypted sync: User-opt-in; zero-knowledge design; region-selectable hosting; contract basis.
  - VPN/Proxy: User-opt-in; service provider selection with clear jurisdiction; no data retained beyond operational necessity.
  - Local-only AI: No cloud API calls; model weights are bundled or manually downloaded.

## Legal Basis and Applicability
- Default usage (no personal data processed)
  - GDPR/UK GDPR/CCPA/CPRA: Largely non-applicable due to absence of personal data processing by the vendor.
  - ePrivacy: No tracking cookies or analytics; consent banners not required.
  - DMA: Not a gatekeeper; obligations related to gatekeepers are non-applicable.
- Opt-in services (if enabled by user)
  - Contract: Provision of paid services (encrypted sync, VPN) is justified under contract.
  - Legitimate Interest: Static sponsorship display without tracking; minimal necessary processing limited to local rendering.
  - Data Minimization: Only data strictly required to deliver the opted-in service; retention limits defined per service and region.
  - Transparency: Clear disclosures in-product; no dark patterns; refusal surfaces always visible.

## Regional Compliance Posture

### European Union (GDPR, ePrivacy, DMA)
- GDPR
  - Default: No personal data processing; no controller/processor roles engaged for analytics or profiling.
  - Opt-in: Contract as lawful basis for paid services; Data Processing Agreement (DPA) available for enterprise deployments.
  - Rights: Access/Deletion typically non-applicable by default; for opt-in services, users can exercise rights via local controls and service portals.
  - DPIA: Not required for default; recommended for enterprise deployments where policies interact with sensitive environments.
- ePrivacy
  - No third-party cookies, pixels, or trackers; no consent banner necessary for default operation.
  - Fingerprinting mitigated; APIs gated; anti-fingerprinting controls documented.
- DMA
  - Non-gatekeeper posture; no self-preferencing of ad-tech; extension ecosystem limited to signed, audited modules; interoperability provided via documented interfaces without remote control channels.

### United Kingdom (UK GDPR/PECR)
- UK GDPR mirrors EU posture:
  - Default: No processing; controller obligations minimally engaged.
  - Opt-in services: Contract basis; transparent disclosures; retention and data residency configurable.
- PECR
  - No tracking technologies; consent banners not required for default operation.
- Age Appropriate Design
  - No collection of children’s data; high-privacy defaults; parental controls not required by default.

### United States (CCPA/CPRA)
- Do Not Sell/Share
  - Not applicable; no sale or sharing of personal information.
- Sensitive Personal Information
  - Not processed by default; opt-in services avoid SPI unless operationally necessary and consented.
- GPC/Opt-Out
  - No tracking, so opt-out flows are not required; still honored where presented.
- Notices
  - Clear, in-product notices for opt-in services; no dark patterns; manual updates only.

### MENA and Data Localization Sensitive Regions
- Default: Local-first architecture; no cross-border transfers by the vendor.
- Enterprise/Opt-in Services
  - Region-selectable hosting for encrypted sync; data residency commitments defined contractually.
  - Offline distribution supported (portable builds, regional mirrors) to satisfy localization and connectivity constraints.
- Government and Critical Infrastructure
  - Local policy engine; audit logs remain on-prem; no remote management or silent toggles.

## Controls and Auditability
- Compile-time exclusion of telemetry and analytics; no latent code paths.
- Manual-only, signed updates; reproducible builds with published hashes.
- Governance-gated features with visible refusal surfaces (STOP/HALT).
- Local-only audit logs (enterprise option); never uploaded automatically.
- Extension sandbox; signed-only; strict permission gating and isolated execution.

## Evidence Pack (References)
- Threat Model: `docs/THREAT-MODEL.md`
- Monetization Without Surveillance: `docs/MONETIZATION-WITHOUT-SURVEILLANCE.md`
- Governance Manifesto: `E:\manager\project_unpacked\jeantrail_project\GOVERNANCE-MANIFESTO.md`
- Governance-Gated Features (v2): `E:\manager\project_unpacked\jean-browser-v2\docs\GOVERNANCE-GATED-FEATURES.md`
- Execution Roadmap (v2): `E:\manager\project_unpacked\jean-browser-v2\docs\EXECUTION-ROADMAP.md`

## Regulator-Facing Summary
- Jean Browser operates with no telemetry, no tracking, and no background services by default.
- Any network activity or feature enablement requires explicit user action and is visibly auditable.
- Optional services are offered on a contract basis with region-respectful hosting and strict data minimization.
- The architecture is designed to exceed privacy expectations and simplify compliance across jurisdictions.

## Compliance Profiles Matrix

| Requirement | Core Sovereign | Enterprise Sovereign | Regulated Environment |
| :--- | :--- | :--- | :--- |
| Vendor Telemetry | MUST NOT exist | MUST NOT exist | MUST NOT exist |
| Background Services | MUST NOT persist after window close | MUST NOT persist | MUST NOT persist |
| Updates | MUST be manual-only and signed | MUST be manual-only and signed; rollback MUST exist | MUST be manual-only, signed, reproducible; rollback MUST exist |
| Networking Default | MUST be deny-by-default | MUST be deny-by-default; org policy MAY pre-authorize domains | MUST be deny-by-default; per-domain approvals MUST be logged |
| Extensions | MUST be signed-only; no sideloading | MUST be signed-only; org allow-list MAY apply | MUST be signed-only; jurisdictional allow-list MUST apply |
| Ad-Tech | MUST NOT be present | MUST NOT be present | MUST NOT be present |
| Remote Toggles | MUST NOT be supported | MUST NOT be supported | MUST NOT be supported |
| Active Subsystem Indicators | MUST show for network/mic/cam/location | MUST show; admin visibility SHOULD be enabled | MUST show; regulator-facing indicator log MUST exist |
| Anti-Fingerprinting | SHOULD be enabled by default | MUST be enabled by default | MUST be enabled and documented per jurisdiction |
| Reproducible Builds + Hashes | SHOULD be provided | MUST be provided | MUST be provided and independently verifiable |
| Audit Logs (Local) | MAY be enabled | SHOULD be enabled; export MUST be manual | MUST be enabled; export MUST be manual/on-prem only |
| Optional Services (Sync/VPN) | MAY be offered via explicit opt-in | MAY be offered; contract + residency controls SHOULD apply | MAY be offered only under contract; residency controls MUST apply |
| Data Residency | N/A by default | SHOULD support region selection for opt-in services | MUST support jurisdiction-specific residency for opt-in services |
| DPIA / Assessments | N/A by default | SHOULD be conducted for sensitive deployments | MUST be conducted where required; artifacts MUST be available |
| Governance Sign-Off | SHOULD precede major changes | MUST precede major changes | MUST precede changes; regulator-acceptable evidence MUST be retained |
| Evidence Pack Availability | SHOULD be published | MUST be published | MUST be published with jurisdictional addenda |
| Safe Browsing/Reputation Calls | MUST NOT in default | MUST NOT in default; org MAY add offline lists | MUST NOT in default; any reputation use MUST be local-only |
| Consent Prompts | MUST be specific, time-bound, reversible | MUST be specific; enterprise policies MAY pre-scope prompts | MUST be specific; prompts and decisions MUST be auditable |
| Policy Push / Central Control | N/A | MAY enforce deny-by-default and allow-lists | MUST enforce deny-by-default and allow-lists within scope |
| Offline Distribution | SHOULD be supported | SHOULD be supported | MUST be supported for air-gapped environments |
