# Review Site Deployment — GitHub Pages (Domain-Independent)

**Role:** Web Deployment Engineer  
**Target:** Static-only site on GitHub Pages (`github.io`) without custom domain

## Source
- Root directory: `jeantrail_project/public`
- Entry point: `index.html`
- Policy: No telemetry, no third-party assets, static-only

## Hosting Options
- GitHub Pages:
  - Create a dedicated branch (e.g., `review-site`) or repository.
  - Publish directory: `./public`
  - Add `.nojekyll` to disable Jekyll processing.
- Static CDN (S3 + CloudFront, Netlify):
  - Upload contents of `public/` directly.
  - Serve via provider default domain; do not configure custom domains.

## Deployment Steps (GitHub Pages)
1. Commit `public/` as-is; ensure `index.html` is at the top level.
2. Add an empty `.nojekyll` file to `public/` to enforce static asset serving.
3. Configure workflow to publish:
   - `publish_dir: ./public`
4. Push to the deployment branch and enable Pages in repository settings.

## Verification
- Index resolution:
  - Open the GitHub Pages URL (e.g., `https://<owner>.github.io/<repo>/`) and confirm `index.html` loads.
- Link integrity (case-sensitive):
  - Validate links exist exactly as named:
    - `JEAN-RFC-PUBLIC.md`
    - `PUBLIC-GOVERNANCE-LAUNCH.md`
    - `SOVEREIGN-FUND-DUE-DILIGENCE.md`
    - `CERTIFICATION-ENFORCEMENT.md`
    - `JEAN-CERTIFIED-ECOSYSTEM.md`
    - `V2.1-EXTENSIONS-BUILD.md`
    - `V2.2-ENTERPRISE-BUILD.md`
    - `docs/INVESTOR-NARRATIVE.md`
    - `docs/GLOBAL-SCALING-WITHOUT-SURVEILLANCE.md`
    - `docs/API_DOCUMENTATION.md`
    - `docs/JEAN_ARCHITECTURE.md`
- 404 checks:
  - Navigate to each link from `index.html`; confirm no 404s.
  - Confirm directory assets resolve: `assets/jean/*`, `models/jean_v1_frozen.glb`.
- Static-only assertions:
  - Confirm no `<script>` tags or third-party assets load.
  - Use browser dev tools Network tab to verify no external requests.

## Security Headers (Static Host)
- `Content-Security-Policy`: `default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `no-referrer`
- `Permissions-Policy`: disable geolocation, camera, microphone, sensors
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`

## Ongoing Maintenance
- Update `public/` when new docs are added; keep filenames consistent for case-sensitive hosts.
- Run quarterly link checks aligned with the governance audit cycle.
- Keep Pages/CDN strictly static; do not enable build hooks or analytics.
