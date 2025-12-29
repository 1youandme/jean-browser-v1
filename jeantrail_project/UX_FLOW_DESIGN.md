# High-Control UX Flow Design

**Role:** Senior UX Architect
**Philosophy:** "The Glass Box" — See everything, control everything.
**Target:** Developer Tools / Builder Browser

---

## 1. High-Level User Journey
The journey is strictly linear to enforce the "Think -> Plan -> Act" mental model.

1.  **Intent (The Prompt):**
    *   User enters a goal in natural language (e.g., "Scaffold a React app with Tailwind").
    *   *System Action:* Analyzes intent, checks context.
    *   *UX State:* "Thinking..." (with visible thought steps).

2.  **Blueprint (The Plan):**
    *   System presents a **Structured Plan** (not code yet).
    *   *Visual:* A checklist or dependency tree.
    *   *User Action:* Review, Edit, Re-order, or Approve.
    *   *UX Principle:* "Nothing happens until you say Yes."

3.  **The Staging Area (The Diff):**
    *   For file changes, show a **Diff View** (Before vs. After).
    *   For commands, show the exact shell string.
    *   *User Action:* "Apply Changes."

4.  **Execution (The Work):**
    *   System runs the tasks.
    *   *Visual:* Terminal output streams in real-time. No hidden spinners.
    *   *User Action:* "Pause" or "Kill" button is always available.

5.  **Verification (The Review):**
    *   System reports success/failure.
    *   *User Action:* Open the Preview tab to see the result.

---

## 2. Execution Confirmation Flow
We use a **Traffic Light System** to determine friction levels.

### 🟢 Green Actions (Low Friction)
*   *Examples:* Reading a file, analyzing code, writing to a new/empty file.
*   *UX:* **Non-blocking toast notification.** ("Read src/App.tsx")
*   *Flow:* Execute immediately after Plan approval.

### 🟡 Yellow Actions (Medium Friction)
*   *Examples:* Overwriting an existing file, installing a package.
*   *UX:* **Inline Confirmation.**
*   *Visual:* The plan item has a "Review" button. Clicking it shows the Diff. User clicks "Confirm" to proceed.

### 🔴 Red Actions (High Friction)
*   *Examples:* Deleting a directory, sending a network request, exposing a port.
*   *UX:* **Modal Interruption.**
*   *Visual:* Screen dims. A modal appears: *"Command `rm -rf ./src` will delete 15 files. Type 'DELETE' to confirm."*

---

## 3. Building Trust (Visually & Functionally)

### A. The "Thought Slot"
*   **Problem:** AI is usually a black box.
*   **Solution:** Dedicated UI area that streams the AI's internal monologue *before* it generates the final response.
*   *Example:* "Analyzing project structure... Found package.json... Checking dependencies... Recommending Vite."

### B. The "Sovereign Cursor"
*   **Problem:** Users hate fighting the AI for control of the editor.
*   **Solution:** The AI never "takes over" the user's cursor. AI edits happen in a separate "Proposal" pane or "Shadow Text" that must be tab-accepted.

### C. The "Undo Stack"
*   **Problem:** Fear of breaking things paralyzes users.
*   **Solution:** Every AI action creates a Git checkpoint or local snapshot. A prominent **"Undo Last Action"** button is always visible.

---

## 4. Common UX Mistakes to Avoid

| Mistake | Why it destroys trust | Correction |
| :--- | :--- | :--- |
| **"Magic Buttons"** | Buttons labeled "Fix It" or "Make it Better" are vague. Users don't know what will happen. | **Specific Verbs:** "Format Code," "Add Error Handling," "Refactor to Async." |
| **Silent Failures** | Hiding stderr output or showing a generic "Something went wrong." | **Raw Logs:** Always expose the raw terminal error in a collapsible detail view. Developers need the stack trace. |
| **Over-Promising** | "I can build your whole app." (Then fails). | **Under-Sell:** "I can scaffold the basic structure for you to fill in." |
| **Hidden Context** | Reading files the user didn't know about. | **Context Chip:** Always show a list of "Read Files" at the top of the chat. |
