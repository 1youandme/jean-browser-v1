# Phase 26: Browser Extension & Address Bar Intelligence

## Overview
Phase 26 transforms the browser from a passive window into an intelligent, privacy-first agent. It redefines the address bar as an intent analyzer and turns tabs into sovereign, isolated contexts. It also introduces a secure, sandboxed extension ecosystem for local device integration.

## Core Components

### 1. Address Bar Intelligence (`AddressBarAgent.ts`)
-   **Contextual Assistant**: The address bar analyzes the URL and page title to determine user intent (e.g., Reading, Watching, Coding).
-   **Privacy First**: It strictly avoids reading data from sensitive domains (banking, login screens).
-   **Intent Suggestions**: Proactively suggests relevant actions (e.g., "Summarize this article") without user prompting.

### 2. Tab-Aware Presence (`TabContextManager.ts`)
-   **Sovereign Tabs**: Each tab runs in its own isolated `OSSession`. By default, no data leaks between tabs.
-   **Explicit Leakage**: Cross-tab communication requires explicit user consent via `allowCrossTabLeakage`.
-   **Symbolic Summary**: Maintains a high-level "intent summary" for each tab to help the user switch contexts efficiently.

### 3. Extension Ecosystem (`ExtensionSandbox.ts`)
-   **Sandboxed Execution**: Extensions run in a simulated sandbox (`ExtensionSandbox`) and must declare all required capabilities upfront.
-   **Local Device Power**: Supports powerful local capabilities like `local_file_read` and `device_simulation`, but only behind explicit permission gates.
-   **Instant Revocation**: Users can revoke any permission at any time, instantly terminating the extension if it depends on that capability.

## Deliverables

### `src/browser/AddressBarAgent.ts`
Implements the `AddressBarAgent` class, which handles:
-   `analyze(url)`: Returns privacy level, intent, and suggestions.
-   `isSensitive(url)`: Blocks analysis on banking/login sites.

### `src/browser/TabContextManager.ts`
Implements `TabContextManager`, responsible for:
-   `registerTab()`: Creates isolated sessions.
-   `allowCrossTabLeakage()`: Manages consent for data flow.

### `src/browser/ExtensionSandbox.ts`
Implements the secure extension runtime:
-   `install()`: Loads extension manifests.
-   `grantPermission()` / `revokePermission()`: User-controlled gates.
-   `run()`: Executes extensions only if permissions are satisfied.

## Declarations
-   **The browser becomes intelligent, not invasive.**
-   **Tabs are sovereign.**
-   **The user is the root authority.**
