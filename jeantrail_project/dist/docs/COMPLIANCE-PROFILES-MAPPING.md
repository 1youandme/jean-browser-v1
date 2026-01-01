# Compliance Profiles Mapping — Deployment Guidance

Date: [Insert Date]
Source Matrix: `e:\manager\project_unpacked\jeantrail_project\docs\REGULATORY-READINESS.md`

## Core Sovereign Profile
- Default Configuration
  - Telemetry: MUST NOT exist
  - Networking: MUST be deny‑by‑default
  - Updates: MUST be manual‑only and signed
  - Extensions: MUST be signed‑only; no sideloading
  - Anti‑Fingerprinting: SHOULD be enabled by default
  - Offline Distribution: SHOULD be supported
- Required Controls
  - Visible indicators for network/mic/cam/location
  - No remote toggles; local policy only
- Evidence Artifacts
  - Published build hashes; reproducibility report (SHOULD)
  - Static analysis showing zero telemetry namespaces
  - Signature validation logs for release and extensions
- Deployment Notes
  - Air‑gapped friendly operation
  - No controller/processor role in default use
- Prohibited Behaviors
  - Programmatic ads, behavioral targeting, reputation calls
  - Background services after window close
- Optional Features
  - Opt‑in modules MAY be enabled under contract with local‑only enforcement and residency controls where applicable

## Enterprise Sovereign Profile
- Default Configuration
  - Telemetry: MUST NOT exist
  - Networking: MUST be deny‑by‑default; org policy MAY pre‑authorize domains
  - Updates: MUST be manual‑only and signed; rollback MUST exist
  - Extensions: MUST be signed‑only; org allow‑lists MAY apply
  - Anti‑Fingerprinting: MUST be enabled by default
  - Evidence Pack: MUST be published
- Required Controls
  - Admin visibility for indicators SHOULD be enabled
  - Local audit logs SHOULD be enabled; export MUST be manual
  - Policy manifests signed; enforced locally
- Evidence Artifacts
  - Hashes and signatures with independent attestation
  - Networking gate test results; deny‑by‑default verification
  - Policy validation logs; allow‑list configuration records
- Deployment Notes
  - On‑prem log retention; SIEM export via manual administrator action
  - Region selection for any opt‑in services SHOULD be available
- Prohibited Behaviors
  - Remote policy overrides; server‑driven toggles
  - Background polling or auto‑install update channels
- Optional Features
  - Opt‑in modules MAY be enabled under contract; residency controls SHOULD apply; governance sign‑off required for high‑risk capabilities

## Regulated Environment Profile
- Default Configuration
  - Telemetry: MUST NOT exist
  - Networking: MUST be deny‑by‑default; per‑domain approvals MUST be logged
  - Updates: MUST be manual‑only, signed, reproducible; rollback MUST exist
  - Extensions: MUST be signed‑only; jurisdictional allow‑lists MUST apply
  - Indicators: MUST be visible; regulator‑facing indicator log MUST exist
  - Offline Distribution: MUST be supported for air‑gapped environments
- Required Controls
  - DPIA and jurisdictional assessments MUST be conducted where required
  - Audit logs MUST be enabled; export MUST be manual/on‑prem only
  - Anti‑fingerprinting MUST be enabled and documented per jurisdiction
- Evidence Artifacts
  - Independent reproducibility attestations and published hashes
  - Per‑domain approval logs and indicator logs
  - Signed policy manifests; enforcement and validation logs
- Deployment Notes
  - Air‑gapped installation workflow; local signature verification UI/CLI
  - Data residency controls MUST be available for opt‑in services
- Prohibited Behaviors
  - Reputation or safe‑browsing cloud calls in default configuration
  - Remote toggles; server‑driven policy channels
  - Programmatic ad‑tech integrations
- Optional Features
  - Contract‑only modules MAY be enabled; residency controls MUST apply; jurisdictional addenda in evidence pack

## Acceptance Mapping
- Tests
  - Telemetry exclusion: Static analysis and egress tests mapped per profile requirements
  - Networking gates: Deny‑by‑default and per‑domain consent tests; indicator visibility checks
  - Updates: Manual‑only flow verification; signature validation; rollback test; reproducibility checks
  - Extensions: Signature enforcement; sandbox isolation; capability declaration tests
  - Auditability: Local‑only logging; manual export verification
- Decision Alignment
  - Profiles align to `GO-DECISION-FRAMEWORK.md` thresholds and kill‑switch criteria
  - Conditional enablement permitted only when profile MUSTs are satisfied and remaining SHOULDs have remediation plans

