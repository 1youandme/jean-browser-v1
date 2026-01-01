# Jean Browser Threat Model
**Date:** 2025-12-30
**Status:** Active Governance Document
**Scope:** Jean Browser (Governance-First, Local-First Architecture)

This document outlines the potential threats to the Jean Browser ecosystem and the specific, architectural mitigations employed to neutralize them. Our security posture is defined by "Deny-by-Default" and "Local Sovereignty."

---

## 1. User-Level Threats

### A. Cross-Site Tracking
*   **Threat:** Third-party scripts and pixels attempting to monitor user navigation across different domains.
*   **Risk:** High. Compromises user anonymity and builds unauthorized behavioral profiles.
*   **Mitigation:**
    *   **Explicit Denial:** Third-party cookies and storage are disabled by default at the engine level.
    *   **Local Enforcement:** Network requests to known tracker domains are blocked before leaving the network stack.
    *   **UI Guarantee:** "Sovereign Mode" indicator provides visual confirmation of blocking status.

### B. Device Fingerprinting
*   **Threat:** Websites querying device properties (Canvas, WebGL, AudioContext, Fonts) to generate a unique user ID without cookies.
*   **Risk:** Medium/High. circumventing cookie blocks to identify persistent users.
*   **Mitigation:**
    *   **Standardization:** Browser reports a generic, common hardware configuration (e.g., standard window size, generic GPU renderer).
    *   **Noise Injection:** Canvas and audio readouts are subtly randomized (salted) per session to prevent stable fingerprints.
    *   **API Restriction:** Sensitive APIs are gated behind explicit user permissions.

### C. Malicious Extensions
*   **Threat:** Browser extensions requesting excessive permissions to siphon data or inject ads.
*   **Risk:** Critical. Extensions often run with high privileges.
*   **Mitigation:**
    *   **Curated Allow-List:** Only extensions audited and signed by the Jean Governance Board are permitted in the default environment.
    *   **No Sideloading:** External installation of unsigned CRX files is blocked in the consumer build.
    *   **Sandbox:** Extensions operate in a strict isolated world with no access to the main browser memory or other tabs.

---

## 2. System-Level Threats

### A. Background Services Abuse
*   **Threat:** Browser processes remaining active after the window is closed to mine data or consume resources.
*   **Risk:** Medium. Performance degradation and "always-on" surveillance.
*   **Mitigation:**
    *   **Process Lifecycle:** The "Jean Lifecycle Manager" ensures `SIGTERM` kills *all* child processes immediately upon window close.
    *   **No Headless Mode:** The browser cannot run in background/headless mode in the consumer release.
    *   **Visible Refusal:** A "HALT" button in the task manager allows users to instantly panic-kill all browser activity.

### B. Update Channel Compromise
*   **Threat:** Attackers injecting malicious code into the update stream (Supply Chain Attack).
*   **Risk:** Critical. Could distribute a compromised binary to all users.
*   **Mitigation:**
    *   **Binary Transparency:** Updates are cryptographically signed and hashes are published on a separate, immutable public ledger (e.g., GitHub Releases).
    *   **Manual-Only Trigger:** No silent background updates. Users must click "Check for Updates" and approve the installation.
    *   **Rollback Capability:** The browser retains the previous known-good binary for immediate local rollback.

---

## 3. Commercial Threats

### A. Ad Network Exploitation (Malvertising)
*   **Threat:** Dynamic ad networks serving malware or tracking scripts through legitimate ad slots.
*   **Risk:** High. The primary vector for drive-by downloads and behavioral tracking.
*   **Mitigation:**
    *   **Static Content Only:** The "Ad Box" only renders static images or text. **No JavaScript execution is allowed within ad containers.**
    *   **No RTB Connection:** The browser has no code to connect to Real-Time Bidding exchanges. Ads are fetched from a static, vetted config.
    *   **Local Rendering:** Ad assets are cached locally; no pixel fires on impression.

### B. Telemetry Creep
*   **Threat:** "Help improve functionality" features slowly expanding to collect sensitive usage data.
*   **Risk:** Medium. Gradual erosion of privacy promises.
*   **Mitigation:**
    *   **Compile-Time Exclusion:** Telemetry code is not just disabled; it is excluded from the build configuration (`#ifdef NO_TELEMETRY`).
    *   **Network Firewall:** The browser's internal network stack is hard-coded to reject connections to any analytics domains, even if code were injected.

---

## 4. Governance Threats

### A. Silent Feature Activation
*   **Threat:** New features (e.g., AI integration, cloud sync) being enabled without user awareness.
*   **Risk:** Medium. Violation of user trust and "Principle of Least Surprise."
*   **Mitigation:**
    *   **Opt-In Only:** All new features connecting to the internet default to `OFF`.
    *   **Visible Refusal Surface:** "STOP" and "DISCONNECT" buttons are prominent in the UI for any active feature.
    *   **Status Indicators:** A dedicated "Network Activity" LED/icon in the UI lights up whenever *any* data leaves the device.

### B. Scope Drift
*   **Threat:** The project slowly evolving into a standard commercial browser, abandoning its core principles.
*   **Risk:** High (Long-term). Loss of unique value proposition.
*   **Mitigation:**
    *   **Immutable Manifesto:** The `GOVERNANCE-MANIFESTO.md` is treated as the project's constitution.
    *   **Version Isolation:** Experimental features (v2) are developed in a completely separate repository, preventing contamination of the stable, privacy-first v1 codebase.
    *   **Governance Audit:** Every major release requires a "Governance Sign-off" confirming adherence to the Threat Model.

