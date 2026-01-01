# The Jean Hardware Roadmap: A Sovereign Device Future
**Date:** 2026-01-01  
**Author:** Hardware Systems Strategy Team

## 1. Device Philosophy: "Hardware as a Privilege"

Current smart devices treat the user as a data source and the hardware as a locked black box. Jean inverts this.

*   **Modular Sovereignty**: If you can't open it, you don't own it. If you can't replace the modem, you can't trust the radio.
*   **Hardware Governance**: The OS treats hardware sensors (cameras, mics, GPS) as "Hostile until Proven Friendly." Access is denied by default at the kernel level.
*   **Longevity by Design**: A chassis should last 10 years; compute cores should be swapped every 3.

## 2. OS-Kernel Interaction Model

The key innovation is the **Governance HAL (Hardware Abstraction Layer)**.

### Traditional Model (Android/iOS)
`App -> Permissions API -> Driver -> Hardware`
*   *Flaw*: Once permission is granted, the driver is often trusted blindly. Firmware blobs can bypass OS constraints.

### Jean Model
`App -> Governance Intent -> Kernel Gate -> Governance HAL -> Isolated Driver -> Hardware`
*   **Intent-Based Access**: Apps don't ask for "Camera Permission"; they ask "Can I capture a photo of a receipt?".
*   **The Kernel Gate**: The OS checks the `GovernancePolicy` (e.g., "No cameras in 'Home' zone").
*   **Isolated Drivers**: Drivers run in userspace sandboxes (WASM), not ring-0 kernel space. A crashed driver cannot panic the OS.
*   **Physical Kill Switches**: The OS UI reflects the *physical* state of the switch. If the switch is off, the driver is unloaded from memory.

## 3. Phased Feasibility Plan

### Phase 1: The "Soft-Sovereign" Era (2026-2027)
**Goal**: Run Jean OS on existing, unlockable hardware.
*   **Target Devices**: Google Pixel (GrapheneOS compatibility layer), Fairphone 5.
*   **Strategy**: 
    *   Build a "Jean HAL" that wraps standard Android drivers.
    *   Implement "Software Kill Switches" that unbind drivers at the root level.
    *   *Governance*: 100% Software-enforced.

### Phase 2: The Partner Reference Device (2027-2028)
**Goal**: First purpose-built device with trusted partners.
*   **Partner Profile**: HMD Global (Nokia), Purism, or Framework.
*   **Device Spec**: 
    *   Mid-range specs, High-trust components.
    *   **Hard Requirement**: Physical kill switches for Camera/Mic/Radio.
    *   **Bootloader**: Locked to Jean keys but user-reflashable.
*   **Differentiation**: " The only phone that doesn't listen."

### Phase 3: The Modular Compute Core (2029+)
**Goal**: The "Jean Core" - a credit-card sized compute module.
*   **Concept**: A universal compute module (CPU+RAM+Storage+TPM) that slots into:
    *   A Phone Chassis (Screen + Battery + 5G)
    *   A Laptop Dock (Screen + Keyboard)
    *   A Home Server Dock (Ethernet + Power)
*   **Impact**: Users upgrade their "Brain" (Core) without throwing away the "Body" (Chassis).
*   **E-Waste**: Reduced by 60% as screens/batteries have different lifecycles than CPUs.

## 4. Governance Compatibility Roadmap

| Feature | Nokia/HMD (Partner) | Generic Android (Legacy) | Jean Modular (Native) |
| :--- | :--- | :--- | :--- |
| **Boot Chain** | Signed by Partner + Jean | Unlocked / Insecure | **User Owned Keys** |
| **Driver Isolation** | Partial (Treble) | Low (Monolithic) | **Full (WASM)** |
| **Mic Kill Switch** | Physical (Required) | Software Only | **Physical + Power Cut** |
| **Modem Isolation** | IOMMU Grouping | Shared Bus | **Physically Removable** |
| **Supply Chain** | Audited | Unknown | **Ledger Provenance** |

---

**Summary:** We do not just build an OS; we build the *demand* for hardware that respects it. We start by proving the software on Pixel/Fairphone, then partner for the Reference Device, and ultimately commoditize the chassis to free the compute core.
