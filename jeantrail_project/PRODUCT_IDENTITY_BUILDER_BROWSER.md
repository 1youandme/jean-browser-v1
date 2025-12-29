# Product Identity: The Builder Browser

**Status:** FINAL DEFINITION
**Role:** Senior Product Architect
**Scope:** V1 Core Identity

---

## 1. Product Definition
**JeanTrail OS** is a specialized "Builder Browser" designed for technical creators to architect, visualize, and assemble digital projects from a unified local workspace. It functions as a sovereign operating environment that bridges the gap between ideation and file-system implementation, allowing users to structure codebases, manage documentation, and simulate workflows without relying on external cloud dependencies, black-box autonomy, or commercial integrations.

---

## 2. What The Product IS
*   **A Local-First IDE-Browser Hybrid:** A workspace that combines web rendering with local file system management, optimized for building, not consuming.
*   **A Structural Architect:** A tool for scaffolding projects, generating directory structures, and drafting technical documentation (READMEs, specs).
*   **A Passive Assistant:** An AI that generates code or text *only* when explicitly prompted, acting as a smart typewriter rather than an agent.
*   **A Visualization Engine:** A 3D/2D canvas for visualizing project states, file relationships, and architectural flows.
*   **A Sovereign Sandbox:** A contained environment where code can be drafted and previewed safely before being committed to a production machine.

---

## 3. What The Product IS NOT
*   **NOT a General Web Browser:** It is not designed for casual surfing, social media, or media consumption. It lacks features for ad-tracking, password saving for external sites, or "convenience" features that compromise privacy.
*   **NOT an Autonomous Agent:** It does not "go do work" in the background. It does not browse the web for you, check your emails, or manage your calendar.
*   **NOT a Scraper:** It has zero capabilities for extracting, storing, or processing data from third-party websites.
*   **NOT a Shopping Bot:** It has no wallet connections, no payment autofill, and no price-comparison logic.
*   **NOT a SaaS Platform:** It is not a cloud service. It is software you run on your machine.

---

## 4. Target User Persona (V1)
**"The Sovereign Architect"**
*   **Role:** Senior Software Engineer, Technical Freelancer, or Systems Architect.
*   **Mindset:** Values privacy, control, and "clean" code. Distrusts black-box AI that sends code to the cloud.
*   **Pain Point:** Overwhelmed by "helpful" AI tools that hallucinate, break privacy, or try to upsell services.
*   **Goal:** Wants a distraction-free, high-trust environment to plan and draft complex software projects before implementing them in a standard IDE (VS Code/IntelliJ).

---

## 5. Explicit Exclusions (Safety, Legal & Ethical)
To ensure absolute safety and liability protection, the following are **HARD BLOCKED** from the scope:

### A. No Commerce
*   No integration with payment gateways (Stripe/PayPal).
*   No crypto-wallet connectivity.
*   No "shopping assistant" or product search features.
*   **Reason:** Eliminates financial risk and regulatory burden (KYC/AML).

### B. No Scraping
*   No automated DOM parsing of external sites.
*   No "data extraction" pipelines.
*   **Reason:** Eliminates IP infringement risks and "bot" classification.

### C. No Third-Party Automation
*   No "logging in" to user accounts (Gmail, Twitter, LinkedIn) to perform actions.
*   No API wrappers for external platforms.
*   **Reason:** Eliminates TOS violations of other services.

### D. No Autonomous Execution
*   No `while(true)` loops for task execution.
*   No file system writes without a direct, synchronous user confirmation event.
*   No network requests initiated by the AI without a user prompt.
*   **Reason:** Eliminates "runaway agent" risk and ensures the user is always the sole author of the work.
