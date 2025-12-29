# JeanTrail OS: Trust-First Feedback Architecture

**Version:** 1.0
**Role:** Trust-First Feedback Systems Design
**Philosophy:** Insight through Consent, Not Surveillance.

---

## 1. Core Philosophy: The "Glass Box" Feedback Loop
Traditional feedback systems are "Black Boxes" that silently watch users to optimize engagement. JeanTrail OS uses a "Glass Box" approach:
1.  **Explicit only:** We only know what you explicitly tell us.
2.  **Local-First:** All "feedback" is generated locally and sits in an outbox until you approve transmission.
3.  **Product, not Weight:** Feedback informs *human developers* to improve code/prompts, it does **NOT** automatically retrain the live model (preventing "poisoning" and drift).

---

## 2. Types of Feedback & Collection Points

### A. Qualitative: The "Clarification" Signal
*   **What it is:** Direct user annotation on *why* a suggestion was helpful or unhelpful.
*   **Where:** Inside the **Thought Slot** or **Audit Log**.
*   **Mechanism:** A user can highlight a specific line in the Agent's reasoning (e.g., "I chose this product because...") and add a note: *"This assumption was wrong."*
*   **Goal:** To debug the *logic chain*, not just the outcome.

### B. Behavioral: The "Sovereign Handshake"
*   **What it is:** Explicit confirmation of task success or failure.
*   **Where:** The **Decision Gate** (Phase 5).
*   **Mechanism:**
    *   **Success:** User clicks "Approve & Execute". *Signal:* The proposal matched intent.
    *   **Rejection:** User clicks "Reject". *Signal:* The proposal failed.
*   **Constraint:** This binary signal is stored *locally*. The user must opt-in to share aggregated "Success Rates" with the developers.

### C. Explainability: The "Trust Rating"
*   **What it is:** Rating the *clarity* of the explanation, separate from the *result*.
*   **Where:** The **Execution Readiness Gate** (Phase 13).
*   **Question:** *"Did you understand why Jean stopped here?"* (Yes/No).
*   **Goal:** To ensure the system isn't just "right," but "understandable." A correct action with a confusing explanation is a failure of trust.

---

## 3. The "Anti-Surveillance" List (Strictly Forbidden)
To maintain the Trust Flywheel, the following common metrics are **BANNED**:

| Metric | Why it is Banned |
| :--- | :--- |
| **Passive Cursor Tracking** | Heatmaps reveal reading habits and hesitation, which is private cognitive data. |
| **Time-on-Page / Session Length** | Incentivizes "addiction engineering." We want you to finish tasks *faster*, not stay longer. |
| **Content Scraping** | We never send the *content* of the page you were viewing (e.g., the email text, the bank balance) with a bug report. |
| **Silent Error Reporting** | Even crash dumps must be manually approved for send. No "background telemetry." |
| **Demographic Profiling** | We do not infer age, gender, or location from behavior. |

---

## 4. Sovereignty & Consent Loops
How we ensure the user remains in control of the feedback channel:

### The "Feedback Outbox"
*   Feedback is not streamed in real-time.
*   It accumulates in a local **"Transparency Outbox."**
*   User can review, redact, or delete items before clicking "Send Report Bundle" (e.g., once a week or after a crash).

### PII Scrubbing (Local)
*   Before any text enters the Outbox, a local regex/LLM pass sanitizes it:
    *   Replaces emails with `[EMAIL]`.
    *   Replaces names with `[PERSON]`.
    *   Replaces numbers with `[NUM]`.
*   The user can see the "Before" and "After" version.

---

## 5. Internal Review: Human-in-the-Loop
Feedback does not feed automation; it feeds **Architecture**.

1.  **Ingestion:** Anonymized reports arrive in the `Product-Inbox`.
2.  **Triage:** A *Human Product Manager* reviews the logic failures.
    *   *Example:* "Users are rejecting the 'Buy' suggestion because the shipping cost wasn't visible."
3.  **Action:** The *Code* or *System Prompt* is updated in the next release.
4.  **No Online Learning:** The running model *never* updates its weights based on this data dynamically. This prevents an individual user from accidentally "teaching" the agent bad habits or biases.

---

## 6. Execution Decoupling
*   **Principle:** Feedback Authority ≠ Execution Authority.
*   **Rule:** A user saying "Good Job" does **not** grant the agent more autonomy.
*   **Why:** Trust is hard to gain and easy to lose. Even if an agent succeeds 100 times, the 101st sensitive action (e.g., transferring funds) must still require the same strict **Decision Gate**. High trust does not lower the security barriers.
