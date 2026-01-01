# Regulatory Submission — Jean Browser v1

Date: [Insert Date]
Status: Formal Compliance Submission

## 1. Executive Summary
- Product: Jean Browser v1 (Governance‑First, Local‑First)
- Default Operation: No vendor‑side personal data processing; no telemetry; deny‑by‑default networking; manual‑only signed updates
- Purpose: Provide regulator‑readable requirements and evidence for compliance assessment; exclude marketing and aspirational claims

## 2. System Scope and Defaults
- Build Classification: Review build (non‑operational browsing); UI and governance posture evaluation only
- Data Processing: Vendor does not act as controller or processor in default operation
- Networking: Outbound requests are blocked until explicit user authorization per domain
- Background Services: Processes terminate when the primary window closes; no daemons persist
- Extensions: Signed‑only; sideloading disabled in consumer builds
- Ad‑Tech: Not integrated; sponsorship surfaces are static, signed assets only

## 3. Compliance Profiles Matrix

| Requirement | Core Sovereign | Enterprise Sovereign | Regulated Environment |
| :--- | :--- | :--- | :--- |
| Vendor Telemetry | MUST NOT exist | MUST NOT exist | MUST NOT exist |
| Background Services | MUST NOT persist after window close | MUST NOT persist | MUST NOT persist |
| Updates | MUST be manual‑only and signed | MUST be manual‑only and signed; rollback MUST exist | MUST be manual‑only, signed, reproducible; rollback MUST exist |
| Networking Default | MUST be deny‑by‑default | MUST be deny‑by‑default; org policy MAY pre‑authorize domains | MUST be deny‑by‑default; per‑domain approvals MUST be logged |
| Extensions | MUST be signed‑only; no sideloading | MUST be signed‑only; org allow‑list MAY apply | MUST be signed‑only; jurisdictional allow‑list MUST apply |
| Ad‑Tech | MUST NOT be present | MUST NOT be present | MUST NOT be present |
| Remote Toggles | MUST NOT be supported | MUST NOT be supported | MUST NOT be supported |
| Indicators | MUST show for network/mic/cam/location | MUST show; admin visibility SHOULD be enabled | MUST show; regulator‑facing indicator log MUST exist |
| Anti‑Fingerprinting | SHOULD be enabled by default | MUST be enabled by default | MUST be enabled and documented per jurisdiction |
| Reproducible Builds + Hashes | SHOULD be provided | MUST be provided | MUST be provided and independently verifiable |
| Audit Logs (Local) | MAY be enabled | SHOULD be enabled; export MUST be manual | MUST be enabled; export MUST be manual/on‑prem only |
| Optional Services | MAY be offered via explicit opt‑in | MAY be offered; contract + residency controls SHOULD apply | MAY be offered only under contract; residency controls MUST apply |
| Data Residency | N/A by default | SHOULD support region selection | MUST support jurisdiction‑specific residency |
| DPIA / Assessments | N/A by default | SHOULD be conducted for sensitive deployments | MUST be conducted where required; artifacts MUST be available |
| Governance Sign‑Off | SHOULD precede major changes | MUST precede major changes | MUST precede changes; regulator‑acceptable evidence MUST be retained |
| Evidence Pack | SHOULD be published | MUST be published | MUST be published with jurisdictional addenda |
| Safe Browsing/Reputation | MUST NOT in default | MUST NOT in default; org MAY add offline lists | MUST NOT in default; any reputation use MUST be local‑only |
| Consent Prompts | MUST be specific, time‑bound, reversible | MUST be specific; policies MAY pre‑scope prompts | MUST be specific; prompts and decisions MUST be auditable |
| Policy Push | N/A | MAY enforce deny‑by‑default and allow‑lists | MUST enforce deny‑by‑default and allow‑lists within scope |
| Offline Distribution | SHOULD be supported | SHOULD be supported | MUST be supported for air‑gapped environments |

