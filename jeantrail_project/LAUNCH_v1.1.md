# v1.1 Launch Announcement

We are releasing v1.1 with a governance-first posture. This version is designed to operate locally, fail closed by default, and offer a clear audit surface. The intent is to be calm and transparent about what the system does and how it is controlled.

## Governance-First Architecture
- Governance is the single source of truth for capability use. Workers cannot self-execute; they produce proposals that require explicit approval.
- Consent is enforced before any capability is enabled in the UI.
- Defaults favor denial. If approval or consent is missing, actions do not proceed.
- Optional model marketplace has no default models. Nothing is installed or selected without explicit user action.
- References:
  - Consent gate: `src/components/ConsentGate.tsx`
  - Worker interfaces and governance port: `src/kernel/workers/Worker.ts`, `src/kernel/workers/GovernancePort.ts`, `src/kernel/workers/WorkerManager.ts`
  - Marketplace and gates: `src/kernel/marketplace/Manifest.ts`, `src/kernel/marketplace/GovernanceGates.ts`

## No Telemetry
- No background analytics, metrics, or data exhaust are emitted.
- Logging is local-only, for user visibility and troubleshooting.
- Operation is offline-capable. The system does not require cloud services to start or function.
- Production builds remove dev flags and debug helpers to minimize attack surface.
- References:
  - Production build defines: `vite.config.ts`
  - Local-first hosting example: `docker-compose.yml` (`kernel-host`)

## No Execution Without Consent
- The application presents an explicit consent screen before enabling features.
- Execution paths remain disabled until governance approval is granted.
- UI surfaces are read-only unless an approved action is active.
- Workers declare capabilities and cannot trigger actions on their own.
- References:
  - Consent gate: `src/components/ConsentGate.tsx`
  - Worker capability declaration: `src/kernel/workers/Worker.ts`

## Open Audit Surface
- Clear, inspectable configuration for local hosting via Docker Compose. User-owned bind mounts for pipelines, models, media, and state.
- Deterministic, production-focused build configuration with dev-only code stripped.
- Pluggable workers and marketplace are implemented in plain TypeScript with explicit capability declarations.
- The governance gates are simple to review and reason about: deny by default, allow only with explicit consent and required permissions.
- References:
  - Kernel host service and mounts: `docker-compose.yml`
  - Marketplace gates: `src/kernel/marketplace/GovernanceGates.ts`
  - Worker registration and lookup: `src/kernel/workers/WorkerManager.ts`

## Posture
- Calm, non-promotional release. The design emphasizes user agency, data locality, and transparent control.
- The system favors safety by default: actions require consent, and surfaces are auditable.

