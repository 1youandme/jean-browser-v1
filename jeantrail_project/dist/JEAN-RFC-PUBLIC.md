# Request for Comments: The Jean Sovereign AI Protocol

| Metadata | Value |
| :--- | :--- |
| **RFC ID** | 001 |
| **Title** | The Jean Sovereign AI Protocol |
| **Status** | Draft Proposal |
| **Date** | December 30, 2024 |
| **Category** | Standards Track |
| **Authors** | Jean Governance Board |

## Abstract

This document specifies the **Jean Sovereign AI Protocol**, a standard for building local-first, privacy-respecting AI assistants. Unlike centralized cloud models, Jean enforces user sovereignty through a local kernel, strict permission boundaries, and an offline-capable architecture. This RFC defines the technical specifications for the kernel, the extension ecosystem, and the governance mechanisms required to maintain trust without centralization.

## 1. Motivation

The current AI landscape is dominated by centralized "Oracle" models where user data is harvested, processed in opaque clouds, and monetized through surveillance. This poses systemic risks:

1.  **Privacy Erosion:** Users lose control over their intimate data.
2.  **Platform Risk:** Centralized providers can arbitrarily de-platform users or alter functionality.
3.  **Regulatory Fragility:** Global compliance (GDPR, PIPL) is becoming impossible for monolithic data aggregators.

The Jean Protocol proposes an alternative: a **"Sovereign" architecture** where the AI runs locally, data never leaves the device without explicit consent, and trust is established through cryptographic verification rather than brand reputation.

## 2. Terminology

*   **Jean Kernel:** The local runtime environment (Rust/Tauri) that manages permissions, file access, and model inference.
*   **Strip:** A secure, isolated context for executing tasks (e.g., "LocalDesktop", "ProxyNetwork").
*   **Certified Partner:** An entity cryptographically verified to publish signed extensions.
*   **Revocation List (CRL):** A public, append-only ledger of compromised or malicious entity keys.
*   **Jurisdiction:** The legal framework (EU, US, CN) governing the local policy engine.

## 3. Architecture Specification

### 3.1 Local-First Kernel
The kernel MUST operate 100% offline for core functionality. Network access is treated as a privilege, not a default.
*   **Language:** Rust (recommended for memory safety).
*   **Inference:** Local ONNX/GGUF models favored over API calls.

### 3.2 Permission System
Permissions MUST be granular and intent-based.
*   **Standard:** `files.read`, `network.request`.
*   **High-Risk:** `files.delete`, `camera.access`.
*   **Policy:** The `LocalPolicyEngine` intercepts all high-risk calls and validates them against the active `Jurisdiction` rules.

### 3.3 Extension Model
Extensions (Plugins) MUST run in a sandboxed environment (e.g., WebAssembly or isolated WebView).
*   **Manifest:** MUST include a `signature` field verified against a trusted root.
*   **Communication:** Extensions communicate with the Kernel via typed IPC messages, strictly regulated by the Permission System.

## 4. Governance & Trust Framework

Trust is decentralized and verifiable.

### 4.1 Certification
The ecosystem supports three tiers of trust:
1.  **Local (Unverified):** User takes full responsibility.
2.  **Community:** Automated checks passed.
3.  **Certified:** Cryptographically signed by a vetted partner.

### 4.2 Transparency
*   **Revocation:** The platform MUST maintain a publicly accessible `RevocationList`.
*   **Enforcement:** Revocations MUST cite a specific `ViolationSeverity` (Low to Critical) and a textual reason. Silent bans are prohibited.

## 5. Economic Standard

To ensure sustainability without surveillance, the protocol standardizes ethical monetization.

### 5.1 Static Sponsorships
*   **Definition:** Ad units MUST be static assets (Image/Text).
*   **Restriction:** NO executable code (JS), NO tracking pixels, NO real-time bidding.

### 5.2 Offline Licensing
*   **Verification:** License entitlement MUST be verifiable offline using public-key cryptography.
*   **Privacy:** The verification process MUST NOT require transmitting user identity or telemetry to a central server.

## 6. Security Considerations

*   **Air-Gap Support:** The system MUST be fully functional in an air-gapped environment once dependencies are sideloaded.
*   **Key Compromise:** The protocol assumes keys will be compromised. The `RevocationList` mechanism provides the rapid response capability to neutralize threats.

## 7. Conclusion

The Jean Protocol offers a robust path forward for AI development that aligns with human rights and sovereign values. By standardizing these mechanisms, we invite the broader developer community to build a decentralized, privacy-preserving future.
