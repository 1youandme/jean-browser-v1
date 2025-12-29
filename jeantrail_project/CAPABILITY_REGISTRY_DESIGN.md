# Jean Capability Registry (The Empty Shell)

## 1. Core Concept
The **Capability Registry** is a formal declaration of "What could happen" without enabling "What is happening." It serves as the constitutional map for the Jean operating environment.

**Status:** **INERT**.
- No libraries are loaded.
- No execution paths are active.
- No models are resident in memory.

This registry defines **Work Environments** (groupings of capabilities) that are effectively "Air-Gapped" until explicitly bridged by a user action and a library binding.

## 2. Capability Schema

Every capability in the system must conform to this strict definition structure before any code can be written to implement it.

### Data Fields
1.  **Name:** Unique identifier (e.g., `fs.read.local`).
2.  **Domain:** The governance domain (e.g., `FILESYSTEM`, `NETWORK`, `DOM`).
3.  **Allowed Outputs:** Whitelist of data formats this capability can produce (e.g., `["utf8_text", "json"]`).
4.  **Execution Flag:** `FALSE` by default. Must be explicitly toggled to `TRUE` by the kernel at runtime.
5.  **Consent Requirement:** The level of human friction required.
    *   `NONE`: Internal calculation only (e.g., Math.max).
    *   `INFORMATIONAL`: Audit log entry generated.
    *   `EXPLICIT_APPROVAL`: User must click "Allow".
    *   `CRITICAL_AUTH`: User must re-authenticate (biometric/password).
6.  **Risk Classification:**
    *   `LOW`: No side effects.
    *   `MEDIUM`: Read-only external access.
    *   `HIGH`: Write access or financial impact.
    *   `CRITICAL`: System configuration or identity management.
7.  **Future Attachment Point:** A string hook ID (e.g., `hook://fs/read`) where the implementation will eventually plug in.

## 3. Governance Rules

### Rule 1: The Null State
The system boots with **zero capabilities**. The Registry is loaded as a read-only list of definitions. No libraries (Python, Node, DLLs) are loaded into memory based on this list.

### Rule 2: The Binding Handshake
An implementation library (e.g., `jean-fs-driver`) can only attach to a Registry Definition if:
1.  The Capability is enabled in the user's current `WorkEnvironment`.
2.  The library's cryptographic signature matches the Registry's allowed signer list (future).
3.  The `Execution Flag` is explicitly set to `TRUE` for this session.

### Rule 3: Output Sanitization
If a Capability declares `Allowed Outputs: ["json"]`, the Kernel will **discard** any output that is not valid JSON or contains binary blobs, preventing covert data exfiltration.

## 4. Defined Work Environments (Empty Containers)

These environments are sets of capability toggles.

### A. The "Sandbox" (Default)
*   **Capabilities:** None.
*   **Access:** Zero.
*   **Risk:** Zero.

### B. The "Librarian" (Read-Only)
*   **Capabilities:**
    *   `fs.read.local` (Consent: Explicit)
    *   `db.query.local` (Consent: Informational)
*   **Purpose:** Organizing files, searching history.

### C. The "Architect" (Planning)
*   **Capabilities:**
    *   `fs.read.structure` (Read dir only, no content)
    *   `diagram.render` (Output SVG)
*   **Purpose:** Analyzing code structure and generating diagrams.

### D. The "Operator" (High Risk - Locked)
*   **Capabilities:**
    *   `fs.write.local` (Consent: Critical)
    *   `network.request.proxy` (Consent: Explicit)
*   **Purpose:** Active development, refactoring, deploying.

## 5. Future Attachment Points (Hooks)

The registry defines *where* code will go, not *what* it is.

| Capability | Hook ID | Expected Interface |
|---|---|---|
| `fs.read.local` | `hook.fs.reader` | `(path: string) -> Result<String>` |
| `browser.tab.open` | `hook.browser.nav` | `(url: string) -> Result<TabId>` |
| `agent.think` | `hook.ai.llm` | `(prompt: string) -> Stream<Token>` |

## 6. Implementation Strategy

We will create the `jean_capability_registry` table. It will be populated with the standard definitions, but all `is_active` flags will be `FALSE`.

**Verification:**
After migration, a query for "Active Capabilities" should return **0 rows**.
