# JEAN BROWSER v1.1 - UI REFERENCE BUILD (FROZEN)

**STATUS: FROZEN / NON-OPERATIONAL / REVIEW ONLY**

## 1. Overview
This document serves as the official UI reference for the Jean Browser v1.1 build. This build is a **static, visual-only representation** of the intended governance-first browser interface. It contains NO functional backend, NO networking capability, and NO telemetry.

## 2. Browser Shell Layout

### 2.1 Top Bar Architecture
The top bar is divided into three distinct zones:

#### Zone A: Left Control Cluster
- **Ad Box (Sponsors)**
  - *Location:* Top-left corner (80x80px).
  - *Visual:* White box with "Sponsors" label.
  - *Content:* Static list of 3 partner placeholders (Partner A, B, C).
  - *Functionality:* **NONE**. No rotation, no tracking pixels, no external calls.
- **Tools Grid (2x2)**
  - *Location:* Adjacent to Ad Box.
  - *Icons:* Profile (User), Settings (Gear), Accounts (Group), Services (Wrench).
  - *Functionality:* **NONE**. Visual cues only.
- **Jean Identity Icon**
  - *Location:* Adjacent to Tools Grid.
  - *Visual:* Large circular "J" icon (80x80px).
  - *Functionality:* **NONE**. Represents the AI assistant entry point (disabled).

#### Zone B: Center Navigation & Tabs
- **Decorative Elements:** Two static horizontal bars above the tab strip.
- **Tab Strip (Strict Limit: 4)**
  1.  **Proxies** (Shield Icon): Represents the secure routing layer.
  2.  **Local Device** (Laptop Icon): Represents local file system access.
  3.  **Web** (Globe Icon): Represents standard browsing (Default).
  4.  **Mobile App Emulator** (Phone Icon): Represents mobile view simulation.
- **Address Bar**
  - *Visual:* Standard URL input field with a Lock icon.
  - *Content:* Pseudo-protocol `jean://[tab-name]`.
  - *Functionality:* **LOCKED**. Read-only. User input is disabled to prevent navigation attempts.
- **Context Icons**
  - **Extensions:** Puzzle piece icon (Static).
  - **Favorites:** Star icon (Static).
  - **Info:** 'i' icon with hover-only tooltip explaining the static nature of the build.

#### Zone C: Right Spacer
- Empty reservation for future window controls (Minimize, Maximize, Close).

### 2.2 Main Content Area
- **Visual:** Centered watermark "REVIEW ONLY".
- **Content:** Large icon representing the currently selected tab.
- **Functionality:** **NONE**. This area is a static placeholder. No rendering engine is active.

### 2.3 Bottom Status Bar
- **Height:** Thin footer (28px).
- **Indicators:**
  - **Version:** `v1.1-ui-review`
  - **Governance Warning:** "⚠️ Governance Restrictions Active"
  - **Security:** "🛡️ High" (Static)
  - **Network:** "📡 Offline" (Hardcoded red status)
  - **CPU:** "⚡ 0%" (Hardcoded)
  - **Privacy:** "👁️‍🗨️ Blocked" (Hardcoded)

## 3. Operational Constraints (Strict)

### 3.1 Forbidden Actions
The following features are **explicitly removed** and **forbidden** in this v1.1 reference build:
1.  **Network Requests:** No `fetch`, `XMLHttpRequest`, or WebSocket connections are permitted.
2.  **Telemetry:** No data collection, crash reporting, or usage analytics.
3.  **Ad Execution:** The ad box is a static `<div>`. No ad scripts or ad networks are loaded.
4.  **Video Playback:** No `<video>` or `<audio>` elements are active.
5.  **Navigation:** The address bar does not accept input. The "Back/Forward" buttons are visual only.

### 3.2 Non-Operational Elements
All UI elements are "dumb" components. Clicking buttons may trigger a visual state change (e.g., active tab highlight) via React state, but triggers **no business logic** or backend processes.

## 4. Governance Sign-Off
This UI reference build is frozen for legal and design review. Any changes to this layout require a new version number (v1.2+) and governance approval.
