# Zero Personal Data Assertion

**Product:** Jean Browser  
**Posture:** Governance-First, Local-First, Deny-by-Default  
**Scope of Assertion:** Default operation of Jean Browser distributed by the vendor. This assertion covers the vendor’s collection and processing activities, not third-party websites the user chooses to visit.

## 1. Assertion
Jean Browser, in its default configuration, does not collect, transmit, store, or otherwise process personal data on behalf of the vendor. The browser operates locally and does not establish any telemetry, analytics, or tracking channels to vendor-controlled infrastructure.

## 2. Categories Not Collected (Default)
- Identifiers: No unique device/browser identifiers are generated or transmitted to the vendor.
- Usage Analytics: No pageview, clickstream, session duration, or behavioral events are collected.
- Crash/Diagnostics: No crash dumps, error reports, or performance metrics are sent to the vendor.
- Network Metadata: No IP addresses, DNS queries, or connection details are transmitted to the vendor.
- Profiles/Preferences: No user profiles, bookmarks, history, or settings are exfiltrated to the vendor.
- Location/Hardware: No geolocation, sensor, or hardware fingerprints are collected or transmitted to the vendor.
- Advertising Signals: No cookies, pixels, or cross-site tracking signals are set or relayed to ad-tech endpoints by the vendor.

Note: When a user visits a third-party site, standard internet routing occurs between the user and the chosen site or its service providers. Jean Browser does not relay this traffic to vendor servers and does not intercept it for analytics.

## 3. Consent Banners (Non-Applicability)
- ePrivacy/GDPR consent banners are not required for the vendor’s default operation because the vendor does not set cookies, pixels, or comparable tracking technologies, and does not process personal data for analytics or profiling.
- Websites visited by the user may display their own consent banners; those banners are the responsibility of the respective controllers, not the vendor.

## 4. Differentiation from Traditional Browsers
- No Telemetry Channels: Traditional browsers commonly include “privacy-preserving” product analytics or opt-out telemetry. Jean Browser excludes telemetry code paths at build time.
- No Safe-Browsing Calls by Default: No background lookups or remote reputation checks are performed in the default consumer configuration.
- No Silent Updates: Software updates occur only after explicit user action; no background polling or automatic downloads.
- No Ad-Tech Integration: No participation in real-time bidding or behavioral ad networks; sponsorships are static and locally rendered.

## 5. Auditability and Evidence
- Compile-Time Exclusion: Telemetry and analytics modules are excluded at build time; no latent code paths exist in default binaries.
- Reproducible Builds: Release artifacts are published with hashes to allow independent verification that distributed binaries match source.
- Signed Updates (Manual): Update manifests and binaries are signed; installation requires explicit user action.
- Local-Only Logs (Enterprise Option): Optional audit logs remain on the user’s device or organization’s infrastructure and are never uploaded automatically.
- Governance Artifacts: Threat model, governance-gated features, and monetization policies are documented and publicly available for audit.

## 6. Optional, Opt-In Services (Out of Scope of Default)
If the user elects to enable an optional service (e.g., encrypted sync, VPN), limited processing may occur strictly to deliver that service:
- Lawful Basis: Contract (provision of the service) and data minimization principles apply.
- Data Residency: Region-selectable hosting and contractual controls are provided for enterprise deployments.
- Transparency: In-product disclosures precede enablement; refusal surfaces remain visible; no remote or silent toggles.

## 7. Change Control
Any change that would introduce vendor-side personal data processing must undergo governance review and be rejected unless fully compliant with the Governance Manifesto and deny-by-default posture.

## 8. Contact
For regulatory inquiries or independent audits, the vendor provides build hashes, signing keys, and documentation references upon request.

