# Phase 22 – Voice to Device & World Interaction (Symbolic)

## Declarations
- Jean never acts silently
- Voice ≠ permission
- User remains in control

## Rules
- Additive only
- No real device access
- No OS calls
- No automation execution
- Symbolic command routing only
- No background execution
- No chaining commands

## Intent Model
- `ParsedVoiceCommand`
  - `actionType`: `call | search | open | play | control`
  - `target`: `app | system | web | contact | service`
  - `scope`: `local | web | device`
  - `confidence`: 0–1 (symbolic)
  - `reason`: keyword-based explanation
  - `text`: original transcript
- Parser: `parseVoiceIntent(transcript)` produces symbolic suggestions

## Device Capability Descriptor
- `DeviceProfile`
  - `type`: `phone | desktop | tablet | unknown`
  - `supportedActions`: allowed actions
  - `restrictedActions`: blocked actions
- Helpers: `getDefaultDeviceProfile`, `isActionSupported`, `isActionRestricted`
- No assumption of availability; `unknown` by default

## Sovereign Execution Gate
- Router: `routeVoiceCommand(command, profile, options)`
- Requirements:
  - Explicit user consent (`SovereignConsentToken.explicit`)
  - Context match (`VoiceScope → ExecutionContextId`)
  - PrivacyKernel approval (`evaluatePrivacy`, purpose=`execution`)
- Output:
  - `ExecutionRouteResult` with `mode: 'symbolic'`
  - Audit events for allow/deny
  - Single decision per command (no chaining)

## Future Services Compatibility
- `serviceHint`: compatible with future calling/services/APIs
- `apiHint`: no hard dependencies; symbolic only

## Privacy & Context
- `DataScope` normalized (`ephemeral` default)
- Context mapped:
  - `local → local`
  - `web → web`
  - `device → emulator` (symbolic only)
