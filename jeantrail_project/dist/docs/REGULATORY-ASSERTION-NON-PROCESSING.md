# Regulatory Assertion of Non-Processing (Default Operation)

**Product:** Jean Browser  
**Posture:** Governance-First, Local-First, Deny-by-Default  
**Scope:** Default vendor operation of Jean Browser (excluding optional, opt-in services). This assertion concerns the vendor’s collection and processing activities, not third-party websites the user chooses to visit.

## 1. Formal Assertion
Jean Browser, in its default configuration, does not collect, transmit, store, or otherwise process personal data on behalf of the vendor. The browser operates locally and does not establish telemetry, analytics, tracking, or background networking channels to vendor-controlled infrastructure.

## 2. Definitions
- Processing: Any operation performed on personal data, including collection, transmission, storage, profiling, or inference.
- Vendor: The entity that distributes Jean Browser and controls vendor-side infrastructure.
- Default Operation: Use of Jean Browser without enabling optional, opt-in services (e.g., encrypted sync, VPN).

## 3. Categories Not Processed by the Vendor (Default)
- Identifiers: No unique device/browser identifiers are generated or transmitted to vendor infrastructure.
- Usage Analytics: No pageview, clickstream, session duration, or behavioral events are collected or sent to the vendor.
- Diagnostics: No crash reports, performance metrics, or error telemetry are transmitted to the vendor.
- Network Metadata: No IP addresses, DNS queries, connection details, or routing data are transmitted to vendor infrastructure.
- Content & Preferences: No user profiles, bookmarks, history, passwords, form data, or settings are exfiltrated to the vendor.
- Location & Sensors: No geolocation, sensor data, or hardware characteristics are collected or transmitted to the vendor.
- Advertising Signals: No cookies, pixels, or cross-site tracking signals are set or relayed to ad-tech endpoints by the vendor.
- Sensitive Categories: No special category data is collected or transmitted by the vendor under default operation.
- Children’s Data: No collection or processing of children’s personal data by the vendor under default operation.

## 4. Tracking Technologies (Vendor)
- Cookies/Pixels/Scripts: The vendor does not set cookies, pixels, or comparable tracking technologies in default operation.
- Fingerprinting: The vendor does not perform or enable vendor-side fingerprinting; anti-fingerprinting controls are enforced locally.

## 5. Network Activity (Vendor)
- Startup/Idle: No vendor-bound network activity occurs on startup or idle; deny-by-default networking is enforced.
- Background Services: No background services persist after the main window closes; processes terminate by design.

## 6. Consent and Legal Basis (Vendor)
- Consent Banners (Vendor): Not required for vendor activity under default operation because no tracking technologies are set and no personal data is processed by the vendor.
- Lawful Basis: Not applicable to vendor for default operation. For optional services (if enabled), processing is limited to contract and data minimization, with region-selectable hosting.

## 7. Scope Limitations and Third Parties
- Third-Party Sites: When a user visits a website, traffic flows between the user and the chosen site or service providers. Jean Browser does not relay this traffic to vendor servers and applies deny-by-default controls to third-party trackers.
- Optional Services (Out of Scope): If the user enables an optional service, limited processing necessary to deliver that service may occur strictly under contract; disclosures precede enablement; refusal surfaces remain visible; no remote or silent toggles.

## 8. Auditability and Evidence
- Compile-Time Exclusion: Telemetry and analytics modules are excluded at build time; certification fails if telemetry symbols are present.
- Reproducible Builds: Release artifacts are published with hashes to allow independent verification that distributed binaries match source.
- Signed Updates (Manual): Update manifests and binaries are signed; installation requires explicit user action; no background update channels.
- Local-Only Logs (Enterprise Option): Optional audit logs remain on-device or on-prem and are never uploaded automatically.

## 9. Change Control
Any change that would introduce vendor-side personal data processing under default operation is prohibited. Proposals to alter default non-processing must undergo governance review and will be rejected unless fully compliant with immutable constraints and deny-by-default architecture.

## 10. References
- ZERO-PERSONAL-DATA-ASSERTION.md  
- REGULATORY-READINESS.md  
- GOVERNANCE-MANIFESTO.md  
- THREAT-MODEL.md  

