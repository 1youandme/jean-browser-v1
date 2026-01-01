# Board Simulation Q&A — Governance Enablement Review

Date: [Insert Date]
Scope: Reference for Governance Board simulation based on `GO-DECISION-FRAMEWORK.md`, pilot posture, and `THREAT-MODEL.md`.

## Q1. What are the hard No‑Go triggers?
- Telemetry/background polling detection, remote toggles, programmatic ad‑tech/reputation calls, reproducibility/hash failures, or any pilot‑identified Critical governance violations (missing refusal surfaces, indicators).

## Q2. What is the minimum Governance Integrity Score to consider Go?
- ≥ 90/100 overall with no category < 80. Categories: telemetry exclusion (30%), updates (20%), networking gates (20%), extension integrity (15%), UI/consent integrity (15%).

## Q3. How do we verify telemetry exclusion beyond static analysis?
- Combine static scans for telemetry namespaces with runtime egress tests; blocklist analytics/ad‑tech destinations; confirm zero outbound attempts under default flows.

## Q4. How is deny‑by‑default networking enforced?
- Per‑domain authorization with user gesture tokens; network indicators visible on outbound; no reputation or background calls in default configuration.

## Q5. What constitutes acceptable pilot feedback?
- Two independent teams confirm deny‑by‑default, visible indicators, and absence of telemetry/background services, with no unresolved Critical findings.

## Q6. What is the rollback policy for updates?
- Manual‑only, signed updates; previous signed binary retained. Any background polling or auto‑install triggers No‑Go.

## Q7. How are supply‑chain risks mitigated?
- Reproducible builds with published hashes; independent attestation; pinned/verified sources for governance‑critical components; offline builds for air‑gapped releases.

## Q8. What are the kill‑switch criteria during enablement?
- Network without gesture token, indicators missing during active capability use, connections to ad‑tech/analytics, installer starting background services, hash/signature mismatches.

## Q9. Can extensions be sideloaded in consumer builds?
- No. Extensions MUST be signed‑only; sideloading disabled. Sandbox isolation and declared capability enforcement are mandatory.

## Q10. How do we prevent UI dark patterns?
- Prompts MUST be specific, time‑bound, reversible, and non‑coercive. Governance UX review gates reject ambiguous/bundled consent. Indicators/refusal surfaces cannot be suppressed.

## Q11. What evidentiary artifacts are required pre‑Go?
- Signatures and hashes with independent verification, STRIDE and kill‑switch test reports, compliance matrix mapping to `REGULATORY-READINESS.md`, pilot summaries, signed policy manifests and validation logs.

## Q12. How are state‑level coercion risks addressed?
- Immutability Clause prohibits surveillance, silent updates, vendor telemetry, ad‑tech. No remote channels; offline distribution and local policy engine. Any remote configuration path detected triggers No‑Go.

## Q13. What is permitted under Conditional Go?
- Controlled networking for allow‑listed domains with per‑domain consent; local policy engine; local‑only audit entries; remediation plan ≤ 14 days with re‑vote. Missed deadlines auto‑revert to No‑Go.

## Q14. Are reputation/safe‑browsing calls allowed?
- Not in default configuration. For regulated deployments, any reputation use MUST be local‑only and documented; otherwise No‑Go.

## Q15. How is auditability maintained without processing content?
- Content‑free local audit entries capturing capability events (who/when/what) without payloads; manual, administrator‑initiated export only; no auto‑upload.

## Q16. What indicators are mandatory?
- Network, microphone, camera, and location indicators visible when active, not suppressible by content or extensions. Missing indicators trigger kill‑switch.

## Q17. What constitutes compliance readiness at Enterprise Sovereign level?
- All MUSTs satisfied: manual signed updates with rollback, deny‑by‑default networking, signed‑only extensions, anti‑fingerprinting enabled, evidence pack published; audit logs enabled with manual export.

## Q18. What constitutes compliance readiness at Regulated Environment level?
- All MUSTs satisfied with jurisdictional addenda: per‑domain approval logging, indicator logs, reproducible builds verified, DPIA where required, offline distribution supported, allow‑lists enforced.

## Q19. What is out of scope for the v1 review build?
- Operational browsing, cloud sync, VPN, reputation calls, background services, remote management, and any telemetry or ad‑tech integrations.

## Q20. How are violations handled post‑Go?
- Certification refusal, public non‑compliance notice, key revocation if necessary, immediate revert of offending changes, governance freeze until root‑cause audit completes.

## Q21. What protections exist against vendor capture?
- Immutable governance, signing key control by Foundation, public violation protocol, and compliance profiles with mandatory evidence artifacts; growth features cannot override deny‑by‑default or manual updates.

## Q22. How do we confirm extension compliance at runtime?
- Capability checks against declared manifests, sandbox isolation verification, allow‑listed IPC channels, zero telemetry/background network activity checks, non‑suppressible indicator tests.

## Q23. What is the board’s publication posture after decision?
- Publish governance decision notice with artifact references; no promotional language; schedule periodic audits and reproducibility checks.

## Q24. What triggers a re‑review?
- Any incident, reproducibility variance, policy deviation, detection of remote toggles/telemetry, or pilot findings indicating governance drift.

## Q25. What is the minimum documentation threshold before enablement?
- Updated evidence pack, compliance matrix status, threat model overlay results, pilot summaries, and policy manifest validation logs mapped to RFC requirements.

