# Fixed-Term Pilot Feedback — Telemetry-Excluded Review Builds

Date: [Insert Date]
Pilot Term: 60 days (extendable to 90 by written amendment)
Scope: UI and governance posture evaluation; non-operational browsing

## 1. Pilot Objectives
- Verify deny-by-default networking with explicit per-domain authorization.
- Confirm absence of telemetry, crash reporting, and background services.
- Validate visible indicators (network, microphone, camera, location).
- Document refusal surfaces and STOP/HALT behavior.
- Assess reproducible builds and signature verification workflows.

## 2. Build Verification
- Hash Verification: Compare local artifacts to published release hashes.
- Signature Validation: Verify release and extension signatures before install.
- Reproducibility (If applicable): Attempt local rebuild and compare hashes.

## 3. Operational Constraints
- Non-Operational Browsing: No dynamic networking; evaluation is UI/governance-only.
- Air-Gapped Friendly: Prefer offline evaluation; no external calls permitted.
- Manual Updates: No background polling or auto-install; user-initiated only.

## 4. Evidence Capture Protocol
- Local-Only Audit Logs (If enabled)
  - Capture event metadata: timestamp, actor, capability invoked, decision (allow/deny).
  - Ensure no content payloads; export via manual administrator action only.
- Indicators Verification
  - Record screenshots showing indicators when network/mic/cam/location are active.
  - Note any missing indicators or suppression attempts.
- Refusal Surfaces
  - Document prompts and refusal dialogs; ensure specific, time-bound, reversible language.
  - Capture screenshots and note decision paths (deny/allow) and outcomes.
- Networking Gates
  - Attempt outbound requests; confirm deny-by-default and per-domain authorization flow.
  - Verify zero reputation/safe-browsing calls in default configuration.
- Process Lifecycle
  - Close primary window; confirm all child processes terminate; no daemons persist.
- Update Behavior
  - Initiate manual update check; confirm signatures required; verify rollback availability.

## 5. Data Handling
- No Personal Data: Do not collect or transmit personal data during pilot.
- No Uploads: Evidence remains on-device or on-prem; no automatic export or cloud upload.
- Redaction: Remove any sensitive environment details from screenshots before sharing.

## 6. Feedback Template
- Summary
  - Context: Environment, team, dates
  - Scope: Features evaluated
- Findings
  - Deny-by-Default Networking: Pass/Fail; notes
  - Indicators Visibility: Pass/Fail; screenshots references
  - Telemetry/Background Services: Pass/Fail; inspection method
  - Refusal Surfaces: Pass/Fail; dialog text examples
  - Update Policy: Manual-only and signed; rollback presence
  - Extensions: Signed-only; sandbox isolation; capability declaration
- Deviations
  - Description: What occurred, expected behavior, reproduction steps
  - Severity: Critical/High/Medium/Low
  - Evidence: File paths, screenshots, logs
- Recommendations
  - Governance adjustments, UX clarifications, documentation gaps
- Conclusion
  - Ready for Go/Conditional Go/No-Go per `GO-DECISION-FRAMEWORK.md`

## 7. Tools & Methods
- Static Analysis: Scan code paths for telemetry namespaces/functions (if source is available).
- Network Monitoring: Local firewall or packet capture to confirm zero external calls.
- Process Inspection: Task manager/process explorer to verify lifecycle termination.
- Hash/Signature Tools: OS-native or approved utilities for artifact verification.

## 8. Submission Package
- Evidence Pack Index: Hash/signature verification logs; screenshots; audit log exports (manual).
- Feedback Report: Completed template with findings and recommendations.
- Environment Notes: OS version, evaluation build version, local policies applied.

## 9. Acceptance Criteria
- Deny-by-default networking enforced; indicators visible; zero telemetry/background services.
- Manual-only signed updates; rollback confirmed; no remote toggles detected.
- Refusal surfaces compliant; prompts specific, non-coercive, reversible.
- Evidence pack complete; no unresolved Critical deviations.

