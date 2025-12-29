# Phase 27.1: Visual Agent Builder

## Overview
This phase introduces the foundational logic for a **Visual Agent Builder**. It allows developers to define Agents as declarative graphs where intent flows from node to node. This system is **additive** and **non-invasive**, strictly separating definition from execution.

## Core Principles

1.  **Intent-Based**: Agents are defined by the intents they handle (e.g., `refactor_code`), not by open-ended goals.
2.  **No Loops**: The graph structure enforces a Directed Acyclic Graph (DAG) topology to prevent infinite recursion or runaways.
3.  **Declarative**: The output of this builder is a JSON-serializable `AgentGraph` structure, not executable code.
4.  **Sovereign**: Each agent explicitly declares its `MemoryScope` and `RequiredPermissions`.

## Data Structures (`AgentDefinition.ts`)

-   **`AgentManifest`**: The contract for an agent.
    -   `intentTypes`: What this agent can do.
    -   `memoryScope`: `session` | `workspace` | `none`.
    -   `requiredPermissions`: Explicit list of needs.
-   **`AgentGraph`**: The visual representation.
    -   `nodes`: Agents, inputs, outputs, routers.
    -   `edges`: Connections between them.

## Logic (`AgentGraphBuilder.ts`)

Pure functions to manipulate the graph state:
-   `createGraph(id, name)`
-   `addAgentNode(graph, manifest, pos)`
-   `connectNodes(graph, source, target)`
-   `validateGraph(graph)`: Checks for cycles and ensures validity.

## Registry (`AgentRegistry.ts`)

A simple, in-memory store for Agent definitions. It does not wire them to the kernel or executor yet. It serves as the catalog for the visual builder to pick from.

## Usage Example

```typescript
import { createGraph, addAgentNode, connectNodes, validateGraph } from './AgentGraphBuilder';
import { AgentRegistry } from './AgentRegistry';

// 1. Fetch an agent definition
const codeRefactorAgent = AgentRegistry.findByIntent('refactor_code')[0];

// 2. Start a graph
let graph = createGraph('graph_1', 'Refactoring Pipeline');

// 3. Add nodes
graph = addAgentNode(graph, codeRefactorAgent, { x: 100, y: 100 });

// 4. Validate
const validation = validateGraph(graph);
if (validation.valid) {
  console.log("Graph is valid DAG.");
}
```

## Next Steps
-   Implement the React UI (Canvas/Flow) to visualize `AgentGraph`.
-   Connect the `AgentRegistry` to the real `JeanKernel` for execution (Phase 28).
