# Tab Responsibility Contract

**Status:** ACTIVE
**Enforcement:** Hard-coded in Tab Manager
**Scope:** V1 Release

---

## 1. Local Tab (The Workbench)
**Purpose:** The sovereign workspace for file management, code editing, and local project execution.
**Availability:** ✅ **Active**

*   **Allowed Actions:**
    *   Reading/Writing files within the designated `Project Root`.
    *   Executing standard build commands (`npm install`, `cargo build`) *with explicit confirmation*.
    *   Git operations (commit, stage) initiated by the user.
    *   Rendering local Markdown/Code previews.

*   **Explicitly Forbidden:**
    *   Accessing file system paths outside the `Project Root` (e.g., `C:\Windows`, `/etc`).
    *   Background process persistence (servers must die when tab closes).
    *   Silent modification of files without a diff/log entry.

*   **Risk Level:** **MEDIUM** (Can modify/delete user data).
*   **Execution Rule:** **STRICT APPROVAL.** No command runs without a "Run" click or configuration whitelist.

---

## 2. Web Tab (The Library)
**Purpose:** A standard, sandboxed browser for research, documentation, and previewing web applications.
**Availability:** ✅ **Active**

*   **Allowed Actions:**
    *   Standard HTTP/HTTPS navigation initiated by the user.
    *   Rendering HTML/CSS/JS in a strict sandbox.
    *   Downloading files to the `Downloads` folder (with prompt).

*   **Explicitly Forbidden:**
    *   Headless navigation (browsing without a visible UI).
    *   Automated high-frequency requests (Scraping).
    *   Cross-Origin bypassing (standard CORS rules apply).
    *   Extension injection (no third-party browser extensions in V1).

*   **Risk Level:** **LOW** (Standard Web Sandbox).
*   **Execution Rule:** **USER DRIVEN.** Navigation happens only via URL bar or link clicks.

---

## 3. Emulator Tab (The Mirror)
**Purpose:** A visual simulator for testing responsive designs and mobile-specific viewports.
**Availability:** ⚠️ **EXPERIMENTAL** (Beta Flag Required)

*   **Allowed Actions:**
    *   Viewport resizing to match device presets (iPhone, Pixel).
    *   Touch event simulation (converting mouse clicks to touch).
    *   User-Agent string spoofing for testing responsive logic.

*   **Explicitly Forbidden:**
    *   Accessing real native device hardware (Camera, GPS, Bluetooth).
    *   Simulating App Store APIs or payments.
    *   Running compiled native code (`.apk`, `.ipa`).

*   **Risk Level:** **LOW**.
*   **Execution Rule:** **VISUAL ONLY.** Does not execute backend logic, only frontend rendering.

---

## 4. Proxies Tab (The Router)
**Purpose:** Advanced network routing for testing geo-specific behavior or enterprise VPNs.
**Availability:** 🔒 **DISABLED** (Hard Locked in V1)

*   **Allowed Actions (Future):**
    *   Configuring a single static proxy for the Web Tab.
    *   Routing traffic through a corporate VPN tunnel.

*   **Explicitly Forbidden (Permanent):**
    *   Residential Proxy Rotation (IP hopping).
    *   "Botnet" behavior simulation.
    *   Bypassing rate-limits via IP masking.

*   **Risk Level:** **HIGH** (Potential for abuse/TOS violations).
*   **Execution Rule:** **OFF.** Feature flag is set to `false` in the production build.
