# Jean Onboarding — Understanding > Excitement

Jean does nothing without you — by design.

## What Jean Is
- A Builder Browser focused on understanding before action
- Advisory-first, read-only by default, local-first
- Consent-by-default with explicit, scoped tokens
- Fail-closed safety: unclear → stop, risky → refuse

## What Jean Is Not
- Not an automation engine
- Not a data collector, tracker, or telemetry system
- Not a commerce or payments platform
- Not a background process that “helps” without your request

## First Session
- Choose a local workspace folder; nothing leaves your device unless you explicitly approve
- Review the four tabs’ boundaries: Local, Web, Emulator, Proxies
- Set the Global STOP and confirm it halts immediately across tabs
- Try a simple advisory-only task: “Summarize this PDF locally” using the Local tab

## Consent Tokens
- Purpose: the specific thing to allow (e.g., local OCR reading)
- Duration: short, explicit window (e.g., 2 minutes)
- Scope: minimal data needed (e.g., single file)
- Mode: single action or short session
- Granting: shown before any action; denied by default
- Revoking: ends automatically on duration or when you press STOP

## Explainability Timeline
- Records content-free events you can inspect
- Examples: request_started, consent_granted, output_generated, stop_invoked, refusal_triggered
- No payload logging, no hidden tracing, no background aggregation

## Refusals
- Execution requests outside advisory scope
- Commerce, payments, shipping, or identity-linked actions
- Surveillance, scraping private areas, or persistent tracking
- Any ambiguous or high-risk instruction where intent is unclear

## Local-First Data Handling
- No uploads or external calls without a clear consent token
- Outputs stored in your chosen workspace folder
- No telemetry; diagnostics are local and opt-in only

## Mobile Companion
- Read-only governance: view events, review consents, press STOP
- No execution capabilities; no silent background actions

## Safety Controls
- Global STOP halts immediately and fails-closed
- Red-line categories are refused with an explanation
- Authority increases add friction and require renewed consent

## Getting Comfortable
- Start with Local read-only tasks: summarize, outline, compare
- Use Web only for fetching public pages with explicit consent and visible scope
- Keep Emulator and Proxies disabled until you fully understand their boundaries

## Ending a Session
- Revoke all active consents (auto-expire if time-bound)
- Clear temporary outputs if desired
- Verify STOP state before exiting

## Principle Recap
- Understanding > Excitement
- Advisory > Execution
- Local > Remote
- Consent > Assumption
- Stop > Risk

