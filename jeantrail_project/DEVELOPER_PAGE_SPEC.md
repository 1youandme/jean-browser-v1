# Jean Developer Studio & Metrics Specification

## 1. Overview
The **Developer Page** (internal: `jean://developer`) is the control center for monitoring the "Governance Health" of the local instance. It provides transparency into how the Agent/Substrate is behaving without compromising user privacy.

**Core Philosophy:** "Metrics for System Health, not User Surveillance."

## 2. Data Schema (Local Aggregates)

We distinguish between **Raw Logs** (audit trail) and **Governance Metrics** (long-term stats).

### Table: `jean_daily_metrics`
Stores anonymous, daily aggregated counters.

| Column | Type | Description |
|---|---|---|
| `date` | DATE | The day of aggregation (UTC). |
| `metric_key` | VARCHAR | e.g., `consent_refusal`, `stop_signal`. |
| `dimension` | VARCHAR | Low-cardinality group (e.g., `capability:file_write`). **NO PII.** |
| `count_value` | INTEGER | The aggregate count. |

### Allowed Metric Keys
1.  **Session & Activity**
    *   `session_start`: Count of boot sequences.
    *   `advisory_shown`: Count of times Jean offered advice.
    *   `advisory_accepted`: Count of times advice was clicked/approved.
    *   `advisory_ignored`: Count of times advice was dismissed.

2.  **Governance Signals**
    *   `consent_granted`: Explicit user approvals.
    *   `consent_refused`: User clicked "Deny".
    *   `stop_signal_invoked`: User hit the Global STOP button.
    *   `policy_blocked`: System auto-blocked an action based on policy (no user prompt).

3.  **Capability Registry**
    *   `capability_usage`: Usage count by type (e.g., `network_proxy`, `fs_read`).

## 3. Retention & Privacy Rules

### Rule 1: The "No-ID" Wall
*   The `jean_daily_metrics` table MUST NOT have a `user_id` column.
*   It is strictly system-wide. If multiple users share a machine (rare for this profile), stats are merged or stored in separate DB files per OS profile, never mixed in a keyed table.

### Rule 2: Aggregation Policy
*   Raw events in `jean_actions_log` are rotated based on Subscription Tier (7 days default).
*   `jean_daily_metrics` are computed nightly via a stored procedure.
*   Once computed, the link to the specific raw event is severed.

### Rule 3: Anti-Fingerprinting
*   **Timestamp Fuzzing:** Metrics are stored by `DATE`, not `TIMESTAMP`. We do not know *when* in the day something happened.
*   **Dimension Capping:** If a dimension (e.g., an extension name) has < 5 events globally, it is grouped into `other` to prevent identifying unique usage patterns.

## 4. UI Sections

### Section A: Governance Health (The "Pulse")
*   **Visual:** Traffic Light Indicators.
*   **Green:** Low Refusal Rate (< 5%). System is aligned with user intent.
*   **Yellow:** Moderate Refusals. User is frequently denying permission requests. *Suggestion: "Review your Permission Policies."*
*   **Red:** High STOP rate. User is actively fighting the agent. *Suggestion: "Reset Agent Memory."*

### Section B: Capability Registry Usage
*   **Visual:** Bar Chart.
*   **Data:** Top 5 capabilities used this week.
*   **Example:**
    *   `fs_read`: 150
    *   `browser_nav`: 80
    *   `network_proxy`: 12
*   **Purpose:** Shows developers what the agent is actually doing. "Why is it reading files so often?"

### Section C: The "Black Box" Recorder (Export)
*   **Controls:**
    *   `[Export Metrics JSON]`: Downloads the anonymous aggregate table.
    *   `[Wipe Metrics]`: `TRUNCATE jean_daily_metrics`.
    *   `[View Raw Logs]`: Deep link to the Audit Log (requires auth).

## 5. Implementation Notes

### Metric Collection Logic (Hook)
When an action occurs (e.g., user clicks "Stop"):
1.  Log detailed event to `jean_actions_log` (audit).
2.  Increment in-memory counter `metrics_buffer['stop_signal_invoked']`.
3.  Flush buffer to `jean_daily_metrics` every 10 minutes or on shutdown (UPSERT logic).

### Export Format
```json
{
  "generated_at": "2025-12-28T10:00:00Z",
  "schema_version": "1.0",
  "metrics": [
    { "date": "2025-12-27", "key": "consent_refused", "count": 3 },
    { "date": "2025-12-27", "key": "advisory_shown", "count": 45 }
  ]
}
```
This format is safe to share with support teams as it contains no text content, filenames, or URLs.
