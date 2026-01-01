# Jean System Architecture

This document outlines the high-level architecture of the Jean Sovereign Operating System.

## 1. High-Level Layer Diagram

```mermaid
graph TD
    %% --- Layer Definitions ---
    subgraph "Presentation Layer (UI)"
        UI_Shell[Shell / Desktop]
        UI_Cockpit[Governance Cockpit]
        UI_Apps[Sovereign Apps]
    end

    subgraph "Governance Layer (The Guard)"
        Gov_Engine[Governance Engine]
        Gov_Policy[Policy Enforcer]
        Gov_Consent[Consent Gate]
    end

    subgraph "Kernel Layer (The Brain)"
        Kernel_Router[Context Router]
        Kernel_Intent[Intent Resolver]
        Kernel_Symbolic[Symbolic Executor]
        Kernel_Bridge[OS Execution Bridge]
    end

    subgraph "Service Layer (Capabilities)"
        Svc_Market[Model Marketplace]
        Svc_Plugins[Plugin System]
        Svc_Domain[Domain Services]
    end

    subgraph "Infrastructure Layer (HAL)"
        HAL_Hardware[Hardware Abstraction]
        HAL_Storage[Local Storage]
        HAL_Network[Network Proxy]
    end

    %% --- Data Flow ---
    
    %% UI to Governance
    UI_Shell -->|User Intent| Gov_Engine
    UI_Apps -->|Request Action| Gov_Engine
    UI_Cockpit -->|Approve/Deny| Gov_Engine

    %% Governance to Kernel
    Gov_Engine -->|Approved Token| Kernel_Router
    Gov_Policy -.->|Validation| Gov_Engine

    %% Kernel Routing
    Kernel_Router -->|Safe Mode| Kernel_Symbolic
    Kernel_Router -->|Live Mode| Kernel_Bridge
    Kernel_Intent -->|Parse| Kernel_Router

    %% Kernel to Services
    Kernel_Bridge -->|Invoke| Svc_Plugins
    Kernel_Bridge -->|Query| Svc_Domain

    %% Services to HAL
    Svc_Plugins -->|Restricted Call| HAL_Hardware
    Svc_Domain -->|Read/Write| HAL_Storage
    
    %% Feedback Loop
    Kernel_Bridge -->|Audit Log| UI_Cockpit
```

## 2. Component Detail Breakdown

### Layer 1: Presentation (UI)
*   **Shell**: The main container, managing windows and global state.
*   **Governance Cockpit**:
    *   **Zone A (Graph)**: Visualizes the execution DAG.
    *   **Zone B (Inspector)**: Details on selected nodes/data.
    *   **Zone C (Controls)**: Physical-style buttons for HALT/APPROVE.
*   **Sovereign Apps**: React-based views for specific domains (Travel, Commerce).

### Layer 2: Governance
*   **Governance Engine**: A finite state machine (`IDLE` -> `REVIEW` -> `EXECUTING`). It is the single source of truth for "Is this allowed to run?".
*   **Consent Gate**: Manages user permissions, checking signatures and tokens.
*   **Policy Enforcer**: Static analysis of requested pipelines against user-defined rules (e.g., "No Network after 10 PM").

### Layer 3: Kernel
*   **Context Router**: Directs traffic based on safety level.
    *   *Symbolic Route*: Mocks execution for preview/safety.
    *   *Live Route*: Passes to the bridge for real execution.
*   **OS Execution Bridge**: The secure gateway to actual system resources. Verifies `ConfirmationTokens` before acting.
*   **Intent Resolver**: Translates high-level goals ("Book flight") into low-level pipeline graphs.

### Layer 4: Services
*   **Model Marketplace**: Manages AI models with a "Deny-by-Default" install policy.
*   **Plugin System**: Sandboxed environment for third-party extensions.
*   **Domain Services**:
    *   `TravelService`: Read-only flight/hotel aggregation.
    *   `LogisticsEngine`: Multi-leg delivery orchestration.
    *   `CommerceSystem`: Supplier verification and product listing.

### Layer 5: Infrastructure (HAL)
*   **Modular HAL**: Interfaces for Jean-native hardware (Physical Kill Switches, Isolated Storage).
*   **Local Storage**: Encrypted, device-bound data persistence (IndexedDB / File System).
*   **Network Proxy**: Controls all outbound requests, ensuring no telemetry leaks.

## 3. Data Flow Example: "Book a Flight"

1.  **User** clicks "Search Flights" in **UI**.
2.  **Intent Resolver** generates an `ExecutionGraph` (Fetch Data -> Filter -> Display).
3.  **Governance Engine** intercepts execution. State: `REVIEW_PENDING`.
4.  **User** reviews the graph in **Cockpit** and clicks "Approve".
5.  **Governance Engine** issues a signed `ConfirmationToken`.
6.  **Kernel Router** sees the token, switches from `Symbolic` to `Live`.
7.  **OS Bridge** executes the `Fetch` via **Network Proxy**.
8.  **Results** return to UI; **Audit Log** records the transaction.
