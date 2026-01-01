# JeanTrail Domain Separation Plan

**Role:** DevOps / Governance Engineer  
**Objective:** Maintain sovereign separation between governance root and public review materials

## Domain Purpose
- `jeantrail.com` (root): Governance Locked, non-operational. Serves a minimal, static notice page declaring sovereignty, governance-first posture, and no runtime features.
- `review.jeantrail.com` (subdomain): Public documentation and review materials only. Hosts static docs, specifications, and governance artifacts for external review.

## Deployment Map
- Root (`jeantrail.com`)
  - Content: Single static HTML with governance notice and links to `review.jeantrail.com`.
  - Hosting: Static-only (e.g., GitHub Pages, S3 + CloudFront, or Netlify) with no build scripts.
  - DNS: `CNAME` to static host. No dynamic records, no API endpoints.
  - Policy: No JS, no telemetry, no third-party assets. Optional HTTP 301 redirect for deep links to `review.jeantrail.com`.
- Subdomain (`review.jeantrail.com`)
  - Content: Public docs and materials from `jeantrail_project/public`.
  - Hosting: Static-only. Publish the `public` folder as-is.
  - DNS: `CNAME` to static host with separate site configuration to ensure isolation.
  - Policy: No external scripts, no analytics, strict CSP to disallow third-party resources.

## Governance Justification
- Sovereign control: The root domain represents institutional governance, not operations. It prevents accidental exposure of runtime capabilities under the flagship domain.
- Attack surface reduction: Static-only content with no scripts narrows exposure, simplifies audits, and reinforces zero-telemetry guarantees.
- Trust boundaries: Documentation and review are explicitly hosted on a separate subdomain to make review artifacts reproducible and independently cached without affecting governance assets.
- Regulatory clarity: Clear separation aids public sector audits, clarifies policy scope, and supports compliance evidence that governance and operations are distinct.

## Hosting and Hardening
- Static-only constraints:
  - No telemetry, analytics, or trackers.
  - No third-party assets; all content must be local and self-contained.
  - No client-side scripts on `jeantrail.com`; limit `review.jeantrail.com` to inline styles only if needed.
- Recommended HTTP headers:
  - `Content-Security-Policy`: `default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`
  - `X-Content-Type-Options`: `nosniff`
  - `Referrer-Policy`: `no-referrer`
  - `Permissions-Policy`: disable sensors, geolocation, microphone, camera
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- Caching:
  - Root: short TTL due to governance messaging updates.
  - Subdomain: moderate TTL for documentation; add ETag support.

## Deployment Steps
- Root (`jeantrail.com`)
  - Publish minimal `index.html` with governance notice and explicit non-operational status.
  - Configure `CNAME` and static hosting; ensure no build hooks and no server-side includes.
  - Add strict headers via host configuration.
- Subdomain (`review.jeantrail.com`)
  - Publish `public/` directory statically.
  - Configure `CNAME` for subdomain and independent site settings.
  - Apply strict CSP and security headers; verify all links are relative and local.

## Verification
- Manual review: Confirm zero external requests via network inspector.
- Content audit: Validate no script tags or third-party assets in both domains.
- Header audit: Confirm CSP and security headers are present and effective.
- Link integrity: Ensure governance root links only to `review.jeantrail.com`.

## Maintenance
- Updates to governance notices on `jeantrail.com` proceed via static content changes only.
- Documentation updates flow to `review.jeantrail.com` from the `public/` folder with no external dependencies.
- Quarterly audit confirms adherence to static-only policy and zero telemetry guarantees.

