# Phase 9 — Workspace Manager Policy

Status: ADDITIVE ONLY (Decision rules, no execution)

Selection
- Jean selects a workspace based on `taskType` first, then `intent`.
- Supported workspace types: code, design, document, data, 3d, video.
- If no match, defaults to `document`.

Constraints
- No auto-switching allowed yet.
- No execution or wiring into runtime.
- Pure logic only; side-effect free.

Files
- `src/workspace/WorkspacePolicy.ts` provides `decideWorkspace(intent, taskType)`.

