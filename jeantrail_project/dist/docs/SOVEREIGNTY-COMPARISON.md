# Sovereignty Comparison: Web Browser Governance Models

**Date:** 2025-12-30
**Status:** Canonical Reference

This document provides a structural comparison of governance models, monetization ethics, and user sovereignty across three distinct browser archetypes:
1.  **Jean Browser** (Governance-First / Sovereign)
2.  **Brave** (Privacy-First / Commercial)
3.  **Google Chrome** (Ecosystem-First / Surveillance)

---

## 1. Comparative Analysis Matrix

| Feature | Jean Browser | Brave | Google Chrome |
| :--- | :--- | :--- | :--- |
| **Primary Philosophy** | **Governance-First:** Code serves the manifesto. | **Privacy-First:** Privacy as a product feature. | **Ecosystem-First:** Browser as a platform for services. |
| **User Sovereignty** | **Absolute:** User owns the runtime; no hidden override channels. | **High:** Strong defaults, but incentivized opt-ins (Rewards). | **Low:** User is a managed endpoint in a larger cloud ecosystem. |
| **Telemetry** | **None:** Compile-time exclusion (`#ifdef NO_TELEMETRY`). | **Minimal/Anonymized:** Used for product improvement (P3A). | **Extensive:** Default collection for usage, performance, and ads. |
| **Monetization** | **Direct/Static:** Sponsorships, Enterprise, Premium (No AdTech). | **Ads/Crypto:** Brave Rewards, BAT ecosystem, Search ads. | **Surveillance/Ads:** Data fuels the primary ad business. |
| **Default Network State** | **Silent:** No requests without user action. | **Active:** Updates, component checks, rewards sync. | **Chatty:** Constant sync, safe browsing, auto-updates. |
| **Governance Model** | **Constitutional:** Changes restricted by Manifesto. | **Corporate:** Decisions driven by user growth & revenue. | **Corporate:** Decisions driven by ecosystem dominance. |

---

## 2. Detailed Criteria Analysis

### A. User Sovereignty
*   **Jean Browser:** Designed as a "User Agent" in the literal sense. The software acts *only* on behalf of the user. It refuses to serve the vendor's interest if it conflicts with the user's interest (e.g., no auto-updates that change features without consent).
*   **Brave:** Strong protection against third parties, but the vendor retains influence (e.g., prompting for Brave Rewards, promoting Brave Search). Sovereignty is high but negotiated.
*   **Chrome:** Sovereignty is ceded to the vendor for convenience (sync, security). The browser acts as an agent of the web platform, enforcing standards that benefit the broader ecosystem (e.g., Manifest v3 limitations).

### B. Telemetry Control
*   **Jean Browser:** Adopts a "Zero-Trust" stance towards the vendor. The architecture assumes the vendor is compromised; therefore, no telemetry mechanism exists to be abused.
*   **Brave:** Uses "Privacy-Preserving Product Analytics" (P3A). It collects data but anonymizes it. This requires trust in the vendor's sanitization process.
*   **Chrome:** Collects granular usage data by default. While controls exist, they are often buried or reset by "new experiences."

### C. Monetization Ethics
*   **Jean Browser:** **Non-Extractive.** Revenue comes from visible value (Enterprise licenses, visible static sponsorships). The user is the customer, not the product.
*   **Brave:** **Substitution.** Replaces invasive ads with privacy-preserving ads (Brave Ads). Revenue relies on user attention arbitrage.
*   **Chrome:** **Surveillance.** The browser is free because it maximizes the value of the vendor's ad network inventory and data collection.

### D. Governance Transparency
*   **Jean Browser:** **Review-Gated.** Major changes require governance sign-off against the `THREAT-MODEL.md`. The Manifesto is immutable.
*   **Brave:** Open source, but roadmap is determined by corporate strategy. Community has input but no veto power.
*   **Chrome:** Closed governance. Decisions (like FLoC or Privacy Sandbox) are made unilaterally to balance privacy pressure with ad revenue needs.

---

## 3. Trade-Off Analysis

Every architectural choice carries a trade-off. Jean Browser explicitly accepts friction to gain sovereignty.

### Jean Browser Trade-Offs
*   **Convenience vs. Control:** No auto-updates means users must manually approve patches. This increases sovereignty but requires more user responsibility.
*   **Features vs. Privacy:** No cloud sync by default means bookmarks don't magically appear on your phone. Users must pay for encrypted sync or manage it locally.
*   **Ecosystem vs. Isolation:** Strict extension policies limit the library of available plugins compared to the Chrome Web Store.

### Market Position Summary
*   **Google Chrome** is for users who prioritize **convenience and ecosystem integration** above all else.
*   **Brave** is for users who want **privacy out-of-the-box** but are comfortable with a commercial relationship (crypto/ads) with the vendor.
*   **Jean Browser** is for users who demand **sovereignty and architectural guarantees**. It is for those who do not trust *any* vendor, including us, and require a browser that cannot technically betray them.
