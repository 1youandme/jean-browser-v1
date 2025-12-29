# Commerce Presentation Layer (Future Design)

## Scope
- Documentation-only specification. No UI, no code, no execution.
- Defines an intent-driven, transparent, opt-out-first presentation for commerce content.

## Objectives
- Present commerce-related information only when it aligns with explicit user intent.
- Maintain full transparency about why any commerce content appears and which data was considered.
- Ensure a permanent, easy opt-out at the presentation layer (not buried in settings).
- Prohibit biometric or image data reuse without explicit, per-case consent.

## Core Principles
- Intent-Driven Only
  - Commerce presentation appears exclusively in response to clear, current intent signals (e.g., “compare prices”, “find reviews”).
  - No ambient or opportunistic promotions. Silence by default.
- Full Transparency
  - Every presentation includes a plain-language “Why you’re seeing this” statement.
  - “Used” vs “Not used” data lists are provided for clarity (e.g., intent tokens used; payment history not used).
  - Explicit disclosure of data provenance and applicable policy gates.
- Permanent Opt-Out
  - A first-class control to permanently hide commerce content, with clear reversal path.
  - Respect dismissals across the session and honor long-term opt-out settings.
- No Biometric or Image Reuse Without Consent
  - Biometric signals (face, voice, gait) and user images are never reused for personalization or targeting without explicit consent for the specific use.
  - No model training or inference driven by biometric data without separate, revocable authorization.

## Data Boundaries
- Allowed Inputs (symbolic, intent-oriented)
  - Current task intent tokens (e.g., “price”, “review”, “compatibility”).
  - Capability requirements (e.g., “transcode”, “summarize”, “export to pdf”).
  - Session context flags (e.g., “sensitive_context=false”, “suggestion_count”).
- Disallowed Inputs
  - Revenue data or margin signals.
  - Cross-session tracking and persistent behavioral profiles unless user explicitly opts in.
  - Biometric identifiers or derived embeddings without explicit consent.
  - Private credentials, forms, and unscoped local content.

## Presentation Model (Informational)
- Components (conceptual only; not implemented here)
  - Intent Card: Describes capability match and reason.
  - Transparency Panel: Lists “used” and “not used” data points with sources.
  - Opt-Out Control: Immediate, permanent dismissal with clear undo path.
- Behavior
  - Optional, non-blocking, and fully dismissible.
  - Frequency-capped and respectful of prior dismissals.
  - No timed prompts, interstitials, or urgency cues.

## Consent and Revocation
- Consent
  - Required for any access beyond intent-level signals (e.g., image analysis, biometric processing).
  - Consent is granular, session-bound by default, and revocable without penalty.
- Revocation
  - Opt-outs update presentation logic immediately.
  - Revocations are audited and do not require re-consent for future silence.

## Auditability
- Every presentation can attach a symbolic audit reference that records:
  - Intent tokens used and policy checks applied.
  - No revenue influence and no biometric/image use unless consented.
  - Dismissal events and opt-out changes.

## Interoperability (Future)
- Aligns with existing ethical policies and suggestion filters.
- Respects the Payment Boundary: commerce resides downstream of intelligence; revenue data never flows back upstream.
- Compatible with transparency overlays and “explain this” mechanisms for unified user trust.

## Non-Goals
- Execution, navigation, or purchase flows.
- Personalization beyond explicit, scoped, and consented inputs.
- Any background tasks, tracking, or persuasion mechanisms.
