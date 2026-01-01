# Pre-Public Security Audit (v1.1)

Scope: independent pre-release audit focused on supply chain, UI execution paths, kernel isolation, and Docker boundaries. Posture: calm, transparent, non-marketing.

## Summary
- Governance-first UI and workers are fail-closed; consent is required for capabilities.
- No telemetry in review surfaces; production build strips dev flags and debuggers.
- Local-first hosting with bind-mounted assets; `kernel-host` is inert by default.
- Two compose stacks exist; one stack includes a host Docker socket mount that weakens isolation and requires controls.

## Method
- Reviewed configuration, UI guard components, marketplace gates, worker interfaces, and container topology.
- Verified production build defines and dev-route gating.
- Inspected Docker Compose services and mounts for host boundary violations.

## Supply Chain
- JavaScript/TypeScript dependencies pinned with semver ranges; lockfile present.
  - `package.json:1-43` and `package-lock.json` indicate a reproducible install process; prefer `npm ci` for deterministic builds.
- Production hardening:
  - Build defines strip dev flags and debuggers: `vite.config.ts:30-36, 38` (`__DEV__`, `process.env.NODE_ENV`, `esbuild.drop`).
  - Dev-only routes guarded by `import.meta.env.DEV`: `src/App.tsx:7-36`.
- Recommendation:
  - Enforce `npm ci` in release pipelines; run `npm audit --production` and pin any high-risk transitive deps.
  - Generate and verify checksums for build artifacts; sign installers per OS platform policies.

## UI Execution Paths
- Explicit consent gate blocks capabilities until all checks are affirmed:
  - `src/components/ConsentGate.tsx:1-31, 44-88, 96-107`.
- Dev-only pages lazy-loaded only when `import.meta.env.DEV`:
  - `src/App.tsx:7-36`.
- Policy gates for interaction forbid biometric detection, execution verbs, and hidden chaining:
  - `src/pages/Browser.tsx:291-309, 346-353`.
- Governance gates deny by default; explicit consent and permissions required:
  - `src/kernel/marketplace/GovernanceGates.ts:8-20`.
- Consent primitives and checks exist for scoped operations:
  - `src/privacy/SovereignConsent.ts:1-30`.
- Recommendation:
  - Maintain deny-by-default posture; audit all UI components capable of side effects to ensure gating via consent or governance state.
  - Add e2e tests that verify refusal for execution attempts without consent across common actions (navigation, file operations, payments).

## Kernel Isolation
- Local-only kernel host service with no external ports and inert default command:
  - `docker-compose.yml:44-58` (`kernel-host`, `sleep infinity`, `CONSENT_REQUIRED=true`, `EXECUTION_ALLOWED=false`).
- Bind mounts provide user-owned pipelines, models, media, and state:
  - `docker-compose.yml:54-57` and Runtimes: `docker-compose.yml:20-21`, `32-33`.
- Note: A separate stack includes a backend service with host Docker socket mount:
  - `docker-compose.jeantrail-os.yml:11-21` shows `jeantrail-backend` with `/var/run/docker.sock` exposure (risk for host control).
- Recommendation:
  - Remove `/var/run/docker.sock` mount from production; if monitoring is required, proxy through a constrained read-only API with strict authz, or use Docker events shipped via a sidecar with minimal capability.
  - Apply container user remapping, seccomp, and read-only file systems for non-mutating services; explicitly set `network_mode` and `cap_drop` where practical.

## Docker Boundaries
- Primary stack (`docker-compose.yml`) runs on `autonomousjean_net` bridge with limited exposed ports (only `ws-gateway:8787`):
  - `docker-compose.yml:7-14`.
- Kernel host has no published ports; boundaries are internal-only:
  - `docker-compose.yml:44-58`.
- Secondary stack (`docker-compose.jeantrail-os.yml`) exposes backend on port `8000` and uses Docker socket mount:
  - `docker-compose.jeantrail-os.yml:1-50` (service topology).
- Recommendation:
  - Use per-service networks to segment data/ai/media runtimes; avoid flat mesh; isolate `kernel-host` from services that require internet.
  - Implement network egress policy (e.g., deny internet for local-only workers) and ingress controls via reverse proxy with explicit allowlists.
  - Add `healthcheck` to all services; fail-closed if dependencies are missing.

## Governance-First Controls
- Workers cannot self-execute; proposals require governance approval:
  - Worker interfaces and manager: `src/kernel/workers/Worker.ts`, `src/kernel/workers/WorkerManager.ts`.
- Marketplace denies defaults and requires explicit permissions:
  - `src/kernel/marketplace/GovernanceGates.ts:8-20`.
- Recommendation:
  - Maintain immutable audit trail for each proposal and approval decision; expose queryable logs in the UI and backend.
  - Integrate a simple policy reason code matrix in release notes and public docs for transparency.

## Findings
- Strengths:
  - Consent gate enforcement and deny-by-default marketplace controls are clear and inspectable.
  - Dev-only routes are compile-time gated; production build strips console/debugger.
  - Local-first Docker layout with user-owned asset mounts and inert kernel host.
- Risks:
  - Host Docker socket mount in `docker-compose.jeantrail-os.yml` undermines isolation if deployed without strict controls.
  - Multiple stacks and scripts may create confusion; ensure public build only references hardened stack without socket exposure.
  - Missing formal e2e tests for consent/refusal flows across all UI action categories.

## Recommendations
- Remove host Docker socket mount in production or gate behind an isolated monitoring service with minimal privileges.
- Enforce `npm ci` and lockfile integrity; add SCA scanning to CI (e.g., `npm audit`, `osv-scanner`).
- Add e2e tests covering:
  - Consent required before capability enable.
  - Refusal paths for biometric detection, execution verbs, hidden chaining.
  - Governance approval requirement for worker proposals.
- Harden containers:
  - `read_only: true` where possible, `cap_drop: ["ALL"]`, `user: nonroot`, resource limits, distinct networks per capability group.
- Document and verify no telemetry in release artifacts via static analysis and runtime checks.

## Verification Steps
- Build validation:
  - Run `npm ci && npm run build && npm run typecheck && npm run lint`.
  - Confirm `__DEV__` is false and `NODE_ENV` is `"production"`: `vite.config.ts:30-36`.
- UI gating:
  - Confirm ConsentGate blocks capabilities until all toggles are checked: `src/components/ConsentGate.tsx:44-88`.
  - Confirm dev routes do not load in production: `src/App.tsx:7-36`.
- Docker boundaries:
  - Bring up `kernel-host` only; verify no external ports: `docker compose up -d kernel-host`, `docker compose ps`.
  - Inspect other compose files; remove `/var/run/docker.sock` mounts for production.

