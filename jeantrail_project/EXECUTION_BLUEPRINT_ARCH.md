# Execution Blueprint Architecture

**Status:** DRAFT
**Role:** Principal Software Architect
**Scope:** Core Runtime Logic (Prompt → Execution)

---

## 1. High-Level Flow
The system follows a strict **Linear Staged Pipeline**. No step can be skipped.

`[Prompt] -> [Planner] -> (User Approval) -> [Scheduler] -> [Executor] -> [Reviewer]`

---

## 2. Core Components

### A. The Planner (The "Architect")
*   **Input:** User Prompt + Current Context (Files, URL).
*   **Function:** Decomposes the intent into a dependency graph of discrete **Tasks**.
*   **Output:** A `Plan` object containing an ordered list of `Task` objects.
*   **Constraint:** The Planner *cannot* execute code. It only writes the "recipe."

### B. The Task Object
A standardized unit of work.
```typescript
interface Task {
  id: string;
  type: 'FILE_CREATE' | 'FILE_EDIT' | 'SHELL_COMMAND' | 'BROWSER_ACTION';
  status: 'PENDING' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  description: string;
  payload: any; // The actual code/command
  dependencies: string[]; // IDs of tasks that must finish first
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### C. The Scheduler (The "Gatekeeper")
*   **Function:** Manages the queue. It holds all `PENDING` tasks until the User explicitly transitions them to `APPROVED`.
*   **Safety:** It enforces the **Execution Confirmation Rules** (e.g., blocking a `HIGH` risk task until a modal is confirmed).

### D. The Executor (The "Worker")
*   **Function:** Takes an `APPROVED` task and performs the actual side-effect (I/O).
*   **Isolation:** Runs in a sandboxed process.
*   **Output:** Returns a `Result` object (Success/Failure + Stdout/Stderr).

### E. The Reviewer (The "Auditor")
*   **Function:** analyzing the `Result`.
*   **Logic:**
    *   If Success: Mark Task as `COMPLETED`. Trigger next dependent task.
    *   If Failure: Mark Task as `FAILED`. Pause the queue. Suggest a "Fix Plan."

---

## 3. User Approval Checkpoints

### Checkpoint 1: The Plan Preview
*   **When:** After the Planner finishes, before *any* execution.
*   **Visual:** A "Tree View" or "Gantt Chart" of the proposed tasks.
*   **Action:** User can:
    *   **Edit:** Change a file path or command.
    *   **Delete:** Remove a step.
    *   **Approve All:** "Looks good, proceed."

### Checkpoint 2: The High-Risk Gate
*   **When:** The Scheduler encounters a `HIGH` risk task (e.g., Delete Directory, Network Request).
*   **Action:** The queue *pauses*. A modal appears: *"Task 3 wants to delete `src/legacy`. Allow?"*

---

## 4. Error Recovery Strategy (Fail-Safe)

### Strategy A: "Stop and Ask" (Default)
1.  Executor hits an error (e.g., `File not found`).
2.  Task marked `FAILED`.
3.  Queue **PAUSED**.
4.  System generates a **Repair Proposal** (e.g., "Create the missing file?").
5.  User approves Repair -> New Task inserted -> Queue Resumes.

### Strategy B: "Atomic Rollback" (Advanced)
*   For file operations, the system keeps a temporary "Undo Buffer" (shadow copy) of modified files.
*   If a multi-step edit fails halfway, the system can revert the file to its pre-task state.

---

## 5. Scalability & Safety Rationale

### Why Scalable?
*   **Decoupled:** The *Planner* (LLM) is separate from the *Executor* (Node.js). We can swap the LLM for a smarter model without rewriting the execution logic.
*   **Async:** The Scheduler handles long-running tasks (e.g., `npm install`) without freezing the UI.

### Why Safe?
*   **Deterministic State:** A Task is strictly "State A -> State B." No hidden side effects.
*   **Human-in-the-Loop:** The `PENDING` -> `APPROVED` transition is the "Air Gap" that prevents runaway agents.
*   **Audit Trail:** Every `Task` object, along with its `Result`, is saved to a local JSON log (`execution_history.json`) for post-mortem analysis.
