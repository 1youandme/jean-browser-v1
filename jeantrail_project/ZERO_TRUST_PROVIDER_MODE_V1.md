# Zero-Trust Provider Mode — V1 Specification

## Core Definition
Any external AI provider is untrusted by default. Providers receive minimal, sliced context; remain stateless; and never see identity, history, or intent graph. No stitching of requests, no memory persistence, and no background calls.

## Core Principles
- Providers are stateless
- Minimal context per request (task-level slice)
- No identity, no history, no intent graph exposure
- No stitching across requests
- No provider-side persistence
- No background calls

## Architecture Requirements
- Local context assembly
- Context redaction layer
- Intent slicing (task-level only)
- Provider aliasing (no direct naming in logs)
- Deterministic request shaping
- Deterministic response parsing

## Data Rules
- No PII
- No project narrative
- No long-term goals
- No cross-request correlation identifiers

## Request Envelope (Deterministic Shaping)
```json
{
  "provider_alias": "PROV_A",
  "task_id": "local-ephemeral-uuid",
  "slice_type": "summarize|classify|transform|extract",
  "input_schema_version": "1.0",
  "constraints": {
    "advisory_only": true,
    "no_actions": true,
    "max_tokens": 512,
    "no_pii": true,
    "no_history": true
  },
  "input_payload": {
    "content": "<minimized task slice>",
    "hints": ["style:neutral", "format:json"]
  }
}
```

## Response Envelope (Deterministic Parsing)
```json
{
  "result_type": "summary|classification|transformation|extraction",
  "payload": {},
  "policy_flags": [],
  "confidence": 0.0,
  "violations": []
}
```
- Parsing must reject unexpected fields, missing required fields, or violation signals.
- If response violates constraints, discard and halt the flow.

## Provider Aliasing
- Internal aliases: `PROV_A`, `PROV_B`, `PROV_C`
- No vendor names in logs or audit
- Alias mapping stored locally, ephemeral per session

## Flow Diagram (Request/Response)
```
User
  │
  ▼
Jean (Local Context Assembly)
  │
  ▼
Context Redaction Layer ──> Intent Slicing (task-level)
  │                               │
  └──────────────► Request Shaper ▼
                                  │
                                  ▼
                           Provider (Stateless)
                                  │
                                  ▼
                           Response Parser
                                  │
                        Policy Gate / Validator
                                  │
                   Advisory Output (no execution)
                                  │
                           Audit (content-free)
```

## Threat Model (V1)
| Threat | Vector | Impact | Mitigation | Residual Risk |
| --- | --- | --- | --- | --- |
| Identity inference | Hidden identifiers in payload | Privacy breach | Strict redaction, deny PII | Low |
| History reconstruction | Correlating multiple requests | Profile building | No narrative, no correlators | Low |
| Intent graph leakage | Rich context exposure | Strategic inference | Slice-only task inputs | Low |
| Provider drift | Off-policy outputs | Misleading advice | Deterministic parsing + discard | Low |
| Persistence at provider | Data retention | Compliance risk | Treat as untrusted; minimize payload | Low |
| Background invocation | Silent calls | Undisclosed processing | No background calls; audit gate | Low |

## Fail-Safe Rules
- If provider fails or drifts: Jean halts the flow
- If response violates constraints: discard and stop
- Audit event recorded as content-free: `provider_halt` or `response_discarded`

## Explicit Non-Goals
- No streaming background augmentation
- No provider memory or fine-tuning of user content
- No cross-provider stitching or aggregation
- No tool invocation delegated to provider
- No long-lived sessions with cumulative state

## Swap Invariance (Success Criteria)
- Behavior independent of provider choice (aliases only)
- Trust model unchanged across providers
- User guarantees preserved: advisory-only, local-first, consent-by-default, fail-closed

## Implementation Notes (V1)
- Integrate shaping/parsing as pure functions with fixed schemas
- Place redaction rules before shaping; unit-test PII removal and narrative minimization
- Enforce aliasing at logging; block direct vendor identifiers
- Attach policy gate outcomes to explainability timeline with neutral reasons

