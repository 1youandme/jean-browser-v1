# Jean Threat Model — Public Review Closure

**Version:** 1.1 (Public Review)
**Date:** 2026-01-01
**Scope:** UI surfaces and services included in the Public Review build (read-only viewers, advisory-only services, no execution, no background networking)

## 1. Executive Summary
- Public Review build operates in a fail-closed posture with global execution disabled and no background networking.
- Risk posture is Low/Medium only. Higher-severity threats are out-of-scope due to kill-switch and non-execution defaults.
- Core asset remains User Intent & Consent; governance visibility is prioritized over capability.

## 2. Threat Matrix (Low/Medium Only)

| Threat ID | Threat Name | Likelihood | Impact | Severity | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | Extension Capability Misuse | Low | Medium | **Medium** | Extensions attempting to invoke OS actions outside granted scope. Routed through OS bridge with capability checks. |
| **T-02** | Consent Token Weakness (Stub) | Low | Medium | **Medium** | Confirmation tokens are validated but not cryptographic in this phase; execution remains disabled via kill-switch. |
| **T-03** | UI Deception via Complexity | Medium | Low | **Medium** | Complex DAGs may mislead user interpretation; UI remains read-only and labeled REVIEW ONLY. |
| **T-04** | Supply Chain Injection (UI libs) | Low | Medium | **Medium** | Reduced impact under Public Review as execution is disabled and services are read-only/local-first. |
| **T-05** | State Machine Desynchronization | Low | Medium | **Medium** | Governance state transitions are enforced; desync risk contained by read-only viewers and kill-switch defaults. |

## 3. Component Re-Evaluation

### 3.1 Kernel
- Enforced transitions and role-gated controls:
  - `src/domain/governance/GovernanceEngine.ts:39-47` request review gate
  - `src/domain/governance/GovernanceEngine.ts:49-59` approval requires permissions/state
  - `src/domain/governance/GovernanceEngine.ts:69-72` start requires `APPROVED`
  - `src/domain/governance/GovernanceEngine.ts:88-93` halt requires Admin and logs alert
  - `src/domain/governance/GovernanceEngine.ts:97-110` transition logging and event emission

### 3.2 OS Bridge
- Kill switch default deny:
  - `src/os/OSExecutionBridge.ts:4-12` `GlobalKillSwitch` defaults to disabled execution
- Contract, context, and time bounds validation:
  - `src/os/OSExecutionBridge.ts:61-96` contract/time/context checks
- Token validation stub retained; risk reduced by kill switch:
  - `src/os/OSExecutionBridge.ts:130-132`

### 3.3 UI
- Read-only graph viewer:
  - `src/components/governance/ExecutionGraphViewer.tsx:1-7` types-only imports, no executor wiring
- Public review watermark and offline indicator:
  - `src/pages/GovernanceBrowserShell.tsx:143-155` displays “REVIEW ONLY” and “Offline”
- Advisory services render static logic:
  - `src/components/advisor/DomainAdvisorPanel.tsx:23-27` `generateReport` local-only

### 3.4 Services
- Domain Advisor service is local-only:
  - `src/domain/advisor/DomainAdvisorService.ts:152-165` static DNS records, no network calls
- Read-only Logistics Planner:
  - `src/components/logistics/ReadOnlyLogisticsPlanner.tsx:1-5` imports local planning logic

### 3.5 Supply Chain
- Reduced impact for Public Review due to execution disabled and read-only UI:
  - `src/os/OSExecutionBridge.ts:4-12` kill switch gate
  - `src/components/governance/ExecutionGraphViewer.tsx:1-7` visibility-only viewer

## 4. Medium Risks and Code Mitigations

| Component | Threat | File:Line | Mitigation Evidence |
| :--- | :--- | :--- | :--- |
| Extensions | Capability misuse | `src/browser/ExtensionSandbox.ts:137-139` | Capability check before OS bridge invocation |
| OS Bridge | Token weakness (stub) | `src/os/OSExecutionBridge.ts:130-132` | Stub validation; risk reduced by kill switch default (`src/os/OSExecutionBridge.ts:4-12`) |
| UI Viewer | Deception via complexity | `src/components/governance/ExecutionGraphViewer.tsx:1-7` | Viewer is read-only with governance banner |
| Kernel | State desync risk | `src/domain/governance/GovernanceEngine.ts:97-110` | Transition events logged/emitted for UI alignment |
| Services | Public surfaces only | `src/domain/advisor/DomainAdvisorService.ts:152-165` | Local static data; no network calls |

## 5. What Jean Does NOT Protect Against
- Compromise of build toolchain or distribution channels outside the Public Review artifact.
- Hardware-level attacks or OS kernel exploits on the host device.
- User-side misclassification or ignoring warnings in complex pipelines.
- Network exfiltration originating from non-reviewed modules not included in Public Review scope.
- Cryptographic token replay attacks in phases where execution is enabled (out-of-scope here).

## 6. Trust Boundaries
- UI ↔ Governance Engine: `src/domain/governance/GovernanceEngine.ts`
- Governance ↔ Kernel Routing: `src/runtime/ContextRouter.ts:11-50`
- Kernel ↔ OS Bridge: `src/os/OSExecutionBridge.ts:31-170`
- Services ↔ External Network: Public Review surfaces avoid network; advisory services are local-only.
- Extensions ↔ OS: `src/browser/ExtensionSandbox.ts:125-165`

## 7. Risk Matrix (Low/Medium Only)

| Component | Threat | Risk |
| :--- | :--- | :--- |
| Kernel | State desync | Medium |
| OS Bridge | Token weakness (stub) | Medium |
| UI | Deception via complexity | Medium |
| Extensions | Capability misuse | Medium |
| Services | Advisory-only local logic | Low |
| Supply Chain | UI library compromise (reduced impact) | Medium |

## 8. Public-Safe Summary
- Execution disabled by default (`GlobalKillSwitch`), symbolic-only routing enforced.
- Viewer and advisory services are read-only/local-only; no external execution paths.
- Remaining risks are Low/Medium and mitigated by enforced transitions, capability checks, and non-execution defaults.
