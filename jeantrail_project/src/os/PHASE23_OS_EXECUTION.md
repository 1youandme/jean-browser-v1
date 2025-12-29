# Phase 23: Real Execution with OS APIs

## Overview
This phase enables Jean to perform actual OS-level operations (file access, app launching) through a strictly controlled, high-security bridge. Unlike previous symbolic interactions, these actions have real-world side effects.

## Core Principles
1.  **Explicit Execution Only**: No background tasks. Every action requires a fresh, single-use user confirmation token.
2.  **No Silent Power**: Jean cannot execute commands without an audit trail and user visibility.
3.  **Kill Switch**: A global override to immediately halt all OS execution.
4.  **Context Binding**: Execution tokens are bound to specific devices and workspaces.

## OS Capability Layer (`OSActionTypes.ts`)
Defines the allowed atomic actions with associated risk profiles:
- `file_open`: Read-only, Low risk.
- `file_write`: Mutation, High risk.
- `app_launch`: External process, Medium risk.
- `clipboard_write`: System integration, Low risk.
- `system_query`: Information gathering, Low risk.

## Execution Bridge (`OSExecutionBridge.ts`)
The bridge acts as the final gatekeeper before the OS API. It validates:
- **Symbolic Route**: Must have passed the Voice/Privacy router.
- **Confirmation Token**: Cryptographically verified (mocked in current phase) and time-bound.
- **Context Integrity**: Ensures the command is executing on the intended device.
- **Kill Switch**: Checks global safety state.

## Audit & Reversibility (`ExecutionAudit.ts`)
Every execution attempt generates an immutable audit record containing:
- Action & Target
- User ID & Workspace
- Success/Failure Status
- Risk Level
- Timestamp

## Usage Example

```typescript
// 1. Route the command (Symbolic Phase)
const route = routeVoiceCommand(cmd, profile, options);

// 2. Obtain user confirmation (UI Phase)
const token = await requestUserConfirmation(route);

// 3. Execute (OS Phase)
const result = await OSExecutionBridge.execute(route, osIntent, {
  confirmationToken: token,
  expectedContext: 'local',
  workspaceId: 'ws-123'
});

if (result.status === 'success') {
  console.log('Executed:', result.auditTrailId);
}
```

## Safety Mechanisms
- **GlobalKillSwitch.engage()**: Stops all pending and future executions.
- **Reversible Hints**: Metadata indicating if an action can be undone (e.g., file writes might not be, but clipboard writes are reversible by history).

## Future Extensions
- Integration with Electron/Node.js `fs` and `child_process` modules.
- Undo stack integration using `reversibleHint`.
- Multi-step execution workflows (orchestration).