## 4. RFC‑Style Requirements (Testable)
- Telemetry
  - The browser MUST NOT include telemetry, analytics, crash, or usage code paths
  - Static analysis MUST find zero references to telemetry namespaces/functions
  - Network destinations for analytics MUST NOT be present in the default configuration
- Updates
  - Updates MUST be manual‑only; background polling MUST NOT occur
  - Update artifacts MUST be signed; signature verification MUST precede installation
  - The previous signed binary MUST be retained to permit rollback
  - Release builds MUST be reproducible with published hashes
- Networking
  - Networking MUST be deny‑by‑default; first access to any domain MUST require per‑domain authorization
  - Active network indicators MUST be visible during outbound requests
  - Reputation or categorization calls to remote services MUST NOT occur in the default configuration
- Extensions
  - Extensions MUST be signed‑only; unsigned/sideloaded packages MUST NOT execute
  - Extensions MUST run in sandboxes; cross‑process memory access MUST NOT be permitted
  - Extension manifests MUST declare capabilities; undeclared capabilities MUST NOT be accessible
- Indicators
  - Indicators for network/microphone/camera/location MUST be visible when active
  - Indicators MUST NOT be suppressible by content or extensions
- Anti‑Fingerprinting
  - Sensitive APIs (Canvas, WebGL, AudioContext) SHOULD return standardized/salted outputs by default
  - Access to sensitive APIs MUST require explicit user permission where applicable
- Auditability
  - Audit logs (if enabled) MUST remain local‑only; auto‑upload MUST NOT occur
  - Export of logs MUST be manual and administrator‑initiated
- Consent
  - Prompts MUST be specific, time‑bound, reversible, and non‑coercive
  - Bundled or ambiguous consent dialogs MUST NOT be used
- Remote Toggles
  - Feature states MUST NOT be changeable via server‑side configuration or headers
  - Policy MUST load from local, user/admin‑controlled files only
- Ad‑Tech
  - Programmatic advertising, behavioral targeting, and RTB integrations MUST NOT exist
  - Sponsorship containers (if present) MUST render static, signed assets; JavaScript execution MUST NOT occur in the container

## 5. Auditability and Evidence
- Reproducible Builds: Public hashes and independent verification evidence
- Signatures: Release and extension signatures with validation logs
- Compliance Mapping: Artifacts mapped to profile requirements and RFC statements
- Pilot Evidence: Governance feedback reports confirming deny‑by‑default, indicators, and absence of telemetry/background services

## 6. Non‑Processing Assertion
- Default operation: Vendor does not collect, transmit, store, or process personal data
- Consent banners: Not required under ePrivacy/GDPR for default operation due to absence of tracking technologies
- Optional services: If enabled, operate under contract basis with strict data minimization and residency controls

## 7. Limitations and Non‑Goals
- Cloud sync and VPN are out of scope for review builds; any operational enablement requires separate contract and governance review
- Background execution, remote management channels, and reputation calls are explicitly out of scope for default builds
- Extension ecosystem remains curated; sideloading is disabled in consumer builds

## 8. Change Control and Enforcement
- Immutable Principles: No surveillance, no silent updates, no vendor‑side telemetry, no ad‑tech
- Certification: Non‑compliant artifacts are refused certification; signatures may be revoked
- Violation Protocol: Reversion of offending changes, public notice, governance freeze, and root‑cause audit

## 9. Jurisdictional Considerations
- EU/UK: Default non‑processing; DPIA may be required for specific enterprise deployments; ePrivacy alignment via no tracking technologies
- US (CCPA/CPRA): No sale or sharing of personal information; opt‑out flows generally non‑applicable
- Localization‑Sensitive Regions: Offline distribution supported; data residency controls available for opt‑in services

## 10. References
- Governance Manifesto
- Foundation Immutability Clause
- Threat Model (including STRIDE and Governance Overlay)
- Regulatory Readiness (profiles matrix)
- Zero Personal Data Assertion
- Regulatory Assertion of Non‑Processing

