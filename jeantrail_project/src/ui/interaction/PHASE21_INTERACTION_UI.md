# Phase 21 – Intelligent Interaction UI (Symbolic)

## Declarations
- UI intelligence ≠ UI execution
- Actions suggest, never force
- Silence is preferred over clutter

## Principles
- Additive only
- No DOM, no UI rendering
- No event listeners
- Symbolic action suggestions only
- Non-executable outputs

## Action Catalog
- Search
  - `image_search`
  - `voice_search`
  - `spell_check`
- Chat
  - `voice_input`
  - `screen_context`
  - `clarify_intent`
  - `summarize_context`
  - `switch_workspace`

## Visibility Rules
- Actions appear only when intent confidence meets threshold
- Never more than 3 actions simultaneously
- All actions are optional, non-blocking, dismissible
- Actions respect privacy scope

## Types
- `InteractionActionSuggestion`
  - `category`: `search` | `chat`
  - `action`: catalog type
  - `confidence`: 0–1
  - `reason`: short descriptor
  - `scope`: privacy scope
  - `nonBlocking`: true
  - `dismissible`: true
  - `optional`: true
  - `visible`: boolean
- `InteractionContext`
  - `privacyScope?`
  - `sessionConfidence?`
  - `activeWorkspaceId?`
  - `screenAvailable?`
  - `voiceAvailable?`
  - `intentHints?`

## Resolvers
- `resolveSearchActions(input, ctx)`
  - Heuristics derive intent for images, voice, spelling
  - Threshold gating and top‑3 capping
  - Scope normalized from privacy
- `resolveChatActions(message, ctx)`
  - Heuristics for voice, screen context, clarify, summarize, switch workspace
  - Threshold gating and top‑3 capping
  - Scope normalized from privacy

## Privacy
- Scope normalized to `ephemeral` unless provided
- No cross‑context execution
- Suggestions only within declared scope

## Behavior
- Suggestions never interrupt conversation
- Suggestions are dismissible and optional
- Silence when confidence is below threshold
