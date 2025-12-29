# DECISION FREEZE: JEAN RUNTIME BETA (v0.9.0)

## Status: FROZEN
**Effective Date:** 2025-12-23
**Governance:** Strict Adherence Required

This document establishes the frozen state of the Jean Runtime Beta architecture. No deviations are permitted without a formal version increment (v1.0.0+).

## 1. Allowed Actions
Only the following activities are permitted during the Beta phase:
- **Critical Bug Fixes:** Resolution of crashes, security vulnerabilities, or type errors that prevent compilation.
- **Content Updates:** Updates to text, localized strings, or static assets (images/models) that do not alter code logic.
- **Documentation:** Clarifications, roadmaps, and usage guides.
- **Safety Policy Refinement:** Updates to regex patterns or blocklists in the Safety Layer (no logic changes).

## 2. Disallowed Actions (STRICT)
The following are explicitly prohibited:
- **No New Features:** No new components, hooks, or pages.
- **No Architecture Refactoring:** The `JeanRuntimeBoundary`, `JeanCoreAdapter`, and `LocalRuntimeState` definitions are immutable.
- **No New Permissions:** No addition of File System, Network, or Bluetooth capabilities beyond what is currently stubbed.
- **No Remote Dependencies:** No calls to external APIs, analytics services, or cloud AI providers.
- **No UI Expansion:** The Homepage and Shell interface structure is locked.
- **No Context Expansion:** `RuntimeContext` structure must not change.

## 3. Deferred Scope (Future Phases)
These items are acknowledged but explicitly out of scope for Beta:
- **WebGPU / WASM Integration:** Reserved for Phase 4 (Offline Roadmap).
- **Long-Term Memory:** Persistent vector storage is disabled.
- **Multi-Agent Orchestration:** Single-agent sovereignty only.
- **Monetization:** No payment processing or commerce features.

## 4. Technical Constraints
- **Type Safety:** All code must pass strict TypeScript checks.
- **Zero Telemetry:** Any code introducing data exfiltration will be rejected.
- **Sovereignty:** Jean must remain functional (at a basic level) without an internet connection.

## 5. Governance
This document serves as the absolute boundary for the Builder/Agent. Any request violating these rules must be rejected unless accompanied by a request to lift the freeze (which requires a major version bump).
