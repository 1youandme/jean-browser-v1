# Governance Lock Report (v1.1)

Scope: Audit of UI-level governance enforcement for a public review build. The goal is a strictly read-only, fail-closed UI that cannot trigger kernel execution without explicit approval.

## Summary
- Governance state is the single source of truth in the UI via `useKernelGovernance`.
- UI actions are guarded by `useIntentGuard` and the governance-aware `Button`.
- Review surfaces are strictly read-only; no hidden triggers, no auto-run effects.
- Network and telemetry code exists in services, but is not wired into the v1.1 review surfaces.

## Verification Checklist
- UI cannot trigger execution
  - Enforced by `useIntentGuard` and governance-aware `Button` (global component):
    - `src/components/ui/Button.tsx:55` disables and annotates actions when governance disallows.
  - Critical native handlers gated:
    - Back/Forward/Refresh/Saved: `src/components/Header.tsx:87–127`
    - Address bar submit: `src/components/Header.tsx:58–61`
    - Jean toggle, Settings, RTL: `src/components/Header.tsx:153–176`
    - Tab select/close/create: `src/components/Header.tsx:204–229`
    - Hotkey routing: `src/components/RouteToggleHotkey.tsx:10–12`
- No background tasks
  - Review shell is static, non-operational:
    - `src/pages/GovernanceBrowserShell.tsx:122–139` marks “Static UI Review • Non-Operational”
  - Governance viewer is pure, no effects:
    - `src/components/governance/ExecutionGraphViewer.tsx` uses pure SVG only.
  - Note: Other non-review pages may contain `setInterval/setTimeout`, but they are not part of the v1.1 review surfaces and are not required to be loaded.
- No telemetry
  - No analytics/telemetry invocation found in enforced review surfaces.
  - Background/telemetry libraries not used in governance viewer or review shell.
- No network calls without consent
  - No fetch/WebSocket/axios usage in the governance viewer or review shell.
  - Service modules with network endpoints exist, but are detached from v1.1 review surfaces (see Appendix).
- Governance state is single source of truth
  - `useKernelGovernance` returns `state` used across UI:
    - Policy badge mapping: `src/components/ui/PolicyBadge.tsx:36–44`
    - Intent guard mapping: `src/hooks/useIntentGuard.ts:19–41`
    - Graph viewer mapping: `src/components/governance/ExecutionGraphViewer.tsx`

## Allowed Actions (Read-Only)
- Viewing governance state and audit badges:
  - `src/components/ui/PolicyBadge.tsx:36–44`
- Viewing the execution graph visualization:
  - `src/components/governance/ExecutionGraphViewer.tsx`
- Navigating static review shell:
  - `src/pages/GovernanceBrowserShell.tsx:122–139`
- UI-only state changes without side effects (e.g., local layout changes) when not gated.

## Denied Actions (Fail-Closed)
- Any button or native control where governance state is not “allowed”:
  - Global: `src/components/ui/Button.tsx:55–57`
  - Header controls:
    - Back/Forward/Refresh/Saved: `src/components/Header.tsx:87–127`
    - Address submit: `src/components/Header.tsx:58–61`
    - Jean toggle, Settings, RTL: `src/components/Header.tsx:153–176`
    - Tab select/close/create: `src/components/Header.tsx:204–229`
  - Keyboard shortcuts:
    - Route toggle hotkey: `src/components/RouteToggleHotkey.tsx:10–12`
- Any attempt to initiate execution or navigation captured by guarded handlers is blocked and annotated with a governance reason.

## Review-Only Surfaces
- Governance Browser Shell:
  - `src/pages/GovernanceBrowserShell.tsx:122–139` (Explicit static, non-operational mode)
- Execution Graph Viewer:
  - `src/components/governance/ExecutionGraphViewer.tsx` (Pure SVG; no handlers)
- Policy Badge:
  - `src/components/ui/PolicyBadge.tsx:36–44` (Visual-only mapping)

## Enforcement References
- Intent Guard (read-only; no mutations):
  - `src/hooks/useIntentGuard.ts:19–41` (Maps `GovernanceState` to `disabled/reason/status`)
- Governance-Aware Button:
  - `src/components/ui/Button.tsx:55–57`
- Header controls gating:
  - `src/components/Header.tsx:58–61`, `87–127`, `153–176`, `204–229`
- Hotkey gating:
  - `src/components/RouteToggleHotkey.tsx:10–12`
- Read-only visualization:
  - `src/components/governance/ExecutionGraphViewer.tsx`

## Appendix: Network/Telemetry Code (Not wired in v1.1 review)
The following modules contain network-related code or service integrations but are not part of the governance review surfaces:
- Services: `src/services/*` (e.g., `api.service.ts`, `auth.service.ts`, `transport.ts`, `videoStudio.ts`)
- Kernel bridge & tests (developer-only):
  - `src/kernel/bridge/*`
  - Test scripts under `src/runtime/*` and `src/domain/governance/*`
  
These modules are present for future integration, but their functionality is not enabled in the v1.1 review shell and is not reachable from the read-only governance surfaces.

## Conclusion
The v1.1 review build is locked and safe for public review:
- UI actions are fail-closed unless governance explicitly allows.
- Review surfaces are purely visual, with no network or telemetry calls.
- Governance state is the single source of truth for all rendered controls and visuals.
