**Phase 18 – Visual Avatar & Presence Rendering (Symbolic)**
- Rendering is not execution
- Visual state is declarative
- Avatar identity is stable and consistent

**Model**
- `VisualAvatarModel`: `identity`, `colorProfile`, `lightingProfile`, `expressionState`
- Neutral defaults: balanced color, unit exposure/contrast/saturation/gamma, no implicit shadows

**Presence Visual**
- Derived from `emotion`, `audioEnergyLevel`, `speechPlan`
- Deterministic emotion → expression mapping
- Brightness clamped around neutral baseline

**Constraints**
- Additive only
- No rendering engines
- No WebGL, Three.js, Canvas, or DOM
- Symbolic output only
- No UI execution
