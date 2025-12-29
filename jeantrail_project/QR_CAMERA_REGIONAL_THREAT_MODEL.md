# Regional Threat Model — QR + Camera Capability (V1)

Scope: user-initiated, single-capture reference; QR decoding, text reading, translation; local-only processing; advisory output only; no automation or background capture.

---

## EU (GDPR, ePrivacy)

### Threat Table
| Area | Threat | Severity | Mitigations |
| --- | --- | --- | --- |
| Legal | Surveillance classification risk | Low–Medium | Session-scoped consent; visible active indicator; no continuous capture; audit-only events; disclose reference-only scope |
| Legal | Biometric processing risk | Low | Explicit refusal of biometric detection; no face tracking; generic object labels only |
| Legal | Consent sufficiency | Low | Per-session, time-bound consent; clear purpose (QR/Text); STOP revocation; deny-by-default |
| Legal | Data retention liability | Low | No persistence by default; local-only processing; optional save requires explicit user action and path confirmation |
| Technical | Camera misuse escalation | Medium | Single-frame/short-burst limits; visible indicator; STOP halts immediately |
| Technical | Background capture abuse | Low | No background API; indicator must be visible; session auto-expire |
| Technical | Frame persistence risk | Low | Ephemeral buffers; secure discard after processing; configurable max buffer size |
| Technical | OCR leakage vectors | Low–Medium | Redaction filters; no secret/env strings in outputs; advisory-only text |
| UX | Scope misunderstanding | Medium | Clear copy: “reference-only”; refusal messages for actions; on-screen indicator |
| UX | False sense of automation | Low–Medium | No action buttons; advisory text only; manual next step |
| UX | Consent fatigue | Low–Medium | Short consent copy; session timeout; reusable disclosures without hidden opt-ins |
| Adversarial | Coercing scans of people | Low–Medium | Detect biometric patterns and refuse; visible indicator deters covert use |
| Adversarial | OCR for identity inference | Low–Medium | Redaction filters; refuse ID numbers when detected (configurable) |
| Adversarial | Environment reconstruction | Low | Single capture; no panorama; no continuous recording |

### Jurisdictional Language
- “Local-only, single-capture, reference-only. No background capture, no identity recognition.”
- “You can revoke consent at any moment; pressing STOP halts the session.”

### Why This Is Not Surveillance
- No continuous recording; visible indicator; per-session consent; refusal of biometrics; content-free audit only.

---

## US (CCPA/CPRA, state-level)

### Threat Table
| Area | Threat | Severity | Mitigations |
| --- | --- | --- | --- |
| Legal | Surveillance classification risk | Low–Medium | Explicit disclosures; session-bound consent; local-only processing |
| Legal | Biometric processing risk (state laws) | Low–Medium | Strict refusal of biometric features; zero storage of images; advisory output only |
| Legal | Consent sufficiency | Low | Opt-in consent per session; clear scope; revocation via STOP |
| Legal | Data retention liability | Low | No default retention; optional local save only via explicit action |
| Technical | Camera misuse escalation | Medium | Single/burst captures; indicator; STOP; max session time |
| Technical | Background capture abuse | Low | No background APIs; UI indicator required; auto-expire |
| Technical | Frame persistence risk | Low | Ephemeral buffers; secure discard; audit of session end |
| Technical | OCR leakage vectors | Low–Medium | Redaction; treat decoded text as user-provided; no cloud transmission |
| UX | Scope misunderstanding | Medium | Plain-language copy; refusal for action requests |
| UX | False sense of automation | Low–Medium | No auto-act; advisory-only outputs |
| UX | Consent fatigue | Low–Medium | Short consent; minimal frequency; deny-by-default |
| Adversarial | Coercing scans of people | Low–Medium | Biometric refusal; indicator deters covert use |
| Adversarial | OCR for identity inference | Low–Medium | Redaction for IDs; flag and refuse sensitive patterns |
| Adversarial | Environment reconstruction | Low | No continuous capture; single frame only |

### Jurisdictional Language
- “Local-only processing; advisory outputs. No sale/share of data. No identity recognition.”

### Why This Is Not Surveillance
- Single-capture; no background recording; refusal of biometrics; no storage by default; opt-in consent.

---

## UK

### Threat Table
| Area | Threat | Severity | Mitigations |
| --- | --- | --- | --- |
| Legal | Surveillance classification risk | Low–Medium | Consent, visible indicator, no continuous capture |
| Legal | Biometric processing risk | Low | Refusal of biometric detection; no identity inference |
| Legal | Consent sufficiency | Low | Time-bound per session; STOP revocation; clear scope limits |
| Legal | Data retention liability | Low | No default persistence; optional save only by explicit user action |
| Technical | Camera misuse escalation | Medium | Single/burst capture; STOP; indicator |
| Technical | Background capture abuse | Low | Deny background; indicator required |
| Technical | Frame persistence risk | Low | Ephemeral buffers; discard policy |
| Technical | OCR leakage vectors | Low–Medium | Redaction; advisory-only outputs |
| UX | Scope misunderstanding | Medium | Clear UI copy; refusal on action attempts |
| UX | False sense of automation | Low–Medium | Advisory-only; manual next steps |
| UX | Consent fatigue | Low–Medium | Minimal copy; deny-by-default |
| Adversarial | Coercion to scan people | Low–Medium | Refuse biometric patterns; indicator |
| Adversarial | Identity inference via OCR | Low–Medium | Redaction for sensitive patterns; refuse |
| Adversarial | Environment reconstruction | Low | Single capture only |