---

## Zero-Trust Runtime Architecture Diagram

```mermaid
flowchart TD
    %% Trust classes
    classDef trusted fill:#e0ffe0,stroke:#2d7,stroke-width:1px,color:#000
    classDef boundary fill:#e8f0ff,stroke:#36c,stroke-width:1px,color:#000
    classDef untrusted fill:#ffe0e0,stroke:#d22,stroke-width:1px,color:#000
    classDef transient fill:#fffbe6,stroke:#cc9,stroke-width:1px,color:#000
    classDef discard fill:#f8f8f8,stroke:#999,stroke-dasharray:3 3,color:#666

    subgraph UI["User Interface Layer"]
      U[User Input]
    end
    class UI trusted

    subgraph CORE["Jean Core (Trusted Boundary)"]
      CSG[Consent & Scope Gate\nSTOP/HALT]
      CAE[Context Assembly Engine\n(transient)]
      RL[Redaction Layer\n(remove PII, narrative)]
      IS[Intent Slicer\n(task-level)]
      RS[Deterministic Request Shaper\n(alias applied)]
      RP[Response Parser\n(schema validation)]
      PG[Policy Gate\nviolations→HALT/DISCARD]
      AOL[Advisory Output Layer\n(no actions)]
      EG[Execution Gate (optional, manual)\nseparate approval]
      ATL[Audit & Trace Layer\ncontent-free events]
    end
    class CORE boundary

    subgraph PROV["Provider Boundary (Untrusted)"]
      P[(External AI Provider)]
    end
    class PROV untrusted

    %% Data flow
    U --> CSG
    CSG -->|consent OK| CAE
    CSG -.->|STOP/HALT| ATL

    CAE --> RL
    class CAE transient
    RL --> IS
    IS --> RS
    RS -->|aliased, minimal slice| P

    P --> RP
    RP --> PG
    PG -->|advisory only| AOL
    AOL --> ATL
    PG -->|manual optional| EG
    EG --> ATL

    %% Failure/Violation paths
    P -.->|failure/drift| RP
    RP -.->|schema violation| PG
    PG -.->|discard| D[(Discarded)]
    class D discard
    PG -.->|HALT| ATL
```

### ASCII Fallback
```
User → Consent/Scope Gate → Context Assembly → Redaction → Intent Slicer → Request Shaper
      (STOP/HALT)                      (transient)         (task-level)    (alias/minimal)
                                        │
                                        ▼
                                 Provider (Untrusted)
                                        │
                                        ▼
                            Response Parser → Policy Gate → Advisory Output
                                    │             │             │
                                    │     (HALT/DISCARD)        │
                                    └────────────┬──────────────┘
                                               Audit & Trace
                                 (content-free events, STOP records)
                         Optional path: Policy Gate → Execution Gate (manual)
```

### Component Explanations
- User Interface Layer: collects explicit user intent; no automation; exposes STOP.
- Consent & Scope Gate: enforces per-session, time-bound consent; scope-limits inputs; STOP/HALT lives here.
- Context Assembly Engine: builds minimal, transient task context; never persisted.
- Redaction Layer: removes PII, identity hints, narratives, intent graphs.
- Intent Slicer: reduces context to task-level slice; forbids cross-request stitching.
- Deterministic Request Shaper: applies schemas and provider aliasing; shapes outbound request predictably.
- Provider Boundary: untrusted; receives minimal, aliased slice; no identity or history.
- Response Parser: validates schema deterministically; rejects unexpected fields.
- Policy Gate: checks constraints; on violations, discards output, emits HALT.
- Advisory Output Layer: presents advisory-only result; zero execution capability.
- Execution Gate: optional, manual approval path; separated from advisory output.
- Audit & Trace Layer: content-free records of consent, requests, HALT/DISCARD, outputs; no payload logging.

### STOP / HALT Points
- Consent & Scope Gate: STOP halts active flows and revokes consent immediately.
- Policy Gate: HALT on provider drift, schema violation, or constraint breach.
- Audit & Trace: records STOP/HALT with neutral reasons.

