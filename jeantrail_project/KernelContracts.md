# Kernel Contracts

Formal system contract for kernel governance. This document defines canonical contracts for isolation, intents, policy outcomes, invariants, and compile-time guarantees. It specifies what the system is and must be, without describing implementation or operational procedures.

## Isolation Levels

- `strict`
  - Full isolation of session memory and effects.
  - No cross-session access.
- `shared_read`
  - Read-only sharing to approved sessions/scopes.
  - No writes outside the owning session.
- `shared_write`
  - Controlled write sharing to explicitly approved scopes.
  - Writes are constrained by permission gates and scope policies.
- `permeable`
  - Minimal, policy-gated permeability for narrowly scoped cross-session reads.
  - Allowed only under explicit user approval and compliant governance policies.
  - Not permitted when governance lock is active.

Constraints:
- Isolation levels are a closed set; no other values are permitted.
- All sessions declare exactly one isolation level; it does not implicitly widen.
- Elevation from `strict` to a less isolated level requires explicit authorization consistent with sovereignty policies.

## Intent Catalog

Each intent is a closed union member with defined purpose, required permissions, and allowed isolation levels. No additional intents exist outside this catalog.

- `EXPLAIN_VERSE`
  - Purpose: Generate assistive, cited summary using offline model and classical tafsir.
  - Required Permissions: `corpus.read`, `tafsir.read`, `explain.generate`
  - Allowed Isolation: `strict`, `shared_read`
- `LOAD_TAFSIR`
  - Purpose: Load read-only tafsir excerpts for the selected verse.
  - Required Permissions: `tafsir.read`, `corpus.read`
  - Allowed Isolation: `strict`, `shared_read`
- `READ_VERSE`
  - Purpose: Display Quran Arabic text and selected translations.
  - Required Permissions: `corpus.read`
  - Allowed Isolation: `strict`, `shared_read`
- `SEARCH_QURAN`
  - Purpose: Local search across Arabic and translations.
  - Required Permissions: `search.query`, `corpus.read`
  - Allowed Isolation: `strict`, `shared_read`
- `PLAY_RECITATION`
  - Purpose: Play local audio recitation for the verse.
  - Required Permissions: `audio.play`
  - Allowed Isolation: `strict`, `shared_read`
- `EXPORT_AUDIT`
  - Purpose: Export local decision and audit history to a file.
  - Required Permissions: `audit.read`, `audit.export`
  - Allowed Isolation: `strict`, `shared_read`, `shared_write`
- `SUGGEST_CRITERIA`
  - Purpose: Suggest comparison criteria from local content.
  - Required Permissions: `explain.generate`
  - Allowed Isolation: `strict`, `shared_read`
- `SUGGEST_ENTITIES`
  - Purpose: Suggest entities/items to compare from local content.
  - Required Permissions: `explain.generate`
  - Allowed Isolation: `strict`, `shared_read`
- `FILL_COMPARISON_CELLS`
  - Purpose: Fill comparison table cells with local, cited values.
  - Required Permissions: `explain.generate`, `table.edit`
  - Allowed Isolation: `strict`, `shared_read`
- `EXPORT_COMPARISON_JSON`
  - Purpose: Export the comparison table to local JSON.
  - Required Permissions: `table.export`
  - Allowed Isolation: `strict`, `shared_read`, `shared_write`

Constraints:
- The intent set is closed; free-form intent strings are invalid.
- Provider permission gates must satisfy the required permissions before an intent is eligible.
- Execution requires isolation compliance and sovereignty approval.

## PolicyOutcome Catalog

Outcomes are first-class, immutable decisions with human-readable reasons and machine-readable codes. No boolean logic substitutes for outcomes.

- Kinds: `ALLOW`, `DENY`, `HALT`, `REQUIRE_CONSENT`
- Code Set:
  - `OK`
  - `GOVERNANCE_LOCK`
  - `EXPLICIT_CONSENT_REQUIRED`
  - `PROVIDER_NOT_FOUND`
  - `INVALID_ISOLATION`
  - `MISSING_PERMISSION`

Outcome Contract:
- An outcome includes:
  - `kind`: one of the defined kinds
  - `code`: one of the defined codes
  - `reason`: human-readable rationale
- Outcomes are immutable once issued.
- No implicit conversions to booleans; gates evaluate outcomes directly.

## Invariants

- No free-form `intent` values; only catalog members are valid.
- No string widening for isolation; only `strict`, `shared_read`, `shared_write`, `permeable` are valid.
- `permeable` is disallowed under governance lock; consent is required per sovereignty policy.
- No execution occurs without an `ALLOW` outcome.
- Outcomes are never mutated or replaced by booleans.
- Providers cannot be selected without satisfying required permissions for the target intent.
- Isolation non-compliance must result in a non-`ALLOW` outcome.
- Audit and decision traces must reflect the issued outcome and checks performed.

## Compile-Time Guarantees

- The isolation level is a closed union; invalid literals fail at compile time.
- The intent catalog is a closed union; invalid intents fail at compile time.
- Policy outcome kinds and codes are closed unions; invalid kinds or codes fail at compile time.
- Contract-mapped permission names are closed over the declared set; invalid permission names fail at compile time where enforced.
- Static mappings (intent → permissions, intent → allowed isolation) are exhaustive for the catalog; missing mappings fail at compile time where enforced.

