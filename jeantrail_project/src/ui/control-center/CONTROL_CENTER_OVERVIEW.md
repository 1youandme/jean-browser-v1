# Jean Control Center — Overview

## Philosophy
- Visibility layer only. No behavior changes, no autonomous execution, and no new intelligence.
- Reflects already-existing capabilities and runtime state in a unified, collapsible UI.
- All actions remain symbolic unless they are already wired elsewhere.

## Layout
- Top banner: “Jean never acts without your permission.”
- Sections:
  - Agents: Read-only presence and definitions.
  - Permissions & scopes: Granted scopes per agent; no default opt-ins.
  - Memory state: Session and persistent counts; revocation is explicit elsewhere.
  - Audit timeline: Decisions, executions, blocks, revocations.
  - Kill switch status: Session-bound global execution status.
- Each section is collapsible, contains a single-sentence explanation, and provides only navigation.

## Data Sources
- Agents: Agent Runtime inspector types.
- Permissions: Agent permissions scopes.
- Memory: Session and persistent summaries from existing models.
- Audit: Timeline events built from kernel decisions, OS audits, and memory audits.
- Kill Switch: Global kill switch status.

## Declarations
- This is a visibility layer, not a control layer.
- No behavior changes.
