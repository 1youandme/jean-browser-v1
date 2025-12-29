# Phase 12.5 — Presence Facade

Status: ADDITIVE ONLY (Facade-only, no execution)

Scope
- No execution
- No audio/video output
- Facade only
- Must not touch KernelFacade

Files
- `src/presence/PresenceFacade.ts` exposes `buildPresence(intent, signal, text)`

Output
- Returns `{ audioLevel, speechPlan, phonemes, emotion }`
- Composed from symbolic modules

