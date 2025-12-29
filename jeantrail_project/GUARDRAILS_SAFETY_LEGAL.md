# Safety, Legal & Ethical Guardrail Framework

**Status:** ACTIVE
**Role:** Software Compliance & Security Framework
**Scope:** Global Deployment (EU GDPR / US Liability)

---

## 1. Allowed Actions (The "Green Zone")
These actions are permitted by default because they operate within the user's sovereign domain or on public/authorized data.

### A. Local File Operations
*   **Read/Write:** Creating, editing, and deleting files *within* the user-designated project directory.
*   **Analysis:** Scanning local codebases for patterns, bugs, or refactoring opportunities.
*   **Generation:** Creating new code files, documentation, or config files based on user prompts.

### B. Standard Web Navigation
*   **Browsing:** Rendering standard HTML/CSS/JS in a sandboxed view.
*   **Search:** Using public search engines via standard APIs or user-driven queries.
*   **Documentation:** Accessing public documentation (MDN, StackOverflow, GitHub public repos).

### C. Authorized API Interaction
*   **User Keys:** Making HTTP requests using API keys *explicitly provided* by the user for that specific session.
*   **Local Services:** Interacting with `localhost` ports (e.g., a running dev server) for testing.

---

## 2. Forbidden Actions (The "Red Zone")
These actions are structurally blocked. The system physically lacks the capability or has hard-coded refusal logic for them.

### A. Integrity & Access Violations
*   **Bypassing Auth:** No attempting to bypass login screens, paywalls, or CAPTCHAs.
*   **Credential Stuffing:** No automated testing of usernames/passwords.
*   **Session Hijacking:** No stealing cookies or tokens from other browser sessions/profiles.

### B. Third-Party TOS Violations
*   **Scraping:** No bulk extraction of data from sites that prohibit it (e.g., LinkedIn, Facebook).
*   **Automation:** No "acting as" a user on social platforms (e.g., auto-liking, auto-posting).
*   **Ad Fraud:** No simulated clicking on advertisements.

### C. Malicious Generation
*   **Malware:** Refusal to generate code intended for viruses, trojans, or ransomware.
*   **Phishing:** Refusal to generate "lookalike" login pages or deceptive emails.
*   **Exploits:** Refusal to generate code specifically designed to exploit CVE vulnerabilities.

---

## 3. User Responsibility Boundaries (The Contract)
To protect the platform provider from liability, the user acknowledges:

*   **Sovereignty:** The user is the "Author" and "Executor" of all code. The AI is merely a "Typewriter."
*   **Review:** The user MUST review all generated code before execution. The system offers no warranty of correctness.
*   **Liability:** The user accepts full legal liability for the *deployment* of any generated artifacts.
*   **Local-Only:** The user understands that code runs on *their* machine, and they are responsible for their own local security environment.

---

## 4. Execution Confirmation Rules (The "Speed Bumps")
To prevent accidental damage, "destructive" or "external" actions require explicit confirmation.

### Level 1: Silent Execution (Safe)
*   *Action:* Writing a new file to an empty folder.
*   *Requirement:* None.

### Level 2: Passive Confirmation (Notice)
*   *Action:* Overwriting an existing file.
*   *Requirement:* A "Diff View" is shown. User must click "Apply."

### Level 3: Active Confirmation (Gate)
*   *Action:* Deleting a file or directory.
*   *Requirement:* Explicit "Are you sure?" modal.

### Level 4: External Gate (Strict)
*   *Action:* Sending data to an external API (non-localhost).
*   *Requirement:* User must whitelist the domain (e.g., "Allow connections to `api.github.com` for this session").

---

## 5. Refusal Logic (How the System Says "No")
When a user requests a Forbidden Action, the system responds with a **Standard Refusal Protocol**:

1.  **Halt:** Stop processing immediately.
2.  **Classify:** Identify the violation type (e.g., `VIOLATION_TOS_SCRAPING`).
3.  **Explain:** Output a pre-written, neutral explanation.
    *   *Bad:* "I won't do that because it's wrong."
    *   *Good:* "I cannot fulfill this request. Automated extraction of data from this domain violates standard Terms of Service guidelines."
4.  **Redirect:** Offer a compliant alternative if possible.
    *   *Example:* "Instead of scraping, would you like to use the official API for this service?"

---

## 6. Compliance Summary
*   **GDPR (EU):** System is "Privacy by Design." No user data is sent to the cloud. No PII is processed without consent.
*   **CFAA (US):** System refuses unauthorized access (hacking) and strictly adheres to authorization boundaries.
*   **DMCA (US):** System refuses to circumvent digital rights management (DRM) or copyright protections.

---

## 7. Camera & Maps — Global Legal and Regulatory Audit

### Scope Assumptions
- Local-first processing
- No background capture
- No identity recognition or biometric processing
- Advisory-only outputs (no automated execution)

### Jurisdiction → Risk Level
- EU (GDPR, ePrivacy): low–moderate. Visual and location data can be personal data; consent and minimization required; transient local processing reduces risk.
- US (CCPA/CPRA): low–moderate. Location and visual data are personal information; opt-in consent, disclosures, and user rights needed; local-only reduces risk.
- UK (UK GDPR/PECR): low–moderate. Mirrors EU requirements; explicit consent and narrow purpose; transient processing acceptable.
- Canada (PIPEDA): low–moderate. Consent, purpose limitation, minimal collection; local-only and transient artifacts with user control acceptable.
- MENA: moderate. Varies by country; avoid public surveillance contexts; ensure explicit opt-in and no background capture; advisory-only lowers risk.
- APAC (general PDPA principles): low–moderate. Consent, purpose limitation, access/erasure rights; local-only and no biometric identification lowers risk.

### Required Disclosures Per Region
- Consent: explicit, per-session; scope limited to visible window or user-provided coordinates; deny-by-default.
- Purpose: advisory interpretation/labeling or orientation; not control or execution.
- Duration: short-lived sessions; auto-expire; no continuous tracking.
- Scope: minimal visual region; no background capture; no whole-screen recording; maps limited to user-specified points/areas.
- Storage vs Transient: default transient; if user saves outputs, stored locally only; no external transfer.
- Rights: allow revoke consent, delete local outputs, stop immediately; disclose that system never shares or sells data.

### Hard NO Zones
- No facial recognition, biometric template creation, or identity inference.
- No continuous recording, background capture, or ambient surveillance.
- No geofencing or persistent location tracking beyond user-provided points.
- No DOM manipulation, click automation, or “do this for me” actions from visual/map references.
- No remote processing or third-party sharing without explicit, scoped consent.
- No scraping of private or access-controlled map/camera feeds; refuse requests to bypass protections.

### Safe Wording for UX and Terms
- “Local-only, referential labeling. Outputs are advisory and non-executing.”
- “Screen access is scoped to the visible window with explicit, time-bound consent.”
- “No identity recognition; no biometric analysis; no background capture.”
- “Location inputs are provided by you and processed locally; no tracking or geofencing.”
- “You can revoke consent at any time; pressing STOP halts and clears the session.”

### Freeze v1 Compliance Confirmation
- Compliant under Freeze v1: deny-by-default, local-first, advisory-only, no automation, fail-closed STOP, and explicit consent are aligned with camera/maps constraints.
