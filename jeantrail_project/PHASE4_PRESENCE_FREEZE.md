# Phase 4 — Presence Freeze (Baseline)

Status: FROZEN

Scope of Freeze:
- Runtime OS
- Sovereign Core
- PresenceView (`/presence`)
- JeanAvatar3D visual pipeline
- WebAudio presence loop
- RouteToggleHotkey (`Ctrl+Shift+J`)

Forbidden Changes:
- Do not modify runtime logic or Sovereign Core
- Do not change PresenceView behavior or audio loop thresholds
- Do not refactor, rename, or optimize avatar code
- Do not alter `RuntimeContext` or capabilities
- Do not add AI responses, intelligence, or autonomy

Allowed in Phase 5:
- Add new modules only
- No modifications to frozen layers listed above
- Extensions must be strictly decoupled and optional

Verification:
- `/presence` route renders full-screen with neutral dark background
- `JeanAvatar3D` mounts as the sole visual focus with UI hidden
- Audio-driven presence states (idle, observing, responding) functioning locally
- Hotkey `Ctrl+Shift+J` toggles `/shell` ↔ `/presence` without global state conflicts

Phase Boundary:
- Phase 5 will ONLY ADD new modules without touching frozen layers
- Any changes to frozen layers require an explicit unfreeze decision document

Checklist:
- [x] `/presence` works
- [x] Full-screen avatar, no overlays
- [x] Audio-based presence state intact
- [x] Hotkey toggle operational
- [x] Runtime and core untouched
