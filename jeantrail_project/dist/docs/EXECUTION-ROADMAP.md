# Jean Browser Execution Roadmap — v1 to v1.x Operational

Date: [Insert Date]
Status: Governance-First Roadmap (Non-Promotional)

## Phase v1 — UI + Governance (Current)

What Becomes Enabled
- UI rendering of core surfaces (indicators, STOP/HALT, refusal dialogs)
- Governance artifact review (manifesto, threat model, immutability clause)
- Reproducible build verification (hash publication and local verification)

What Remains Forbidden
- Networking beyond local filesystem inspection
- Telemetry, crash reporting, analytics
- Background services after window close
- Programmatic advertising, behavioral targeting, RTB
- Remote feature toggles
- Sideloaded or unsigned extensions

Governance Sign-Off Required
- Evidence pack: published hashes, build reproducibility notes, compile-time telemetry exclusion proof
- UI audit: visible indicators for active subsystems, denial surfaces, STOP/HALT behavior
- Threat model alignment check: deny-by-default posture intact, no remote control channels

Kill-Switch Criteria
- Any background process persists after window close
- Any outbound network request without explicit user gesture token
- Discovery of telemetry namespaces or analytics endpoints
- Indicators fail to display when subsystems activate

## Phase v1.1 — Controlled Networking

What Becomes Enabled
- Per-domain, user-initiated outbound requests with just-in-time consent
- Visible network activity indicators and session-bound authorization tokens
- Static sponsorship assets may link out; no ad scripts execute

What Remains Forbidden
- Auto-networking, background polling, silent update checks
- Vendor-side telemetry and crash reporting
- Programmatic ads, behavioral targeting, RTB participation
- Remote configuration toggles

Governance Sign-Off Required
- Network gate tests: deny-by-default verified; per-domain authorization flows pass
- Indicator verification: network indicators present on all outbound activity
- Destination control: blocklists for analytics/ad-tech destinations hard-coded and passing certification scans
- Release evidence: signed artifacts; manual update flow verified

Kill-Switch Criteria
- Outbound requests occur without user gesture or outside authorized domain list
- Indicators missing during active network operations
- Any code path introduces background polling or auto-retry
- Connections to analytics/ad-tech destinations are detected

## Phase v1.2 — Policy Engine

What Becomes Enabled
- Local, signed policy manifests governing capabilities (read/write/net/mic/cam)
- Admin allow-lists/deny-lists applied locally; per-domain pre-authorization within a signed profile
- Content-free local audit entries for policy decisions (optional, on-device)

What Remains Forbidden
- Server-driven policy overrides or remote toggles
- Cloud-centralized user profiling or reputation calls
- Auto-export of audit logs; any automatic off-device transmission
- Telemetry, background services, programmatic ads

Governance Sign-Off Required
- Policy integrity: signature validation; manifest schema conformance; sandboxed policy evaluation
- Audit posture: local-only, manual export paths; no auto-upload code paths
- Consent model: prompts are specific, time-bound, reversible; no dark patterns
- Threat model update: policy-driven denial verified across sensitive capabilities

Kill-Switch Criteria
- Unsigned or tampered policy manifests detected
- Policy enables capabilities without user consent or local authorization
- Audit logs attempt auto-upload or off-device transmission
- Reputation or categorization calls leave device in default configuration

## Phase v1.3 — Offline Distribution & Verification

What Becomes Enabled
- Offline installers and update bundles suitable for air-gapped environments
- Local signature verification UI and CLI for releases and extensions
- Reproducibility checks: local rebuild comparison against published hashes

What Remains Forbidden
- Network-dependent update channels in default binaries
- Telemetry or crash reporting introduced via packaging
- Remote toggles or server-side policy injection
- Programmatic ads or tracking scripts in distribution assets

Governance Sign-Off Required
- Distribution evidence: offline package signatures, hash publication, independent reproducibility attestations
- Extension pipeline: signed-only validation; sideloading disabled in consumer builds
- Installer behavior: no background services; manual-only update path verified
- Documentation: jurisdictional addenda for air-gapped verification processes

Kill-Switch Criteria
- Hash mismatch or invalid signature during verification
- Non-reproducible release detected without documented variance explanation
- Installer starts background services or initiates network calls without user action
- Extensions bypass signature checks or escalate permissions outside policy

## Invariants Across All Phases
- Telemetry and crash reporting remain prohibited
- Programmatic advertising, behavioral targeting, RTB remain prohibited
- Remote toggles are not supported
- Deny-by-default posture is preserved
- Manual-only, signed updates remain mandatory
- Signed-only extensions; sandboxed execution; no sideloading in consumer builds

