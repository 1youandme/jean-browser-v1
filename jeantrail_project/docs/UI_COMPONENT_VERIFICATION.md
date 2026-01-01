# UI Component Verification: ExecutionGraphViewer

## 1. Component Overview
The `ExecutionGraphViewer` is a high-assurance, read-only visualization component designed to provide transparency into the Jean Kernel's execution state without introducing control surface risks.

## 2. Read-Only Guarantees

### 2.1 API Isolation
*   **Verification**: The component imports *only* Type definitions from the Kernel and Governance domains.
    *   `../../kernel/graph/ExecutionGraph` (Types only)
    *   `../../kernel/graph/RuntimeTypes` (Types only)
    *   `../../domain/governance/types` (Types only)
*   **Result**: It is structurally impossible for this component to invoke `GovernanceEngine.approve()` or `OSExecutionBridge.execute()` as those symbols are never imported.

### 2.2 Unidirectional Data Flow
*   **Props**:
    *   `graph`: Immutable snapshot of the DAG.
    *   `governanceState`: Current string state of the engine.
    *   `nodeStatuses`: Read-only Map of runtime statuses.
*   **Callbacks**:
    *   `onNodeSelect`: Local UI selection only.
    *   *No* `onExecute`, `onApprove`, or `onPause` props exist.

### 2.3 Visual-Only State
*   **Internal State**: `transform` (Pan/Zoom) and `selectedNodeId` are the only mutable states, both contained within the React render cycle and having no side effects on the application core.

## 3. Governance Transparency Features

### 3.1 The "Why" Drawer (`NodeDetailDrawer`)
*   **Evidence**: Displays specific `constraints` (Local Only, Network Access) directly from the `NodeSpec`.
*   **Traceability**: Shows input sources (`sourceNodeId`), allowing users to trace data lineage visually.

### 3.2 Global Alerting (`GovernanceBanner`)
*   **HALT Visibility**: The banner forcibly injects itself at the top of the view when `GovernanceState === 'HALTED'`, ensuring critical safety states are never obscured by complex graphs.

## 4. Security Audit
*   [x] No executable code injection (Component renders static data).
*   [x] No network calls (Fetch/XHR not used).
*   [x] No capability leakage (Props do not expose Service instances).
