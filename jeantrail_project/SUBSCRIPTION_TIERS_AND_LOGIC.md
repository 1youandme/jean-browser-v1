# Jean Subscription System Design
**Governance-First / Sovereign Model**

## 1. Philosophy
*   **Sovereign Entitlements:** Your subscription status is checked against a local cryptographic token, not a real-time cloud API. This ensures offline functionality.
*   **No Data Hostage:** Downgrading never deletes your data immediately. It only freezes *new* creation.
*   **Anti-Lock-in:** All data (Memory, Audit Logs) is exportable in standard formats (JSON/SQL) at any time, regardless of tier.

---

## 2. Tier Matrix

| Feature Category | **Core (Free)** | **Pro (Individual)** | **Enterprise (Team)** |
| :--- | :--- | :--- | :--- |
| **Price** | $0 / forever | $20 / month | Custom / Seat |
| **Memory (Vector)** | 100 MB (~50k tokens) | 5 GB (~2.5M tokens) | Unlimited |
| **Audit Log Retention** | 7 Days | 1 Year | Forever / Compliance |
| **Docker Monitoring** | 2 Active Containers | Unlimited | Unlimited |
| **Agent Profiles** | 1 (Standard Jean) | 10 (Custom Personas) | Unlimited |
| **Capability Policy** | System Defaults | Custom Overrides | Enforced by Admin |
| **Support** | Community | Priority Email | Dedicated Success |
| **Governance** | Local Only | Local Only | **Policy Push** (Remote) |

### Enterprise Tier Note (Future)
*   *Status:* "Contact Sales" / Inactive.
*   *Key Differentiator:* The ability for a CISO to push a `policy.json` to 1,000 devices that disables `fs.write` globally.

---

## 3. Entitlement Logic

### A. The "Soft Cap" Implementation
When a user exceeds a limit (e.g., Memory > 100MB on Free Tier):
1.  **System Action:** `WARN` user at 90% usage.
2.  **System Action:** `BLOCK_WRITE` at 100% usage.
3.  **Governance Rule:** **NEVER DELETE**. The system will *never* auto-delete old memories to make space. The user must manually curate or upgrade.

### B. Downgrade Path (The "Off-Ramp")
If a Pro user cancels subscription:
1.  **Grace Period:** Benefits persist until the end of the billing cycle.
2.  **State Change:** Account moves to `CORE_OVERLIMIT` state.
3.  **Effect:**
    *   **Read:** User can still query *all* 5GB of historical memory.
    *   **Write:** New memory creation is blocked until usage drops below 100MB.
    *   **Audit:** Logs > 7 days are archived to a local zip file, then removed from the active queryable DB.

### C. Points & Discounts
*   **Mechanism:** Points are exchanged for "Entitlement Tokens" or "Discount Coupons".
*   **Rules:**
    *   **1 Month Pro:** 1,000 Points (Limit: 1 per user lifetime).
    *   **10% Off Lifetime:** 5,000 Points.
    *   **Feature Unlock:** A user on Free Tier can permanently unlock "Dark Mode" or "+50MB Memory" using points *without* subscribing to Pro.

---

## 4. Upgrade/Downgrade Flows

### Upgrade Flow (User-Initiated)
1.  User clicks "Upgrade to Pro".
2.  Jean explains: "This enables 5GB Memory and Unlimited Containers."
3.  User confirms payment (Stripe/Provider).
4.  **Local State Update:** Jean receives a signed `subscription_token`.
5.  **Entitlement Gate:** Updates local limits immediately.
6.  **Audit Log:** `SUBSCRIPTION_UPGRADE` event recorded.

### Cancellation Flow (No Dark Patterns)
1.  User goes to Settings > Billing.
2.  Button "Cancel Subscription" is visible (Red, standard size).
3.  **Click:**
    *   Jean asks: "Do you want to export your data first?" (Helpful, not obstructive).
    *   User confirms cancellation.
4.  **Effect:** Auto-renew is disabled. Entitlements remain active until `current_period_end`.

---

## 5. Technical Implementation (Entitlement Check)

```typescript
interface TierConfig {
  memory_mb: number; // -1 for unlimited
  container_limit: number;
  audit_days: number;
}

function checkEntitlement(feature: string, currentUsage: number): boolean {
  const tier = getCurrentTier(); // 'core' | 'pro'
  const config = TIER_CONFIGS[tier];
  const override = getPointOverrides(feature); // e.g. +50MB from points

  const limit = config[feature] + override;
  
  if (config[feature] === -1) return true; // Unlimited
  if (currentUsage < limit) return true;
  
  return false; // Soft Block
}
```

## 6. Regulatory Safety
*   **US FTC (Click-to-Cancel):** We comply by offering a simple, one-click cancellation path within the app.
*   **EU GDPR (Data Portability):** The "Downgrade Path" ensures users never lose access to data they created, even if they stop paying.
