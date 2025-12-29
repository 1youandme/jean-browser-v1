# Jean Platform - Website Messaging & Content Strategy
**Governance-First / Non-Hype / Regulator-Safe**

---

## 1. Homepage (`/`)
**Hero Section**
*   **Headline:** The Operating Substrate for Human-Directed Computation.
*   **Sub-headline:** Define boundaries. Enforce consent. Audit outcomes.
*   **Call to Action:** [Download Environment] [Read the Whitepaper]

**Value Proposition (The "Not" List)**
*   **Not an Assistant:** We do not guess your intent. We execute your verified orders.
*   **Not a Black Box:** Every computation produces a readable, local audit log.
*   **Not Cloud-Dependent:** Your logic runs on your hardware. No telemetry. No training data exfiltration.

**Core Mechanics**
1.  **The Substrate:** A runtime environment that wraps standard web technologies in a strict permission layer.
2.  **The Gate:** Code cannot execute side effects (Network/File/System) without explicit, signed consent.
3.  **The Audit:** A tamper-evident local ledger of every decision made by the system.

---

## 2. Download Page (`/download`)
**Header**
*   **Headline:** Secure Local Runtime v1.0
*   **Sub-headline:** For Windows, macOS, and Linux.

**System Requirements**
*   **Local Storage:** 2GB minimum (for local vector store and audit logs).
*   **Network:** Optional. The runtime functions fully offline.
*   **Identity:** No account required for core usage.

**The "Clean Install" Guarantee**
*   Contains no bundled adware.
*   Contains no background services or "updaters".
*   Contains no default-on telemetry.
*   **Hash Verification:** SHA-256 provided for all binaries.

---

## 3. Governance Page (`/governance`)
**Header**
*   **Headline:** The Architecture of Refusal.
*   **Sub-headline:** Why a system that says "No" is safer than one that says "Yes".

**The Three Laws of Jean Governance**
1.  **Deny by Default:** No capability (File Read, Net Request) is active until explicitly granted.
2.  **Advisory Only:** The system may suggest a course of action, but it cannot click the button.
3.  **Content-Free Audit:** We log *that* a file was read, but never *what* was in it.

**Regulatory Alignment**
*   **EU AI Act:** Compliant with "Human-in-the-loop" requirements for high-risk systems.
*   **GDPR:** Data minimization by design. No central processor of personal data.
*   **NIST AI RMF:** Maps to "Manage" and "Govern" functions.

---

## 4. Whitepaper Summary (`/whitepaper`)
**Title:** Sovereign Computation in the Age of Probabilistic Software.

**Abstract**
As software becomes probabilistic (LLMs, generative models), the determinism of traditional operating systems is lost. We cannot trust the *output* of the model, so we must govern the *process* of execution. Jean is a "Governance Substrate"—a layer between the model and the metal—ensuring that even if the logic hallucinates, the system remains safe.

**Key Concepts**
*   **The Air-Gap Protocol:** Models run in isolated memory spaces with no I/O access.
*   **The Capability Registry:** A static manifest of all possible side effects.
*   **The Consent Token:** A cryptographic proof required to bridge the Air-Gap.

---

## 5. Developer Page (`/developers`)
**Header**
*   **Headline:** Build Tools That Ask Permission.
*   **Sub-headline:** A framework for high-trust, regulated industries.

**The "John Developer" Profile**
*   Integrate your tools into the "John" governance profile.
*   Declare your capabilities upfront in the Registry.
*   Gain access to the local Vector Store and Audit Log APIs.

**Development Constraints**
*   **No Background Execution:** Your extension sleeps when the user closes the tab.
*   **No "Call Home":** Usage analytics must be strictly opt-in and local-first.
*   **Strict Typing:** All I/O must pass through the typed Jean Kernel interfaces.

**Resources**
*   [Capability Registry Spec]
*   [Audit Log Schema]
*   [Governance Manifest Validator]
