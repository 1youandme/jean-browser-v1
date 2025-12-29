# Phase 27.4: Agent Runtime Inspector

## Overview
Introduces a **read-only** inspection layer for the Agent runtime. The inspector surfaces **active agents**, **permissions granted**, **last actions attempted**, and **audit trail references** without performing any control or mutation.

## Principles
- Observational only — no mutations, no controls.
- Uses existing audit logs (OS execution audits, memory audits, decision traces).
- Decoupled from kernel/executor wiring; accepts a data source interface.

## Components
- `AgentRuntimeInspector.ts`
  - Accepts an `AgentRuntimeSource` with pure getter methods.
  - Exposes:
    - `getActiveAgents()`
    - `getPermissions()`
    - `getLastActions(limit)`
    - `getAuditReferences(limit)`
  - Maps data to lightweight DTOs suitable for UI or logging layers.

## Data Sources
- OS Execution Audits (`os/ExecutionAudit.ts`)
- Kernel Decision Traces and Memory Audits (`kernel/KernelIntrospection.ts`)

## Usage Example
```typescript
import { AgentRuntimeInspector } from './AgentRuntimeInspector';

const source = /* implementation that reads from runtime and audits */;
const inspector = new AgentRuntimeInspector(source);

const active = await inspector.getActiveAgents();
const perms = await inspector.getPermissions();
const actions = await inspector.getLastActions(20);
const audits = await inspector.getAuditReferences(50);
```

## Declarations
- Inspector does not control agents.
- Inspector does not grant/revoke permissions.
- Inspector uses existing, immutable audit data.

