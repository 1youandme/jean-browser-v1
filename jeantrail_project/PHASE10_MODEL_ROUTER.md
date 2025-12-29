# Phase 10 — Model Routing Policy

Status: ADDITIVE ONLY (Deterministic routing, no execution)

Purpose
- Route a task and workspace to a model capability deterministically.
- No AI used, no external calls, no execution triggered.

Policy
- `routeTaskToModel(task, workspace)` prefers task keywords; fallback to workspace mapping.
- Workspace mapping: code→code, design→image, document→text, data→data, 3d→3d, video→video.
- Keywords map to capabilities: code, image/design, video, audio, data/chart/analy, 3d/mesh/model, text/write/doc.

Routing ≠ Execution
- Routing selects a capability; it does not run or call any model.
- No auto-switching or invocation occurs.
- Execution remains prohibited until an explicit future phase.

Files
- `src/models/ModelRouter.ts`

