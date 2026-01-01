# Public Governance Launch — Jean Browser v1.1 (Review Build, Non‑Operational)

Date: [Insert Date]

## Positioning
- This is not a product launch. It is a governance disclosure milestone.
- The v1 review build is non-operational by design and intended solely for UI and governance posture evaluation.
- No adoption push is made or implied.

## Refusals By Design
- No vendor-side telemetry (analytics, crash reporting, usage collection are excluded at build time).
- No silent updates (manual-only; signed artifacts; no background polling).
- No background services (all processes terminate when the window closes).
- Deny-by-default networking (no outbound requests without explicit per-domain authorization).
- No ad-tech (no programmatic ads, behavioral targeting, or RTB; static sponsorship assets only).
- No remote toggles (feature states cannot be changed by server-side configuration).
- Signed-only extensions (audited; sideloading disabled in consumer contexts).
- Anti-fingerprinting controls (standardized/salted API outputs; sensitive APIs permission-gated).
- Reproducible builds with published hashes for independent verification.

## Why The Build Is Non-Operational
- Scope is limited to UI rendering and governance posture verification.
- Networking and dynamic execution paths are out of scope for public review.
- Air-gapped friendly: evaluation does not require internet connectivity.
- Updates are manual-only; no background or silent update channels exist.
- Sponsorships render as static, signed assets; no third-party requests or scripts execute.

## Public Review Guidance
- Verify release hashes against published references (reproducible build expectation).
- Inspect visible indicators for active subsystems (network/microphone/camera/location) in applicable UI flows.
- Confirm denial surfaces and STOP/HALT controls are visible and non-deceptive.
- Observe process lifecycle: no background services should persist after window close.
- Confirm absence of telemetry: no analytics endpoints or crash-reporting destinations should be reachable.
- Review governance artifacts to assess consistency and auditability of guarantees.

## Governance Documents Location
- Governance Manifesto: `e:\manager\project_unpacked\jeantrail_project\GOVERNANCE-MANIFESTO.md`
- Foundation Immutability Clause: `e:\manager\project_unpacked\jeantrail_project\docs\FOUNDATION-IMMUTABILITY-CLAUSE.md`
- Regulatory Readiness (including compliance profiles): `e:\manager\project_unpacked\jeantrail_project\docs\REGULATORY-READINESS.md`
- Threat Model: `e:\manager\project_unpacked\jeantrail_project\docs\THREAT-MODEL.md`
- Monetization Without Surveillance: `e:\manager\project_unpacked\jeantrail_project\docs\MONETIZATION-WITHOUT-SURVEILLANCE.md`

## Explicit Statement: No Adoption Push
- The review build is provided to enable public and institutional scrutiny of governance guarantees.
- No calls to action for deployment, onboarding, or user adoption are included in this announcement.

## Sealing Notice
- v1 is governance‑locked and non‑operational (no runtime, no browsing, no kernel).
- STOP / HALT is final.
- v1 will never receive functional updates; any future functionality will occur in v2+.

## v1.1 Notice
- v1.1 is a non‑functional refinement of a sealed governance artifact.
- Changes are presentation‑only to improve clarity for reviewers and regulators.
- Operational status remains unchanged under Governance Lock.
- Operational builds and optional services (e.g., encrypted sync, VPN) are out of scope.

## Legal Posture Summary
- Default operation: no personal data processing by the vendor.
- No controller/processor role established for review builds under GDPR/UK GDPR/ePrivacy/CCPA/CPRA.
- No tracking cookies, pixels, or fingerprinting implemented for public review.
