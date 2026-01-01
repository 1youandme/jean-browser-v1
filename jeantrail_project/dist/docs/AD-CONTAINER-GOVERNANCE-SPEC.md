# Governed Video Advertisement Container Specification

Date: [Insert Date]
Status: Governance-First, Non-Surveillance UI Component

## Scope
- Purpose: Define a small, fixed-size, governed video container with explicit user initiation and zero external networking.
- Usage: Optional local promotional surface; not a dynamic ad slot; no remote content execution.

## Dimensions & Layout
- Fixed Size: The container MUST render at `320x180` pixels or an equivalent small footprint set by policy.
- Resizing: The container MUST NOT resize dynamically except when entering fullscreen via explicit user action.
- Border & Label: The container SHOULD display a visible border and label indicating “Local Video” or equivalent.

## Media Source & Packaging
- Local-Only Media: Sources MUST be local files bundled with the build or pre-fetched via a signed, static configuration.
- Allowed Schemes: `file://` or application-internal resource paths; `http(s)://` sources MUST NOT be used.
- Signature: Asset manifests SHOULD be signed; unsigned external sources MUST NOT load.
- Preload: The media element SHOULD use `preload="metadata"`; full content preloading MUST NOT occur without user action.

## Controls
- Required Controls: The container MUST provide:
  - Fullscreen toggle icon
  - Mute/unmute toggle icon
- Optional Controls: Play/pause button and a basic progress bar MAY be provided; no external scripts.
- Defaults: Media MUST load paused and muted; playback MUST require explicit user initiation.
- Fullscreen: Fullscreen MUST require explicit user action; exit MUST be available at all times.

## Playback Policy
- Autoplay: Media MUST NOT autoplay; `autoplay` and any equivalent flags MUST NOT be set.
- User Gesture: Playback MUST require a local user gesture token; programmatic triggers MUST NOT start playback.
- Loop: Looping SHOULD be disabled by default; enabling loop MUST require explicit user action and policy allowance.
- Volume: Initial volume MUST be muted; changes require user action; no external volume controls.

## Networking & Tracking
- External Calls: The container MUST NOT perform any external network calls at render or during playback.
- Tracking Pixels: The container MUST NOT embed pixels, beacons, iframes, or external images.
- Cookies/Storage: The container MUST NOT set third-party cookies or use cross-site storage.
- Instrumentation: No telemetry MUST be emitted; no analytics endpoints MUST be referenced.

## Measurement
- Local-Only Counters: Optional local counters MAY track play events strictly on-device.
- Export: Counters MUST NOT auto-export; manual, administrator-initiated export ONLY.
- Granularity: Counters MUST be aggregate (e.g., play count); content-free; no user identifiers.

## Accessibility
- Labels: Controls MUST include accessible labels and tooltips.
- Keyboard: Play/pause, mute, and fullscreen MUST be operable via keyboard.
- Focus: Focus order MUST be predictable; indicators MUST remain visible in fullscreen.
- Contrast: Icons and text MUST meet minimum contrast requirements per policy.

## Security & Sandbox
- Isolation: The container MUST run in a sandboxed UI context with no DOM injection from remote sources.
- Scripts: The container MUST NOT execute third-party JavaScript; only built-in control logic is allowed.
- Permissions: The container MUST NOT request microphone/camera/location; no sensitive APIs.
- Error Handling: Failure to load local media MUST not trigger fallback to remote sources.

## Compliance Tests
- Dimensions Test: Verify fixed `320x180` rendering and fullscreen toggle behavior.
- Autoplay Test: Confirm playback does not start without explicit click.
- Networking Test: Capture all network activity; zero external requests MUST be observed.
- Pixel Test: Scan DOM for `<img>` or tracking beacons; none MUST exist.
- Source Test: Confirm media `src` uses local schemes; `http(s)` MUST be rejected.
- Controls Test: Verify mute and fullscreen toggles function; keyboard operations succeed.
- Telemetry Test: Static analysis and runtime inspection MUST find zero analytics references.
- Export Test: Confirm absence of auto-export; manual export prompts only.

## Kill-Switch Criteria
- Any external network request detected during render or playback.
- Presence of autoplay behavior without user gesture token.
- Discovery of tracking pixels, beacons, or third-party scripts in the container.
- Media `src` resolves to `http(s)` or remote endpoints.
- Telemetry or analytics endpoints referenced by the component.

