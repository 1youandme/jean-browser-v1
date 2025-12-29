# Jean Runtime Beta (v0.9.0)

## Overview
This is the **Sovereign Beta** release of the Jean Runtime. It represents a local-first, privacy-centric browser intelligence layer that operates independently of cloud accounts or external tracking.

## Capabilities
- **Local Runtime:** Executes entirely within the user's browser context.
- **Presence Engine:** Deterministic state machine managing Jean's lifecycle (Idle, Observing, Responding).
- **Safety Layer:** Active blocking of unsafe content (Pornography, Gambling, Scams) and tracking scripts.
- **Sovereign Shell:** A minimal, focused interface for interacting with the runtime.

## Limitations (Beta)
- **Memory:** State is ephemeral or session-scoped. Long-term memory is currently disabled for privacy verification.
- **UI:** The interface is functional but minimal. Advanced visualizations are in development.
- **Offline AI:** Local LLM inference is mocked or limited in this build; full Offline GPU support is on the roadmap.

## Privacy Guarantees
- **Zero Telemetry:** No user data is sent to JeanTrail servers or third parties.
- **No Tracking:** Analytics and behavioral tracking are strictly prohibited in the runtime code.
- **Local State:** All decision-making happens locally.

## Usage
1. **Launch:** Open the application to see the **Jean Presence** homepage.
2. **Status:** Jean will remain in `IDLE` state until interaction.
3. **Shell:** Click "ENTER SOVEREIGN SHELL" to access the browser workspace.
4. **Safety:** Try navigating to unsafe domains (simulated) to see the Safety Policy in action.

## Verification
Verification artifacts have been archived to `verification/runtime` and are excluded from this build.
The 3D model is frozen at `v1` (`jean_v1_frozen.glb`).
