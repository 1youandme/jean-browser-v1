# Kernel Bootstrap (Docker-First, Local-Only)

- Goal: run a local kernel host with user-owned pipelines, models, media, and state, with no cloud dependency.
- Compose service: `kernel-host` in `jeantrail_project/docker-compose.yml:44`.
- Execution: disabled by default; governance consent required.

## Prerequisites
- Install Docker and Docker Compose.
- Open a terminal in `jeantrail_project`.

## Initialize Local Directories
- Create host directories to own your data:
  - Windows (PowerShell): `mkdir .\pipelines; mkdir .\models; mkdir .\media; mkdir .\state`
  - Linux/macOS (bash): `mkdir -p ./pipelines ./models ./media ./state`

## Start Kernel Host
- Command: `docker compose up -d kernel-host`
- Service reference: `jeantrail_project/docker-compose.yml:44-58`
- Verifications:
  - `docker compose ps kernel-host`
  - `docker compose exec kernel-host sh -c "ls -la /opt/pipelines /opt/models /opt/media /opt/state"`

## Manage Assets
- Pipelines: place files under `./pipelines` (mounted to `/opt/pipelines`).
- Models: place model weights under `./models` (mounted to `/opt/models`).
- Media: place assets under `./media` (mounted to `/opt/media`).
- State: persistent runtime state under `./state` (mounted to `/opt/state`).

## Governance Defaults
- Environment on `kernel-host`:
  - `GOVERNANCE_MODE=local`
  - `CONSENT_REQUIRED=true`
  - `EXECUTION_ALLOWED=false`
- Outcome: workers cannot self-execute; proposals require approval; no external network exposed.

## Optional: Bring Up Supporting Runtimes
- AI runtime: `docker compose up -d ai-runtime` (`jeantrail_project/docker-compose.yml:15-21`)
  - Models mounted from `./models` to `/opt/models`.
- Media runtime: `docker compose up -d media-runtime` (`jeantrail_project/docker-compose.yml:27-33`)
  - Assets mounted from `./media` to `/opt/media`.

## Stop/Remove
- Stop: `docker compose stop kernel-host`
- Remove: `docker compose rm -f kernel-host`
- Data remains in `./pipelines`, `./models`, `./media`, `./state`.

