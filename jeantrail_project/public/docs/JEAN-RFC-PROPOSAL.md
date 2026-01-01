# Jean Standard RFC Proposal

Date: [Insert Date]
Status: Draft for Governance Review

## 1. Abstract
- This RFC defines the Jean Standard: compliance levels, certification criteria, extension policies, and governance constraints using testable MUST/MUST NOT/SHOULD statements.
- The standard aims to preserve user sovereignty via deny‑by‑default networking, manual‑only signed updates, and zero vendor‑side telemetry.

## 2. Terminology
- MUST, MUST NOT, SHOULD, MAY: As defined in RFC 2119.
- Default Build: Consumer build with non‑operational browsing unless explicitly enabled by governance.
- Evidence Pack: Public hashes, signatures, reproducibility attestations, and test results.
- Policy Manifest: Signed configuration defining capability gates and allow/deny lists.

## 3. Compliance Levels
- Core Sovereign
  - Telemetry MUST NOT exist.
  - Updates MUST be manual‑only and signed.
  - Networking MUST be deny‑by‑default.
  - Extensions MUST be signed‑only; sideloading MUST NOT be permitted.
  - Reproducible builds SHOULD be provided.
  - Offline distribution SHOULD be supported.
- Enterprise Sovereign
  - Telemetry MUST NOT exist.
  - Updates MUST be manual‑only and signed; rollback MUST exist.
  - Networking MUST be deny‑by‑default; org policy MAY pre‑authorize domains.
  - Extensions MUST be signed‑only; org allow‑lists MAY apply.
  - Anti‑fingerprinting MUST be enabled by default.
  - Evidence Pack MUST be published.
  - Audit logs SHOULD be enabled; export MUST be manual.
- Regulated Environment
  - Telemetry MUST NOT exist.
  - Updates MUST be manual‑only, signed, and reproducible; rollback MUST exist.
  - Networking MUST be deny‑by‑default; per‑domain approvals MUST be logged.
  - Extensions MUST be signed‑only; jurisdictional allow‑lists MUST apply.
  - Indicators MUST be visible; indicator logs MUST exist.
  - Data residency MUST be supported for opt‑in services.
  - DPIA and jurisdictional assessments MUST be conducted where required.
  - Offline distribution MUST be supported for air‑gapped environments.
- Reference: `docs/REGULATORY-READINESS.md`

## 4. Certification Criteria
- Telemetry Exclusion
  - Default builds MUST NOT include telemetry, analytics, crash, or usage code paths.
  - Static analysis MUST find zero references to telemetry namespaces/functions.
  - Network destinations for analytics MUST NOT be present in default configuration.
- Updates
  - Updates MUST be manual‑only; background polling MUST NOT occur.
  - Update artifacts MUST be signed; signature verification MUST precede installation.
  - Previous signed binaries MUST be retained for rollback.
  - Release builds MUST be reproducible with published hashes and independent verification.
- Networking Gates
  - Networking MUST be deny‑by‑default.
  - First access to any domain MUST require per‑domain authorization.
  - Active network indicators MUST be visible during outbound requests.
  - Reputation calls MUST NOT occur in default configuration.
- Extensions
  - Extensions MUST be signed‑only; unsigned/sideloaded packages MUST NOT execute.
  - Extensions MUST run in sandboxes; cross‑process memory access MUST NOT be permitted.
  - Extension manifests MUST declare capabilities; undeclared capabilities MUST NOT be accessible.
- Auditability
  - Audit logs (if enabled) MUST remain local‑only; auto‑upload MUST NOT occur.
  - Export MUST be manual and administrator‑initiated.
- Evidence Pack
  - Certification submissions MUST include signatures, hashes, reproducibility reports, and test artifacts mapped to requirements.

## 5. Extension Policies
- Capability Declaration
  - Extension manifests MUST declare requested capabilities with scopes.
  - Extensions MUST NOT access undeclared capabilities.
- Permission Gating
  - Sensitive APIs (file write, microphone, camera, location, network) MUST require explicit user authorization or policy approval.
  - Just‑in‑time prompts MUST be specific, time‑bound, reversible, and non‑coercive.
- Sandbox and Isolation
  - Extensions MUST execute in isolated contexts; direct memory sharing MUST NOT be permitted.
  - IPC channels MUST be allow‑listed; unauthorized channels MUST NOT be available.
- Signing and Distribution
  - Extensions MUST be signed; consumer builds MUST disable sideloading.
  - Jurisdictional allow‑lists MAY be applied for regulated deployments.
- Monitoring
  - Extensions MUST NOT emit telemetry or background network activity in default configuration.
  - Indicators MUST NOT be suppressible by extensions.

## 6. Governance Constraints
- Immutable Principles
  - No Surveillance: The browser MUST NOT implement tracking, fingerprinting, profiling, or background analytics.
  - No Silent Updates: Updates MUST be manual and signed; auto‑download/install MUST NOT occur.
  - No Vendor‑Side Telemetry: Data MUST NOT be sent to vendor infrastructure.
  - No Ad‑Tech: Programmatic advertising, behavioral targeting, and RTB integrations MUST NOT exist.
- Remote Toggles
  - Feature states MUST NOT be changeable via server‑side configuration or headers.
  - Policy MUST load from local, user/admin‑controlled files only.
- Governance Sign‑Off
  - Major changes MUST receive governance sign‑off with evidence pack references.
- Violation Protocol
  - Non‑compliant artifacts MUST be refused certification; offending changes MUST be reverted; signatures MAY be revoked.
- References: `GOVERNANCE-MANIFESTO.md`, `docs/FOUNDATION-IMMUTABILITY-CLAUSE.md`

## 7. Auditability Requirements
- Indicators for network/microphone/camera/location MUST be visible when active.
- Indicators MUST NOT be suppressible by content or extensions.
- Local‑only audit logs (if enabled) MUST capture capability events without content payloads.
- Manual export ONLY; auto‑upload MUST NOT occur.

## 8. Compliance Validation
- Test Suites
  - Static analysis for telemetry exclusions MUST pass.
  - Networking gate tests MUST verify deny‑by‑default and per‑domain authorization.
  - Indicator tests MUST verify visibility during capability use.
  - Reproducibility tests MUST pass with published hashes.
  - Extension sandbox tests MUST verify isolation and capability gating.
- Certification Review
  - Reviewers MUST map passing tests to RFC sections and compliance profiles.
  - Any Critical failure MUST result in certification denial until remediation.

## 9. Non‑Goals
- Automated remote policy management for consumer builds.
- Background execution and silent updates.
- Programmatic advertising or behavior‑based monetization.

## 10. References
- `docs/REGULATORY-READINESS.md`
- `docs/REGULATORY-SUBMISSION.md`
- `docs/THREAT-MODEL.md`
- `docs/MONETIZATION-WITHOUT-SURVEILLANCE.md`
- `docs/GO-DECISION-FRAMEWORK.md`
- `GOVERNANCE-MANIFESTO.md`
- `docs/FOUNDATION-IMMUTABILITY-CLAUSE.md`

