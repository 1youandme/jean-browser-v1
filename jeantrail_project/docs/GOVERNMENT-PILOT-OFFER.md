# Government Pilot Offer Letter

Date: [Insert Date]

Subject: Fixed-Term Government Pilot — Jean Browser v1 (Governance-First Review Build)

## 1. Purpose
- Evaluate the user interface and governance posture of Jean Browser v1.
- Confirm adherence to deny-by-default principles, absence of telemetry, and visibility of refusal surfaces.
- This pilot is explicitly non-operational; no functional browsing or networked features are in scope.

## 2. Scope
- Platform: Desktop-only evaluation of the review build.
- Air-Gapped Friendly: The build can be distributed and evaluated offline.
- No Telemetry: The review build contains no analytics, crash reporting, fingerprinting, or usage collection mechanisms.
- No Background Services: Processes terminate when the window closes; no daemons remain active.
- Static Artifacts: UI renders and configuration are static; sponsorship containers are non-executable and do not perform third-party requests.
- Updates: Manual-only; no silent update channels or background polling.

## 3. Legal Posture
- No Data Processing: By default, the vendor does not collect, transmit, store, or otherwise process personal data for the pilot.
- No Controller/Processor Role: The pilot does not establish the vendor as a controller or processor under GDPR/UK GDPR/CCPA/ePrivacy.
- No Cookies/Tracking: The review build does not use tracking cookies, pixels, or device fingerprinting for the purposes of the pilot.
- No Remote Management: There are no remote configuration toggles; governance policy loads locally only.

## 4. Duration
- Fixed-Term: 60 days from acceptance of this letter.
- Extension: May be extended up to 90 days only by written amendment signed by the participating authority.

## 5. Exit
- No Lock-In: The pilot does not require accounts, subscriptions, or vendor-managed services.
- No Data Residue: Uninstalling the review build removes local artifacts; no data is transmitted off-device during the pilot.
- No Ongoing Obligations: The authority may end the pilot at any time with no further commitments.

## 6. Deliverables
- Governance Assessment Feedback Only:
  - Observations on deny-by-default behavior, refusal surfaces, and visible indicators for active subsystems.
  - Notes on audit visibility, documentation clarity, and suitability for regulated deployment considerations.
  - Recommendations for governance improvements or policy clarifications.
- No Functional Evaluation: Performance, browsing capability, and dynamic networking are out of scope for this pilot.

## 7. Operational Constraints
- Non-Operational Browsing: The review build is not a functional browser release and should not be used for production or external website access.
- Offline Evaluation: The preferred mode is air-gapped; any connectivity tests are out of scope.
- Local-Only Inspection: UI, manifests, and governance documentation may be reviewed on-device; no data leaves the device automatically.

## 8. Responsibilities
- Vendor:
  - Provide the review build and accompanying governance documents for local audit.
  - Respond to clarification requests related to governance posture and threat model.
  - Publish release hashes for artifact verification where applicable.
- Participating Authority:
  - Conduct UI and governance posture evaluation within the stated scope.
  - Provide written feedback on governance findings at pilot conclusion.

## 9. Terms and Conditions
- The pilot is provided “as-is” for evaluation of governance posture only.
- No warranty or commitment is made regarding feature completeness, future functionality, or operational deployment.
- Any optional services (e.g., encrypted sync, VPN) are explicitly out of scope for this pilot and would require separate agreements.

## 10. Acceptance
- Authorized Representative (Participating Authority): _________________________
- Title: _________________________
- Date: _________________________
- Authorized Representative (Vendor): _________________________
- Title: _________________________
- Date: _________________________

Contact for governance inquiries: [Insert Contact]

