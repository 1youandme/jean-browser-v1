# Phase 5 — Intent Detector (Step 5.1)

Status: ADDITIVE ONLY (No changes to Presence, Avatar, Audio, or Runtime)

Objective:
- Create a local, deterministic Intent Detector that interprets presence signals.
- Intent is an interpretation of user behavior, not AI reasoning.

Inputs:
- `presenceState`: idle / observing / responding (from existing lifecycle)
- `audioEnergyLevel`: 0.0 .. 1.0 (derived locally from WebAudio)
- `silenceDurationMs`: milliseconds since last detected speech-like energy
- `spikeFrequencyHz`: detected energy spike frequency (Hz)

Outputs:
- `IntentType` (enum):
  - `user_calling`
  - `user_waiting`
  - `interruption`
  - `background_noise`

Threshold Logic (Deterministic):
- RESPONDING:
  - High energy (≥ 0.6) and short silence (< 400ms) → `user_calling`
  - High spikes (≥ 4.0 Hz) → `interruption`
  - Else → `user_calling`
- OBSERVING:
  - Spikes (≥ 3.0 Hz) with mid energy (≥ 0.4) → `interruption`
  - Long silence (≥ 1500ms) with low energy (≤ 0.2) → `user_waiting`
  - Else → `user_waiting`
- IDLE:
  - High energy (≥ 0.6) or high spikes (≥ 4.0 Hz) → `background_noise`
  - Long silence (≥ 1500ms) with low energy (≤ 0.2) → `background_noise`
  - Else → `background_noise`

Files:
- `src/intent/IntentTypes.ts`
- `src/intent/IntentDetector.ts`

Why No AI:
- Phase 5.1 requires deterministic interpretation only.
- Uses simple thresholds to avoid autonomy, external dependencies, and runtime changes.

Consumption in Future Phases:
- Downstream modules can import `detectIntent(signals)` and branch UI or logs.
- No actions triggered by this detector in Step 5.1.
- Remains optional and decoupled from frozen layers.

Verification:
- Importing the detector has no side effects.
- No UI changes.
- No new permissions or capabilities.
- Presence, Avatar, Audio, and Runtime remain unchanged.