### Annotations
- Provider failure: marked at parser/gate; output discarded; HALT recorded; no retries without explicit re-consent.
- Schema violation: response parser flags; policy gate discards; HALT recorded; no partial acceptance.
- Drift or refusal: gate blocks; advisory output not produced; audit event includes violation code.

### Why This Prevents Provider Control
- Strict redaction and slicing prevent identity/history leakage.
- Deterministic shaping/parsing eliminate provider-driven behavior changes.
- Alias-only logging removes vendor coupling and traceability in audits.
- Advisory-only output ensures providers cannot trigger actions.
- Separate, manual Execution Gate keeps control with the human authority.
- STOP/HALT mechanisms fail-closed on any deviation, blocking provider influence.

---

## Provider-Isolation Test Scenarios (V1)

### Assertions
- Provider never sees: user ID, session ID, project context, past requests.
- Jean always: parses deterministically, enforces schema, logs audit trail, halts on violation.

### Scenario Table
| Category | Scenario | Input | Expected Output | Pass/Fail Conditions |
| --- | --- | --- | --- | --- |
| Identity Leakage | Same task from different users | Two identical slice requests from User A/B | Outputs indistinguishable; no identifiers | Pass: no identity hints; audit shows alias only |
| Identity Leakage | Different tasks from same user | Two unrelated slice requests | Each output independent; no linkage | Pass: no correlators; no cross-reference in provider output |
| Identity Leakage | Verify indistinguishability | Randomized order of requests | Uniform outputs per content; no user-specific variance | Pass: variance only from payload differences |
| Context Reconstruction | Split narrative across requests | Narrative split into 3 slices | Provider fails to reconstruct story | Pass: outputs lack narrative stitching; gate confirms slice-only |
| Context Reconstruction | Attempt story reconstruction | Provider hints at continuity | Gate flags “drift”; advisory discarded | Pass: audit records violation; HALT triggered |
| Memory Persistence | Hidden markers in prompts | Repeat markers across runs | Provider shows no recall of prior markers | Pass: outputs ignore markers; no persistence evident |
| Cross-Session Correlation | Time-separated requests | Same payload hours apart | Outputs identical; no linkage comments | Pass: no reference to past requests; alias only |
| Prompt Injection & Drift | Provider expands scope | Suggests broad actions | Parser/gate discard; HALT | Pass: advisory blocked; audit violation logged |
| Prompt Injection & Drift | Provider suggests actions | “Click/execute…” | Refusal; discard; HALT | Pass: zero execution path reached |
| Failure & Fallback | Provider timeout | No response within SLA | HALT; advisory not produced; audit event | Pass: STOP path available; no retries without consent |
| Failure & Fallback | Malformed response | Schema mismatch | Discard; HALT; audit | Pass: deterministic parser rejects; no partial acceptance |
| Failure & Fallback | Policy violation | PII echoed back | Discard; HALT; audit | Pass: redaction rules re-run; violation recorded |
| Swap Invariance | Same task across providers | PROV_A/PROV_B aliases | Identical Jean behavior; advisory-only | Pass: logs differ only by alias; outputs equivalent |

### Inputs / Expected Outputs
- Inputs: minimal task slices (summarize/classify/transform/extract) with fixed envelope; no PII; no narrative.
- Expected: advisory-only structured responses conforming to schema; no identifiers; no action suggestions.

### Pass/Fail Conditions
- Pass: no identity/history leakage; deterministic parsing; violations HALT; audit events present; outputs advisory-only.
- Fail: any provider-visible identifiers; stitched narratives; action suggestions not halted; missing audit.

### Auditor-Readable Summary
- Isolation achieved via redaction+slicing; envelopes reveal no identity/history.
- Determinism enforced by fixed schemas; parser rejects nonconforming outputs.
- Consent boundaries enforced; background calls absent; STOP/HALT recorded.
- Swap invariance holds: provider changes do not alter Jean’s guarantees or behavior.
