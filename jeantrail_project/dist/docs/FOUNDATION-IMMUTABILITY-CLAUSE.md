# Foundation Immutability Clause

**Entity:** Jean Foundation / Trust  
**Purpose:** Entrench core governance principles to ensure structural user sovereignty and prevent erosion by commercial, strategic, or operational pressures.

## 1. Definitions
- Surveillance: Any practice that collects, profiles, tracks, or infers user behavior or identity, including cross‑site tracking, fingerprinting, telemetry, or background analytics.
- Silent Updates: Any software change downloaded or installed without explicit, contemporaneous user initiation and consent.
- Vendor‑Side Telemetry: Any transmission of usage, performance, crash, or behavioral data from the browser to vendor‑controlled infrastructure.
- Ad‑Tech: Any participation in programmatic advertising, behavioral targeting, real‑time bidding, or third‑party script execution for advertising purposes.

## 2. Immutable Principles (Non‑Amendable)
The following principles are permanently locked and shall not be amended, suspended, or overridden:
1. No Surveillance  
   The browser shall not implement, integrate, or enable surveillance practices, including cross‑site tracking, fingerprinting, behavioral profiling, or background analytics.
2. No Silent Updates  
   All updates must be manual and signed. No background polling, auto‑download, or auto‑install is permitted. Installation requires explicit user action.
3. No Vendor‑Side Telemetry  
   The browser shall not collect or transmit telemetry, crash reports, performance metrics, or behavioral events to vendor infrastructure. Telemetry code paths must be excluded at build time.
4. No Ad‑Tech  
   The browser shall not integrate programmatic advertising, behavioral targeting, or real‑time bidding, nor execute third‑party ad scripts. Sponsorships, if any, shall be static and rendered locally or via signed static assets only.

## 3. Scope of Enforcement
- Applies to all releases, distributions, forks, and branded builds certified as “Jean Browser” by the Foundation/Trust.
- Applies to extensions certified or distributed under Foundation marks.
- Applies to sponsorship policies, update mechanisms, and governance artifacts.

## 4. Powers and Remedies
- Certification Control  
  The Foundation/Trust shall refuse certification of any release that violates or attempts to dilute the immutable principles.
- Signing Key Control  
  The Foundation/Trust shall control and, if necessary, revoke release and extension signing keys for non‑compliant artifacts.
- Public Notice  
  The Foundation/Trust shall issue public non‑compliance notices and withdraw trademarks/certification marks from violating distributions.

## 5. Non‑Derogation
- No policy, contract, partnership, or board resolution may authorize exceptions to the immutable principles.
- Any conflicting agreement or directive is void ab initio with respect to Foundation‑certified releases and marks.

## 6. Emergency Changes
- Security Remediation  
  Emergency security updates must remain manual, signed, and user‑initiated. No telemetry or background networking may be introduced as part of remediation.
- Temporary Measures  
  Temporary measures may not derogate from Sections 2 or 5 and must be documented and auditable.

## 7. Amendment and Entrenchment
- This Clause is entrenched and non‑amendable. It cannot be repealed, altered, or suspended by board vote or trustee action.
- Any proposal to alter this Clause requires dissolution and re‑chartering of the Foundation/Trust under a new legal entity; existing marks and certification criteria shall not transfer automatically.

## 8. Audit and Verification
- The Foundation/Trust shall require reproducible builds, published hashes, and compile‑time exclusion of telemetry code paths for certification.
- Independent audits may be commissioned; evidence packs (hashes, manifests, governance artifacts) shall be provided upon lawful request.

