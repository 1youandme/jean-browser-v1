# JEAN MODEL CONTRACT (Frozen v1)

## Asset Definition
**Primary Asset:** `dist/models/jean_v1_frozen.glb`
**Status:** FROZEN (Immutable)
**Version:** v1.0.0 (Architecture Freeze)

## Guarantees
1. **Stability:** This specific binary file (`jean_v1_frozen.glb`) is guaranteed to be the canonical representation of Jean for the Beta release.
2. **Immutability:** No further changes to geometry, rigging, or texture mapping will be applied to this file. Any future updates must result in a new versioned file (e.g., `v2`).
3. **Compatibility:** The model is validated for:
   - Three.js / React-Three-Fiber standard loaders.
   - WebGL 2.0 contexts.
   - Standard PBR material workflows.

## Integration Expectations
- **Loading:** UI components must load this asset asynchronously.
- **Scaling:** The model is normalized. UI consumers should apply uniform scaling if resizing is needed, but should default to scale `[1, 1, 1]`.
- **Orientation:** The model faces positive Z (or standard forward vector) by default.
- **Animation:** Supports standard mixamo-compatible or embedded animation tracks for Idle/Speaking states.

## UX Safety
This model is deemed "UX-safe" for public deployment. It contains no experimental or unstable geometry that would cause visual artifacts in a standard browser environment.
