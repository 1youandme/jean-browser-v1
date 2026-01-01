# MONETIZATION WITHOUT SURVEILLANCE: A Commercial Strategy
**Status:** Canonical Reference
**Principles:** Privacy-First, Local-First, User Sovereignty

This document defines the monetization paths for the Jean Browser project that strictly adhere to our non-negotiable privacy principles. We reject the surveillance economy in favor of transparent, value-based commercial models.

## 1. Allowed Monetization Models

These models are explicitly approved as they respect user privacy and rely on local-first or opt-in mechanics.

### A. Static Sponsorships (The "Ad Box" Model)
*   **Definition:** High-value, manually vetted partnerships displayed as static assets.
*   **Mechanism:**
    *   Sponsorships are hard-coded or delivered via a signed, static configuration file.
    *   No real-time bidding (RTB).
    *   No personalized targeting based on browsing history.
*   **User Experience:**
    *   Clearly labeled as "Sponsors" or "Partners".
    *   Non-intrusive: No pop-ups, no audio, no animations.
    *   Clicking a sponsorship link opens a standard new tab with UTM parameters for attribution *only* (no tracking pixels on our side).

### B. Local-Only Accounting & Attribution
*   **Definition:** Computing value and attribution on the client-side without exposing user data.
*   **Mechanism:**
    *   If a user purchases a product found via Jean Browser, the referral code is embedded in the link.
    *   Attribution confirmation (if needed) is handled via a cryptographic proof or simple referral code matching, without sharing user identity.
*   **Privacy Guarantee:** The browser does not report "User X bought Item Y" to a central server. It only facilitates the referral.

### C. Enterprise Licensing (Jean Enterprise)
*   **Definition:** Paid licenses for organizational use with enhanced management features.
*   **Features:**
    *   Centralized policy management (e.g., "Block Social Media" policies).
    *   Intranet integration.
    *   Priority support.
    *   Custom deployment configurations.
*   **Revenue:** Traditional per-seat or site-wide licensing fees.

### D. User-Opt-In Paid Features (Jean Premium)
*   **Definition:** Value-added services that users explicitly pay for.
*   **Examples:**
    *   **Encrypted Sync:** Multi-device sync using zero-knowledge encryption (subscription covers server costs).
    *   **VPN / Proxy Services:** Integrated, privacy-respecting network tunneling.
    *   **Advanced AI Models:** Access to larger, cloud-hosted LLMs (optional; default is local).
*   **Principle:** Users pay with money, not data.

## 2. Explicitly Forbidden Models

The following revenue generation methods are **strictly prohibited** in Jean Browser. No code shall be written to support them.

*   **Programmatic Advertising:** No connection to AdTech exchanges (Google Ads, Facebook Audience Network, etc.).
*   **Cross-Site Tracking:** No cookies, pixels, or scripts that track users across different domains.
*   **Fingerprinting:** No collection of device entropy (screen resolution, battery level, installed fonts) for identification purposes.
*   **Data Selling:** No selling, renting, or sharing of user browsing history, search queries, or personal data.
*   **Background Mining:** No utilization of user hardware for cryptocurrency mining or distributed computing without explicit, per-session consent.
*   **"Free" Services disguised as Paid:** No features that claim to be free but monetize via background data collection.

## 3. The Ad Box Model: Technical & UX Specification

The "Ad Box" is our primary example of ethical advertising.

*   **Visual Placeholders:**
    *   Ads are treated as static content, similar to a wallpaper image.
    *   They are pre-fetched or bundled with the application update.
    *   They do not execute JavaScript.
*   **User-Controlled Playback:**
    *   If an ad contains rich media (e.g., video), it **never** auto-plays.
    *   Playback requires explicit user interaction (click-to-play).
*   **No Background Loading:**
    *   No 3rd-party network requests are made just to render the ad box.
    *   Impressions are counted locally (if at all) and reported in aggregate, anonymized batches (e.g., "10,000 impressions this week") or not reported at all (flat fee model).

## 4. Compliance & Alignment

Our monetization strategy is designed to exceed global privacy standards.

### GDPR & ePrivacy Directive
*   **Lawful Basis:** We rely on **Contract** (for paid services) and **Legitimate Interest** (for static, non-tracking ads), avoiding the complexity and fatigue of "Consent" pop-ups for basic functionality.
*   **Data Minimization:** We collect **zero** personal data for advertising purposes.
*   **Right to be Forgotten:** Since we don't store user profiles, there is nothing to delete.

### CCPA / CPRA
*   **"Do Not Sell":** We automatically comply because we **never** sell personal information.
*   **Opt-Out:** There is no need to opt-out of tracking because tracking is disabled by default and cannot be enabled for advertising.

### Consent Clarity
*   **No Dark Patterns:** We do not use confusing language to trick users into enabling tracking.
*   **Honest Defaults:** The browser works perfectly "out of the box" with maximum privacy. Monetization features (like Premium) are clear add-ons.

---

**Summary:** Jean Browser proves that software can be profitable without being predatory. We monetize the *utility* we provide and the *attention* we curate, never the *privacy* of our users.

---

## Addendum: Zero‑Surveillance Monetization Revision (v1)

This addendum defines governance‑first monetization models and supersedes any inconsistent prior references to general sponsorships or advertising.

### Allowed Models (Zero Surveillance)
- Offline Licenses (Air‑Gapped Distribution)
  - Per‑seat/site licenses for offline environments; offline installers and signed update bundles; local signature/hash verification; no network dependency.
  - Flat or tiered pricing; no usage‑based or data‑driven adjustments.
- Institutional Support Contracts (Governance & Maintenance)
  - Support agreements for public sector and enterprise deployments: governance assurance, policy configuration, reproducible build support, offline distribution guidance, incident response aligned with governance rules.
  - No remote control channels; no data collection; contract‑based SLAs without usage metering.
- Verified Builds (Certification & Attestation)
  - Independent reproducible build attestations, signature validation, hash publication, extension signing verification; artifacts contain no user data.
  - Fixed‑fee certification or subscription; not tied to usage.
- Sovereign Feature Modules (Paid, Optional)
  - Optional modules that extend local capabilities without surveillance (e.g., encrypted sync with zero‑knowledge, VPN/Proxy with jurisdictional controls, advanced local AI models, policy engine enhancements).
  - Explicit contract; data residency controls where applicable; no telemetry or background tracking; transparent fees only.
- Governed Local Video Slot (Optional)
  - Single, explicitly governed local video slot for partner content; signed local assets or pre‑fetched via signed static configuration; click‑to‑play; no JavaScript execution; no external calls at render; no RTB or targeting.
  - Optional local‑only counters; no impression tracking; flat‑fee sponsorships preferred.

### Explicitly Forbidden
- Programmatic Advertising beyond the governed local video slot.
- Cross‑site tracking, fingerprinting, data selling.
- Background mining without explicit, per‑session consent.
- Data‑driven pricing; usage‑based tracking for billing or pricing.
- “Free” services disguised as paid via background data collection.

### Compliance Alignment
- Contract as lawful basis for paid services; non‑processing defaults for review builds.
- Zero personal data for monetization; no consent banners required for review builds.
- Tracking disabled by default; monetization does not require tracking; clear, non‑coercive prompts for optional modules.
