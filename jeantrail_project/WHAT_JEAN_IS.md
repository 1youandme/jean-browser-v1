# What Jean Is / What Jean Is Not

## One-Sentence Definition
Jean is a governance substrate for human-directed computation — it defines boundaries, enforces consent, explains decisions, gates execution, and audits outcomes.

## What Jean IS
- A substrate that ensures consent, clarity, and audit for all computation
- Advisory-first: plans and explanations, not automatic actions
- Local-first: processing and artifacts remain on your device
- Fail-closed: unclear or risky requests stop immediately
- Separated pipeline: planning and execution are distinct with explicit approval
- Explainable: decisions are logged with neutral, content-free events
- Consent-scoped: time-bound, minimal, revocable permissions per session

## What Jean IS NOT
- Not an assistant, not an agent, not a worker
- Not autonomous and never “proactive” in the background
- Not a controller of external systems without explicit gates
- Not a productivity hype engine or “smart helper”
- Not a scraper, not a commerce executor, not a tracker
- Not a replacement for human review or authority

## Authority Model
```
Human (authority)
   │
   ▼
Jean (governance substrate)
   │
   ▼
Tools (optional modules; execute only after approval)
```

## Why Jean Refuses Certain Actions
- Authority: human approval is mandatory; any ambiguity triggers a stop
- Scope: out-of-scope requests (automation, scraping, commerce) are refused
- Safety: actions that may introduce risk (identity recognition, background capture) are blocked
- Legal: requests that likely violate TOS or regulations are refused by design

## How Trust Is Enforced
- Consent: explicit, per-session, time-bound, revocable; deny-by-default
- Separation: plan → user approval checkpoint → scheduled execution → review
- STOP: global STOP halts immediately across tabs and queues
- Audit: content-free local audit events with timestamps and reasons
- Boundaries: read-only by default; no background processing or telemetry
- Refusals: clear, neutral language with compliant alternatives where possible

## Common Misconceptions (Q&A)
- “Is Jean an autonomous agent?”  
  No. Jean is a governance substrate. It does not act without explicit approval.
- “Can Jean speed through tasks automatically?”  
  No. Clarity over speed. Planning and execution are separate, with gates.
- “Does Jean track me or run in the background?”  
  No. No background capture, no tracking, no telemetry by default.
- “Can Jean click buttons or manipulate web pages?”  
  No. Advisory-only. Visual references (like VRTs) are labels, not actions.
- “Can Jean make purchases or handle payments?”  
  No. Commerce execution is out of scope in v1.

## Non-Negotiable Principles
- Human is always the authority
- Jean never acts autonomously
- Planning and execution are separated
- Refusal is a feature, not a failure
- STOP always works

## ASCII Diagram
```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│    Human      │ ---> │     Jean      │ ---> │     Tools     │
│  (Authority)  │      │ (Substrate)   │      │ (Optional)    │
└───────────────┘      └───────────────┘      └───────────────┘
         │                      │                      │
         │ approve              │ gate, explain        │ execute only
         ▼                      ▼                      ▼
       Plan                 Consent + Audit         After approval
```

## Short Examples
- “User points → Jean explains”  
  A user selects an area with the Visual Reference Selector; Jean labels it (VRT) and explains context. No actions performed.
- “User approves → Tool executes (optional)”  
  A plan proposes a file write; user reviews and approves; the tool executes within declared limits; audit is recorded.

## Language Rules
- No anthropomorphism, no productivity hype, no “smart assistant” framing
- Use: “substrate”, “governance”, “consent”, “boundary”, “gate”, “explain”, “audit”, “human-directed”

## Audience Notes
- Users: You remain in control; everything is explicit and revocable
- Developers: Declare authority level, execution limits, refusal conditions, audit footprint for each capability
- Regulators: Local-first, deny-by-default, content-free audit, separated pipeline, no background capture
- Enterprise buyers: Governance assured; trust-by-design; configurable gates; STOP is universal

