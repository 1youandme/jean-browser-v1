# Digital Execution Store Architecture

**Role:** Platform Ecosystem Designer
**Target:** Builder Browser Integration
**Scope:** V1 Architecture

---

## 1. Store Categories (V1)
The store is organized by **"Outcome"**, not just "File Type".

### A. Starter Blueprints (The "Skeleton")
*   **Description:** Complete, opinionated project structures for common stacks.
*   **Examples:** "Next.js + Tailwind + Supabase Boilerplate", "Rust CLI Tool Starter", "Electron App Base".
*   **Goal:** Save the first 2 hours of setup.

### B. Execution Recipes (The "Action")
*   **Description:** Multi-step automation scripts for specific tasks.
*   **Examples:** "Migrate CSS to Tailwind", "Generate API Documentation", "Audit Dependencies for Vulnerabilities".
*   **Goal:** Automate tedious maintenance work.

### C. Design Systems (The "Skin")
*   **Description:** Pre-configured UI component libraries and themes.
*   **Examples:** "Corporate Dashboard UI Kit", "Landing Page Wireframes".
*   **Goal:** Provide instant visual polish.

---

## 2. Technical Anatomy of a Store Item
A store item is not just a ZIP file; it is a **Smart Package**.

```json
{
  "id": "blueprint-nextjs-starter",
  "version": "1.0.0",
  "type": "BLUEPRINT",
  "manifest": {
    "files": ["package.json", "tsconfig.json", "src/"],
    "commands": ["npm install", "npm run dev"],
    "dependencies": ["node >= 18"]
  },
  "execution_plan": [
    { "step": 1, "action": "CLONE_TEMPLATE", "target": "./" },
    { "step": 2, "action": "INSTALL_DEPS", "risk": "MEDIUM" },
    { "step": 3, "action": "OPEN_README", "target": "README.md" }
  ],
  "safety_hash": "sha256:...",
  "author_signature": "verified:jeantrail-official"
}
```

---

## 3. Safe Execution Protocol
Store items must run inside the **Builder Sandbox**.

1.  **Download & Verify:** The package is downloaded to a temp cache. The signature is verified against the public registry key.
2.  **Preview Mode:** The user sees a **"Dry Run"** summary.
    *   *"This blueprint will create 14 files in `./my-app`."*
    *   *"This recipe will modify 5 CSS files."*
3.  **Isolation:**
    *   Scripts run in a confined environment (no access to `~/.ssh` or `env` vars unless passed explicitly).
    *   Network access is blocked during installation unless whitelisted (e.g., npm registry).
4.  **Rollback:** The system takes a snapshot before applying the item, allowing a 1-click "Undo" if the template breaks the workspace.

---

## 4. Monetization-Ready Structure
The architecture supports future commerce without enabling it yet.

*   **License Keys:** The manifest supports a `license_required: true` field. In V1, all are `false`.
*   **Entitlement Service:** A local stub checks if the user *owns* the item. Currently, it always returns `true` for public items.
*   **Creator IDs:** Every item has an `author_id`. Future revenue share can be calculated by tracking `install_count` per author locally.

---

## 5. Creativity vs. Templates
**Why this doesn't kill creativity:**
*   **Accelerant, not Constraint:** The store provides the *canvas*, not the *painting*.
*   **Ejectable:** Once a blueprint is installed, it is just standard code. The user can modify, break, or rewrite any part of it. There is no "lock-in" to the template.
*   **Composable:** Users can mix a "Next.js Blueprint" with a "Dashboard Design System" and a "Testing Recipe." The pieces are modular, allowing unique combinations.
