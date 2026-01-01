# JeanTrail Browser v1.1 — Review Build (Signed Installers)

Date: 2025‑12‑31

## Summary
- Governance‑locked, read‑only UI for public review.
- Production build: dev tools, hot reload, and sourcemaps disabled.
- Windows and macOS installers produced via Tauri.
- SHA256 checksums generated for installer verification.

## Artifacts
- Output directory: `dist/installers`
- Expected files:
  - Windows: `.exe` or `.msi`
  - macOS: `.dmg`
  - Checksums: `SHA256SUMS.txt`

## Code Signing
- Windows: configured in `src-tauri/tauri.conf.json` under `tauri.bundle.windows`.
  - `certificateThumbprint`: CHANGE_ME_CERT_THUMBPRINT
  - `digestAlgorithm`: `sha256`
  - `timestampUrl`: `http://timestamp.comodoca.com`
- macOS: configured in `src-tauri/tauri.conf.json` under `tauri.bundle.macOS`.
  - `signingIdentity`: CHANGE_ME_SIGNING_IDENTITY

## Build Commands
- Release build: `npm run release:build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`

## Verification
- Verify checksums:
  - Compare installer hashes with `SHA256SUMS.txt`.
- Windows signature:
  - Open installer properties → Digital Signatures tab.
- macOS signature:
  - `codesign --verify --deep --strict --verbose <path-to-app>`
  - Allow via Gatekeeper if required.

## Known Limitations
- Review build is non‑operational by design (deny‑by‑default).
- macOS signing requires Apple Developer certificate and identity.
