# Phase 8 — Video Tool Plugin Contract

Status: ADDITIVE ONLY (Symbolic description, no execution)

Scope
- Symbolic only
- No ffmpeg, no media APIs
- No runtime hooks

Contract
- Long video support described via `durationMs` and `timeline` events
- Edits and timelines represented symbolically with operations:
  - cut, merge, overlay, transition, text, audio
- Returns metadata with `mode: symbolic`, `longForm` flag, and operation summary

Files
- `src/tools/video/VideoToolTypes.ts` defines task and result types
- `src/tools/video/VideoToolContract.ts` exposes `runVideoTool(task)` returning symbolic description

