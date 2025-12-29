# Jean Governance-First Points System

## 1. Core Philosophy & Constraints
This system is designed to be **anti-manipulative**. It strictly rejects the "dopamine loop" models of modern gamification.
- **No Transferability:** Points cannot be moved between users (prevents black markets).
- **No Monetary Value:** Points cannot be purchased or cashed out.
- **No Data Exchange:** Earning points never requires sharing personal data with third parties.
- **No "Daily Streaks":** No forced engagement mechanics that penalize absence.

## 2. Architecture Components

### A. The Ledger (Local-First)
The ledger is the single source of truth. It resides in the user's local database (`jean_points_ledger`).
- **Immutability:** Each transaction is hashed.
- **Transparency:** The user can export their full ledger at any time.
- **Privacy:** Source details are stored locally. e.g., "Read Article ID 123" is a local record, not sent to a cloud server.

### B. The Store (Placeholder)
A local catalog of redeemable benefits.
- **Inventory:** Digital goods (discounts, unlocks).
- **Logic:** Simple logic gates (Cost <= Balance).

## 3. Database Schema

### `jean_points_ledger`
Records every earning and spending event.
| Column | Type | Description |
|Args|---|---|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Owner of points |
| `transaction_type` | ENUM | `EARN`, `SPEND`, `EXPIRE`, `REVOKE` |
| `amount` | INT | Positive for EARN, Negative for SPEND/EXPIRE |
| `source_category` | ENUM | `EDUCATION`, `ONBOARDING`, `VOLUNTARY_MARKETING` |
| `description` | TEXT | Human-readable reason (e.g., "Completed Privacy Tutorial") |
| `balance_snapshot` | INT | Running total for quick display |
| `created_at` | TIMESTAMP | Event time |
| `expiry_at` | TIMESTAMP | When these specific points expire (if applicable) |

### `jean_store_catalog`
Defines what can be "bought".
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `title` | VARCHAR | Item name |
| `cost` | INT | Points required |
| `type` | ENUM | `DISCOUNT`, `FEATURE`, `VOUCHER` |
| `config` | JSONB | e.g. `{"discount_percent": 20, "code": "JEAN20"}` |

## 4. Earning Rules (Sources)

### I. Educational Tasks (High Value)
*Incentivizing literacy, not addiction.*
- **Read the Privacy Policy:** 500 pts (One-time)
- **Review Permissions Audit:** 100 pts (Weekly max)
- **Learn "How Jean Works":** 200 pts

### II. Onboarding (One-Time)
- **Complete Setup Wizard:** 100 pts
- **Configure Local Backup:** 150 pts

### III. Voluntary Marketing (Strictly Labeled)
*Must be explicitly clicked by user. No background checks.*
- **"Star on GitHub":** 50 pts (User clicks "I have starred", we trust them or check public API read-only if permitted)
- **"Share Feedback":** 100 pts

## 5. Redemption Rules

1.  **Subscription Discounts:**
    - Exchange 1000 pts for 1 month of "Pro" features (if applicable in future).
    - Exchange 5000 pts for 10% off Lifetime License.
2.  **Feature Unlocks:**
    - Unlock "Beta Tester" badge/mode.
    - Unlock cosmetic themes (Dark/Cyberpunk).

## 6. Expiry & Abuse Prevention

### Expiry Policy
- Points expire **12 months** after earning (Rolling window).
- **Reason:** Prevents infinite hoarding liability.
- **Notification:** User must be notified 30 days before expiry.

### Abuse Prevention
- **Rate Limiting:** Max 1000 pts earned per day (prevents script farming).
- **Cap:** Max wallet balance 50,000 pts.
- **Local Trust:** Since DB is local, advanced users *could* edit their points.
    - *Mitigation:* Server-side validation upon redemption. The server checks if the claimed points are mathematically possible based on the user's account age and activity logs (if shared). For strictly local unlocks, we accept the risk of local hacking.

## 7. Governance & Compliance

### Regulatory Safety (EU/GDPR & US/FTC)
1.  **GDPR:** Points data is "personal data".
    - *Compliance:* It lives locally. User can "Delete All Data" which wipes the ledger.
2.  **Dark Patterns (EU Digital Services Act):**
    - *Compliance:* No "Urgency" timers (e.g., "Buy now or lose points!").
    - *Compliance:* No "Nagging" notifications.
3.  **FTC (Unfair Practices):**
    - *Compliance:* Value of points is not monetary. We do not sell points.

### What is STRICTLY FORBIDDEN
- **Buying Points:** Users cannot pay cash for points.
- **Gambling Mechanics:** No loot boxes, no "spin the wheel".
- **Social Pressure:** No "Invite 5 friends to unlock".
- **Profiling:** No "Tell us your income for 500 points".

## 8. Example Flows

### Flow A: The Educational Earn
1. User sees "Privacy Checkup" card.
2. User clicks "Start".
3. Jean walks through recent permission grants.
4. User confirms "I understand".
5. **System:** Writes `+100` to `jean_points_ledger` (Type: `EARN`, Source: `EDUCATION`).
6. **UI:** "You earned 100 pts for reviewing safety."

### Flow B: The Discount Redemption
1. User visits Store. Balance: 2500 pts.
2. Selects "1 Month Pro Discount" (Cost: 1000 pts).
3. **Governance Check:** Is Balance >= 1000? Yes.
4. **System:**
    - Writes `-1000` to `jean_points_ledger` (Type: `SPEND`).
    - Generates/Retrieves Coupon Code.
5. **UI:** Shows code `JEAN-PRO-XYZ`.
