# Visual Agent Builder — Rules

## Objective
Create a visual, no-code Agent Builder on top of the existing Agent Runtime.

## Constraints
- Reuse existing agent creation logic and manifest types.
- No new execution paths and no background tasks.
- Permissions must be previewed before creation.
- Agents remain inactive until explicitly started elsewhere.

## Templates
- Research Agent
- Code Agent
- Media Agent
- OS Assistant

## Display Requirements
- Show intended capabilities, required permission scopes, and memory behavior.
- Provide a confirmation screen: “This agent can do X. It cannot do Y.”

## Declarations
- Agent creation ≠ agent execution.
- User always approves scopes explicitly.
