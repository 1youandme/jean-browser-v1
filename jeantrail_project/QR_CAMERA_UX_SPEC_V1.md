# QR + Camera UX Specification (V1)

## Scope
- User-initiated camera use only
- Local-only processing
- Advisory output only
- No automation
- No background capture

## Supported Use Cases
- QR code reading
- Text reading (signs, menus, labels)
- Language translation (local output)
- Object labeling (non-biometric, generic)

## Out of Scope (Explicit)
- Facial recognition
- Identity inference
- Continuous capture
- Environment profiling
- Behavior analysis
- Automatic navigation or actions

## UX Flow (Required)
1) User intent trigger (explicit action): user taps “Camera (QR/Text)” button
2) Consent modal (session-scoped): time-bound, scope-limited (QR/Text only)
3) Camera active indicator (always visible): persistent banner/light icon
4) Capture action (single frame or short burst): manual press; no auto-repeat
5) Local decode / OCR: on-device only; no uploads
6) Jean explanation (what was detected): advisory text only
7) User decision (manual next step): copy/save/translate; never auto-act
8) Session auto-expire + STOP: auto-expires; STOP revokes immediately

## Consent Requirements
- Per-session; deny-by-default
- Time-bound (e.g., 2 minutes or single capture)
- Clear scope: QR/text-only; generic labels; no biometrics
- Visible indicator while active (banner/icon)
- Immediate STOP + revoke; consent ends on STOP or timeout

## Data Handling Rules
- Frames processed locally; no cloud transmission
- No image persistence by default; ephemeral buffers only
- Decoded output treated as user-provided text
- Optional local save only by explicit user action (filename + path shown)
- No correlation across sessions; no provider memory

## Error & Refusal States
- Biometric patterns detected → refuse
- Camera access denied → explain cause and instructions
- User requests automatic action → refuse with guidance

## Consent Copy
- Title: “Camera Session — QR/Text (Reference Only)”
- Body (short):
  - “Local-only processing; no uploads.”
  - “Reference outputs only; no actions are performed.”
  - “Session is time-bound; STOP revokes immediately.”
- Confirm:
  - “I consent to a time-bound QR/Text session”

## Refusal Copy
- Biometric:
  - “Refused — biometric detection is not allowed. This session is limited to QR/text and generic labels.”
- Automation:
  - “Refused — this feature does not perform actions. Outputs are advisory references only.”
- Access:
  - “Camera access denied by the system. Please enable camera permissions to proceed.”

## User Flow Diagram (ASCII)
```
User
  │   (tap Camera: QR/Text)
  ▼
Consent (session-scoped) ──► Active Indicator (visible)
  │                               │
  ▼                               ▼
Capture (single/burst) ──► Local Decode/OCR (on-device)
  │                               │
  ▼                               ▼
Explain (advisory text) ──► User Decision (manual next step)
  │                               │
  ▼                               ▼
Auto-Expire/STOP ─────────► Session End (no persistence by default)
```

## Security Notes for Auditors
- Local-first: all processing on device; no telemetry; no cloud calls
- Consent-by-default: explicit, scoped, time-bound; auto-expire; STOP halts immediately
- Advisory-only: outputs are references (text/labels), never actions
- No biometrics: refusal triggers on facial/identity-like patterns
- No background capture: camera active indicator is always visible; no ambient recording
- No persistence: frames discarded; decoded text saved only by explicit user action
- Audit: content-free events for consent start/end, capture, refusal, STOP; no image payload logging
- Legal alignment: GDPR/CCPA-friendly patterns (minimization, user rights, local-only)

## UI Elements (V1)
- Entry button: “Camera (QR/Text)”
- Active indicator: banner “Camera active — reference-only”; STOP button adjacent
- Capture control: “Capture frame” / “Short burst (3 frames)” with explicit count
- Output pane: decoded QR text; OCR text; optional translate (local)
- Save controls: “Copy”, “Save locally…” (path confirmation modal)

## States
- Idle: camera off; button visible
- Consent: modal blocking; accept or cancel
- Active: indicator visible; capture buttons enabled
- Processing: progress bar; local-only decode/OCR; inline status
- Output: advisory text; no buttons to “act” on external systems
- End: auto-expire or STOP; indicator removed; ephemeral buffers cleared

## Threat Model (Selected)
- Surveillance misuse: mitigated by session-bound consent, visible indicator, no continuous capture
- Identity inference: mitigated by biometric refusal and scope limits
- Data exfiltration: mitigated by local-only processing, no cloud transmission
- Automation creep: mitigated by advisory-only outputs and refusal copy
- Hidden persistence: mitigated by ephemeral buffers and explicit-save-only design

