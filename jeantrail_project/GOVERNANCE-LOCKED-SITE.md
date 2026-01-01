# Governance-Locked Site — jeantrail.com

**Role:** Governance Architect  
**Version:** v1 Governance Lock  
**Declaration:** JeanTrail Core — Governance Locked / Non-Operational

## Purpose
- Root domain (`jeantrail.com`) serves a static landing page only.
- No documentation browsing or downloads from the root.
- All public review materials are hosted at `review.jeantrail.com` (read-only).

## Governance Posture Summary
- Static-only, zero telemetry, no scripts or third-party assets.
- No interactive UI; no runtime features; no APIs exposed.
- Minimal content: declaration banner, short governance summary, link to review.

## Root Content (Static Landing)
- Minimal `index.html` containing:
  - Header: “JeanTrail Core — Governance Locked / Non-Operational”
  - Short paragraph explaining sovereign, governance-first posture.
  - Link to `https://review.jeantrail.com/` for documentation and RFCs.
  - No `<script>` tags; inline styles allowed for basic layout.

## Security & Policy
- Content-Security-Policy (example):
  - `default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`
- Additional headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=(), accelerometer=(), gyroscope=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

## Routing Rules
- Root path `/` serves the static landing page.
- Any deep link beyond `/` may return the same landing page or 301 redirect to `review.jeantrail.com`.
- No directory listing; 404 responses show the governance message.

## Deployment
- Static-only host (GitHub Pages, S3/CloudFront, Netlify).
- Publish a single `index.html` with governance notice.
- Configure headers via CDN or hosting provider.
- Ensure `CNAME` points to static host; SSL enforced.

## Verification Checklist
- Open `https://jeantrail.com/` — landing page renders the declaration.
- No documentation navigation or download links at the root.
- Network inspector shows no external requests or script executions.
- Links to `https://review.jeantrail.com/` resolve; case-sensitive links verified on review site.