---

## 5. STRIDE Threat Analysis

### A. Spoofing
- Threat: Malicious extensions or processes masquerade as trusted Jean components to gain permissions.
- Risk: High. User consent may be misapplied to an untrusted binary.
- Mitigations:
  - Signed-only extensions; signature validation required before execution.
  - Isolated process naming and hardened IPC with allow-listed channels.
  - UI binding to signature identity; consent dialogs display signer identity and scope.

### B. Tampering
- Threat: Local policy manifests or binaries altered to bypass deny-by-default gates.
- Risk: Critical. Direct compromise of governance guarantees.
- Mitigations:
  - Policy manifests signed; unsigned or modified manifests fail to load.
  - Reproducible builds; local hash verification against published references.
  - Read-only config zones for consumer builds; admin writes require explicit authorization.

### C. Repudiation
- Threat: Actors deny initiating sensitive operations or policy changes.
- Risk: Medium. Reduces accountability in regulated environments.
- Mitigations:
  - Content-free local audit entries capturing who/when/what-capability without data payloads.
  - Per-action user gesture tokens; session-bound and expiring.
  - Optional on-prem log export via manual, administrator-initiated process.

### D. Information Disclosure
- Threat: Leakage of device or behavioral identifiers via APIs, crash logs, or background calls.
- Risk: High. Enables profiling and cross-site tracking.
- Mitigations:
  - Anti-fingerprinting: standardized/salted API outputs; sensitive APIs gated.
  - No telemetry/crash reporting code paths in default builds.
  - Network stack deny-by-default; reputation/ad-tech destinations blocked.

### E. Denial of Service
- Threat: Malicious pages or extensions exhaust resources or block STOP/HALT.
- Risk: Medium. Impairs user control and trust.
- Mitigations:
  - Global STOP/HALT kills all activity; lifecycle manager enforces termination.
  - Resource quotas in sandboxed processes; watchdog for runaway tasks.
  - UI remains responsive; indicators cannot be suppressed by content.

### F. Elevation of Privilege
- Threat: Extensions or renderer scripts escalate capabilities beyond declared permissions.
- Risk: Critical. Breaks governance-gated execution.
- Mitigations:
  - Capability registry with strict permission gating; audited manifests.
  - Sandboxed execution contexts; no direct memory access across tabs/processes.
  - Mandatory review gates for enabling high-risk capabilities.

---

## 6. Governance Threat Overlay

### A. State-Level Coercion Risks
- Scenario: Legal or extralegal pressure to introduce telemetry, remote toggles, or special access.
- Risk: High in certain jurisdictions; systemic erosion of guarantees.
- Mitigations:
  - Foundation Immutability Clause prohibits surveillance, silent updates, vendor-side telemetry, and ad-tech.
  - Offline distribution and local policy engine; no remote control channels.
  - Jurisdictional builds documented; changes require governance supermajority and remain contract-only opt-ins.
- Kill-Switch Criteria:
  - Any remote configuration channel detected.
  - Any code path enabling telemetry or background services.

### B. Vendor Capture Scenarios
- Scenario: Commercial pressure to add growth-oriented features conflicting with sovereignty (tracking, ad-tech).
- Risk: Medium/High over time.
- Mitigations:
  - Immutable governance principles and certification refusal for violating artifacts.
  - Signing key control retained by the Foundation; revocation on violation.
  - Public non-compliance notices and freeze protocol.
- Kill-Switch Criteria:
  - Programmatic advertising integrations or reputation calls detected.
  - Dark-pattern prompts or coerced enablement of optional modules.

### C. Supply-Chain Poisoning
- Scenario: Compromised dependencies or build infrastructure injects malicious code.
- Risk: Critical. Broad distribution of tainted binaries.
- Mitigations:
  - Reproducible builds; independent attestation and published hashes.
  - Minimal dependency surface for governance-critical components; pinning and verified sources.
  - Offline build pipelines for air-gapped releases; signature verification at install.
- Kill-Switch Criteria:
  - Hash/signature mismatch on release artifacts.
  - Non-reproducible build variance without documented, audited explanation.

### D. Silent Update Attack Vectors
- Scenario: Background update channels used to deliver changes without user initiation.
- Risk: Critical. Bypasses consent and governance review.
- Mitigations:
  - Manual-only updates; removal of background daemons and polling.
  - Local rollback capability to previous signed binary.
  - Update manifests signed; UI requires explicit user action with visible verification.
- Kill-Switch Criteria:
  - Any network activity related to updates without user gesture token.
  - Installer initiating background services or auto-install behavior.

### E. UI Dark-Pattern Risks
- Scenario: Deceptive prompts coerce users into enabling risky capabilities.
- Risk: Medium. Undermines consent integrity.
- Mitigations:
  - Just-in-time, specific, time-bound, reversible prompts; no coercive language or urgency.
  - Governance UX review gate; non-compliant dialogs rejected.
  - Indicator and refusal surfaces must remain visible; cannot be hidden by UI changes.
- Kill-Switch Criteria:
  - Detection of ambiguous or bundled consent prompts.
  - Removal or suppression of refusal surfaces or indicators.
