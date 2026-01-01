# Public Explanation of JeanTrail Domain Separation

**Audience:** Regulators, Government partners, Enterprise reviewers  
**Style:** Formal, compliance-oriented, non-marketing

## Summary
JeanTrail maintains a sovereign separation between its governance root domain and its public documentation subdomain. This separation is designed to reduce operational risk, simplify audits, and demonstrate the platform’s governance-first posture.

## Why `jeantrail.com` Is Governance-Locked
- Purpose: Represents governance and institutional authority only; it is non-operational by design.
- Operation: Serves a static landing page that declares “JeanTrail Core — Governance Locked / Non-Operational.”
- Controls: No documentation browsing, no downloads, no client-side scripts, and no third-party assets.
- Compliance rationale: Minimizes attack surface, avoids unintended operational exposure, and ensures clear, auditable boundaries for regulators and partners.

## Why `review.jeantrail.com` Exists
- Purpose: Provides public access to documentation, standards, and review materials necessary for due diligence and compliance assessments.
- Operation: Static-only hosting of documentation (RFCs, governance artifacts) without telemetry or dynamic features.
- Controls: Strict content policies (no external scripts or analytics) to preserve audit integrity and reproducibility.

## What Users Can and Cannot Do
- Allowed:
  - View documentation and public materials hosted at `review.jeantrail.com`.
  - Conduct compliance reviews using the static artifacts provided.
  - Reference governance notices at `jeantrail.com`.
- Not Allowed:
  - Execute code or interact with runtime services via `jeantrail.com` or `review.jeantrail.com`.
  - Browse or download executables from `jeantrail.com` (root).
  - Use third-party scripting, telemetry, or analytics on either domain.

## Compliance Orientation
- Transparency: Documentation is accessible under a read-only, static policy to support regulatory review.
- Evidence: Governance-locked root demonstrates that public-facing content is distinct from operational capabilities.
- Auditability: The separation ensures review artifacts are verifiable and free from dynamic modifications or tracking.

## Contact and Review
- Governance notices: `https://jeantrail.com/` (static landing page; non-operational).
- Public documentation and review materials: `https://review.jeantrail.com/` (read-only).
- Operational systems and runtime services are not exposed through these domains.