### Jurisdictional Language
- “Reference-only; no identity recognition; local-only; consent required per session.”

### Why This Is Not Surveillance
- No bulk or continuous capture; visible indicator; consent gates; biometric refusal.

---

## MENA

### Threat Table
| Area | Threat | Severity | Mitigations |
| --- | --- | --- | --- |
| Legal | Surveillance classification risk (varies) | Medium | Strong visible indicator; session consent; advisory-only outputs |
| Legal | Biometric processing risk | Low–Medium | Refuse biometric detection; no identity inference |
| Legal | Consent sufficiency | Low–Medium | Explicit opt-in; STOP; local-only disclosure |
| Legal | Data retention liability | Low | No default persistence; explicit-save-only |
| Technical | Camera misuse escalation | Medium | Single/burst limit; STOP; indicator |
| Technical | Background capture abuse | Low | No background APIs; auto-expire |
| Technical | Frame persistence risk | Low | Ephemeral buffers; discard; size caps |
| Technical | OCR leakage vectors | Low–Medium | Redaction; advisory-only; no external calls |
| UX | Scope misunderstanding | Medium | Local language copy options; refusal guidance |
| UX | False sense of automation | Low–Medium | Advisory-only; no action buttons |
| UX | Consent fatigue | Low–Medium | Short consent; deny-by-default |
| Adversarial | Coercion to scan people | Medium | Biometric refusal; indicator |
| Adversarial | Identity inference via OCR | Medium | Redaction; refusal of sensitive patterns |
| Adversarial | Environment reconstruction | Low–Medium | Single capture; no panoramas |

### Jurisdictional Language
- “Local-only, reference-only; no identity recognition; consent required; STOP halts immediately.”

### Why This Is Not Surveillance
- Non-continuous, user-initiated capture; visible indicator; strict refusals; no storage or transmission.

---

## APAC (Japan, Singapore baseline)

### Threat Table
| Area | Threat | Severity | Mitigations |
| --- | --- | --- | --- |
| Legal | Surveillance classification risk | Low–Medium | Purpose-limited consent; visible indicator; advisory-only outputs |
| Legal | Biometric processing risk | Low–Medium | Refusal of biometric detection; no identity inference |
| Legal | Consent sufficiency | Low | Clear scope (QR/Text); time-bound consent; STOP |
| Legal | Data retention liability | Low | No default persistence; explicit-save-only |
| Technical | Camera misuse escalation | Medium | Single/burst capture; STOP; indicator |
| Technical | Background capture abuse | Low | No background APIs; auto-expire |
| Technical | Frame persistence risk | Low | Ephemeral buffers; discard; capped buffers |
| Technical | OCR leakage vectors | Low–Medium | Redaction; local-only; advisory-only |
| UX | Scope misunderstanding | Medium | Clear copy; refusal copy; local language variants |
| UX | False sense of automation | Low–Medium | Advisory-only; no execution controls |
| UX | Consent fatigue | Low–Medium | Minimal consent; deny-by-default |
| Adversarial | Coercion to scan people | Low–Medium | Biometric refusal; indicator |
| Adversarial | Identity inference via OCR | Low–Medium | Redaction; refusal of sensitive patterns |
| Adversarial | Environment reconstruction | Low | Single capture; no continuous capture |

### Jurisdictional Language
- “Local-only processing; advisory references; no background capture; consent per session; STOP available.”

### Why This Is Not Surveillance
- Designed for single, user-initiated reference; consent and indicator visible; biometrics refused; no persistence/transmission.

---

## Mitigation Mapping (Global)
- Technical hard limits: single/burst capture; time-bound sessions; local-only; ephemeral buffers; size caps; STOP immediate halt
- UX friction: prominent active indicator; refusal copy; advisory-only outputs; manual next steps
- Refusal logic: biometric detection refusal; automation/action refusal; sensitive pattern redaction/refusal
- Audit-only logging: content-free events for consent start/end, capture, STOP, refusal; no image payload logs
- Jurisdictional language adjustments: region-appropriate disclosures emphasizing local-only, reference-only, consent, and STOP controls

## Success Criteria
An auditor can verify the system cannot be repurposed into surveillance due to single-capture design, visible camera indicator, strict refusals, local-only processing, no persistence by default, and content-free auditing.
