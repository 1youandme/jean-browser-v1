# Phase 25: Jean as Personal AI OS

## Overview
Phase 25 establishes Jean as a user-sovereign "AI OS" that orchestrates intent, context, and memory without replacing the underlying OS kernel. It shifts the paradigm from "running an app" to "starting a session" where applications are merely intent providers.

## Core Concepts

### 1. AI OS Kernel (`JeanKernel.ts`)
The `JeanKernel` is the central brain that:
-   **Orchestrates Context**: Manages active sessions and their isolation levels.
-   **Routes Intent**: Receives high-level user goals ("edit this video") and dispatches them to the best registered provider.
-   **Arbitrates Tools**: Decides which app or capability gets access to the user's data for a specific task.
-   **Enforces Sovereignty**: Checks policies before allowing any action.

### 2. Session-as-OS (`KernelState.ts`)
-   **Isolation**: Each session (`OSSession`) is a contained world. By default, memory and context do not leak between sessions.
-   **Ephemeral Memory**: Data generated during a session is stored in `ephemeralMemory` and wiped upon session termination unless explicitly saved.

### 3. Application-as-Intent
-   Apps are no longer monolithic silos. They register as `IntentProvider`s.
-   Jean receives an intent (e.g., `edit_code`) and selects the best provider based on context and user preference.

### 4. User Sovereignty (`KernelIntrospection.ts`)
-   **Inspect Decisions**: Users can view a `DecisionTrace` to see exactly why Jean performed an action.
-   **Revoke Memory**: The `MemoryAuditLog` tracks data usage, and users can `revokeMemory` to scrub data from Jean's awareness.
-   **Disable Modules**: Users have the ultimate kill switch for any capability.

## Deliverables

### `src/kernel/KernelState.ts`
Defines the `KernelState`, `OSSession`, `OSProcess`, and `IntentProvider` interfaces. It establishes the "Session-as-OS" data model.

### `src/kernel/KernelIntrospection.ts`
Defines the `KernelIntrospection` interface and the `DecisionTrace` and `MemoryAuditLog` structures, ensuring the system is transparent and accountable.

### `src/kernel/JeanKernel.ts`
The implementation of the kernel logic. It manages the state, handles `dispatchIntent`, creates sessions, and provides the introspection methods.

## Declarations
-   **Jean serves the user, not the system.**
-   **OS intelligence must be inspectable.**
-   **No hidden persistence.** All memory is explicit and revocable.
