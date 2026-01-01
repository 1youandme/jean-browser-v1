# About Jean — Governance Artifact v1.0

Version: Governance Artifact v1.0
Date: 2026-01-01
Status: Frozen (Public Review)

## 1. Governance Principles
- Explicit consent required for all execution
- Deny-by-default; background activity disabled
- Global kill switch halts execution immediately
- Symbolic execution as default path
- Local-first storage; zero telemetry
- Visible audit trails for decisions

Evidence:
- `src/domain/governance/GovernanceEngine.ts:49`
- `src/runtime/ContextRouter.ts:11`
- `src/os/OSExecutionBridge.ts:101`

## 2. 12–24 Month Roadmap (Non-Binding)
- Phase 1: Safe Observer
- Phase 2: Pipeline Pilot
- Phase 3: Physical Bridge
- Phase 4: Sovereign Ecosystem

Principles:
- Non-binding schedule; subject to change
- Safety gates precede functionality
- No auto-execution at any phase

## 3. Threat Model Summary
- Supply Chain Injection: Critical
- Execution Bypass: Critical
- Consent Spoofing: High
- UI Deception: High

Mitigations:
- Cryptographic consent tokens
- Strict bridge validation
- UI transparency and diffing
- Dependency hygiene

Residual Risks:
- User fatigue from approvals
- Renderer compromise risk

References:
- `docs/THREAT_MODEL.md`
- `src/browser/ExtensionSandbox.ts:125`
- `src/kernel/bridge/BridgeTypes.ts:1`

## 4. Explicit Non-Goals
- No autonomous agents
- No cloud sync by default
- No payments or funding flows
- No reminders or hidden timers
- No dark patterns or urgency mechanisms
