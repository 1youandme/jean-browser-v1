# Jean Visual Pipeline (Offline, In-Browser)

Subsystems:
- Rigging: humanoid-compatible, jaw/eyes/brows/neck
- Blend Shapes: visemes (A, E, O, M, F, L, S)
- Audio→Phoneme Map: realtime analyser, latency target < 80 ms
- Emotion Controller: decision_state → expression + posture
- WebGL Pipeline: Three.js full-face, eye tracking, micro-movements

Assets:
- `public/assets/jean/phoneme_map.json`
- `public/assets/jean/emotion_map.json`
- Expected model: `/models/jean_final.glb` or `/models/jean_rigged.glb` (fallback to frozen)

Behavior:
- Runs fully in-browser
- No cloud processing
- No external avatar APIs
- No watermark frameworks

Verification:
- Natural speech animation
- Accurate lips sync approximation
- Eye intent with subtle micro-movements
- Emotions reflect decision states

