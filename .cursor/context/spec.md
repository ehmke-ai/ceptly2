# Ceptly Technical Spec — Infrastructure & Check-In Scheduling

**Version:** 0.2  
**Status:** Draft  
**Derived from:** [prd.md](./prd.md), [conversation.md](./conversation.md)  
**Last Updated:** May 2026

This spec narrows the PRD into implementable decisions for **Render deployment**, **check-in scheduling**, **manager-facing schedule controls**, and **roadmap surfaces** (executive dashboard, Linear, capacity/overload). It supersedes the PRD on job scheduling (Inngest → Render Cron Jobs).

**Scope split:**

| Area | In this spec now | Deferred to implementation tickets |
|------|------------------|-------------------------------------|
| Render + cron + schedule | Detailed (§2–§9) | — |
| Executive dashboard + Strategy Agent | Architecture + API boundaries (§13) | Chart library, full chart catalog |
| Linear + capacity + overload | Data model + sync outline (§14–§16) | OAuth UI, full assignment agent |
| HRIS onboarding | Outline only (§17) | Provider choice |

---

## 1. Summary

**Product intent (from product discovery):** Ceptly replaces middle-management coordination with an AI agent swarm — Slack for ICs, web dashboard + Strategy Agent for executives, Linear and HRIS as systems of record for work and hiring. This document implements the **platform and scheduling** layers first; §13–§18 define how later phases attach without rewriting the core API.

Ceptly on Render needs three services:

| # | Render service | Purpose | Build order |
|---|----------------|---------|-------------|
| 1 | **Web Service** | Express backend API — Slack webhooks, agents, permissions, all DB access | **First** |
| 2 | **Postgres** | Primary data store | **Second** (connection string → backend env) |
| 3 | **Cron Job** | Hits an internal scheduler endpoint on a fixed cadence | **Third** (after web service is deployed) |

The Next.js app stays on **Vercel** and talks only to the Express API (unchanged from PRD §7).

**Scheduling model:** One Render cron job runs frequently (e.g. every 15 minutes). Each tick calls a secured internal endpoint; Express evaluates **per-workspace** schedule settings (days, local time, timezone) and triggers the Check-In Agent only for workspaces that are due.

Managers configure schedules in the web app — not in Render. Render only provides the clock.

---

## 2. Render Infrastructure

### 2.1 Web Service (Express)

- **Runtime:** Node.js + Express on Render
- **Responsibilities:**
  - Slack Bolt: events, slash commands, OAuth
  - Check-In, Synthesis, and Q&A agent orchestration
  - All permission checks (single trust boundary per PRD §7)
  - REST API for Vercel (auth, question sets, settings, roster, strategy chat, team health)
  - Internal routes for cron-triggered work (`/internal/*`)
  - Future: Linear sync, capacity recalc, HRIS webhooks (§14–§17)
- **Not exposed:** Direct Postgres access from Vercel or the public internet

**Suggested service name:** `ceptly-api`  
**Example URL:** `https://ceptly-api.onrender.com`

### 2.2 Postgres

- **Provider:** Render managed Postgres
- **ORM:** Drizzle (per PRD)
- **Access:** Only from the Web Service (private connection string in env)
- **Setup:** Create DB → copy `DATABASE_URL` → set on Web Service → run migrations

### 2.3 Cron Job

- **Provider:** Render Cron Job (replaces Inngest for v1)
- **Rationale:** One fewer external dependency; sufficient for periodic scheduler ticks
- **Does not store per-team schedules** — only fires on a global cron expression

**Render cron configuration:**

| Field | Value |
|-------|--------|
| Method | `POST` |
| URL | `https://<your-api-host>/internal/checkin-scheduler` |
| Schedule | `*/15 * * * *` (every 15 minutes — recommended default) |
| Header | `X-Cron-Secret: <CRON_SECRET>` (must match backend env) |

**Why every 15 minutes?** Manager schedules are workspace-local times (e.g. Monday 09:00 in `America/Chicago`). A 15-minute poll gives ±7.5 minute accuracy without needing one Render cron per workspace. The scheduler compares “now” in each workspace timezone against configured day + time.

Alternative: `*/5 * * * *` for tighter windows at higher cron cost.

---

## 3. Internal Endpoint Security

`/internal/*` routes must not be callable by the public. Anyone with the URL could otherwise spam check-ins or digests.

### 3.1 Shared secret header

**Render cron job** sends:

```http
X-Cron-Secret: <value from CRON_SECRET env>
```

**Express** validates before any scheduler work:

```js
app.post('/internal/checkin-scheduler', async (req, res) => {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // run scheduler logic
});
```

### 3.2 Additional hardening (recommended)

- Reject non-`POST` on internal routes
- Do not document internal URLs in public OpenAPI
- Use a long random `CRON_SECRET` (32+ bytes)
- Optional: log and rate-limit repeated 401s from same IP

Same pattern applies to future internal routes (e.g. `/internal/synthesis-scheduler`).

---

## 4. Manager-Configurable Check-In Schedule

**Requirement:** A Monday 9am check-in may work for one team and be ignored by another. Schedule is **per workspace**, editable by founders/admins (and optionally team leads if product allows).

### 4.1 Settings UI (Next.js)

Location: **Settings** (or dedicated **Check-in schedule** section under workspace settings).

| Control | Type | Behavior |
|---------|------|----------|
| **Days of week** | Checkboxes | Mon, Tue, Wed, Thu, Fri (Sat/Sun optional — product decision: include all 7 or weekdays-only in v1) |
| **Time of day** | Time picker | Single daily anchor time, e.g. `09:00` |
| **Frequency** | Radio or segmented control | See §4.2 |
| **Timezone** | Select (searchable) | Workspace-level; used for all schedule math |

**Timezone onboarding:**

- Auto-detect from browser/`Intl` on first workspace setup
- Editable anytime in settings
- Display current local time preview: “Check-ins will run at 9:00 AM Central Time”

**Authorization:** Only `founder` / admin roles can save schedule (align with PRD permissions §5).

### 4.2 Frequency modes

| Mode | UI | Stored behavior |
|------|-----|-----------------|
| **Daily** | Frequency = Daily; day checkboxes disabled or ignored | Run at `time_local` every day |
| **Specific days** | Frequency = Specific days; enable day checkboxes | Run only on selected weekdays |
| **Custom** | Same as specific days — label in UI only | e.g. Mon + Thu = check Mon and Thu boxes |

Implementation: **Daily** vs **specific_days** is one enum; “custom” is not a separate backend mode — it is “specific_days” with any combination of checkboxes.

### 4.3 Defaults (new workspace)

Align with PRD Check-In Agent default:

- Days: Monday, Thursday
- Time: `09:00` local (Monday), `16:00` local (Thursday) — **open question:** single time vs per-day times in v1

**v1 recommendation:** Single `time_local` for all selected days (simpler UI). If product needs Mon 9am + Thu 4pm, add `times_by_day` in v1.1.

Until per-day times exist, default both days to `09:00` or use two preset slots only in copy, not in schema.

### 4.4 Check-in window (PRD §4.1)

PRD mentions “only between 9am–11am.” For v1:

- **Option A:** Window = scheduler tick granularity (15 min) — no extra UI
- **Option B:** Add optional `window_minutes` (e.g. 120) after `time_local` — defer unless needed

Spec default: **Option A** for MVP; document window as future enhancement.

---

## 5. Data Model Extensions

Extend PRD §6 for workspace schedule and cron audit.

```
Workspace
  id, name, slack_team_id, ...
  timezone          -- IANA string, e.g. "America/Chicago"
  schedule_frequency -- enum: daily | specific_days
  schedule_days     -- int[] weekday 0=Sun..6=Sat (Postgres integer array or JSON)
  schedule_time     -- time without TZ, e.g. "09:00" (local to workspace.timezone)
  schedule_enabled  -- boolean, default true
```

Optional:

```
SchedulerRun
  id, started_at, completed_at, workspaces_evaluated, checkins_triggered, error
```

**API types (frontend)** — add to `lib/api/types.ts` when implementing:

```ts
export type ScheduleFrequency = "daily" | "specific_days";

export interface WorkspaceSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[]; // 0-6, Sun-Sat
  time_local: string; // "HH:mm"
  enabled: boolean;
}
```

---

## 6. REST API (Vercel → Express)

All routes require auth; role check on mutating routes.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workspaces/:id/schedule` | Get current schedule + timezone |
| `PUT` | `/api/workspaces/:id/schedule` | Update schedule (founder/admin only) |
| `GET` | `/api/timezones` | Optional: list common IANA zones for picker |

**PUT body example:**

```json
{
  "timezone": "America/Chicago",
  "frequency": "specific_days",
  "days_of_week": [1, 4],
  "time_local": "09:00",
  "enabled": true
}
```

Validation:

- `time_local` matches `^([01]\d|2[0-3]):[0-5]\d$`
- `days_of_week` non-empty when `frequency === "specific_days"`
- `timezone` valid IANA (use `Intl` or timezone library)

---

## 7. Scheduler Logic (`POST /internal/checkin-scheduler`)

High-level flow each cron tick:

```mermaid
flowchart TD
  A[Cron POST with X-Cron-Secret] --> B{Secret valid?}
  B -->|no| C[401 Unauthorized]
  B -->|yes| D[Load workspaces where schedule_enabled]
  D --> E[For each workspace]
  E --> F[Now in workspace.timezone]
  F --> G{Today in schedule_days?}
  G -->|daily| H[Always yes]
  G -->|specific_days| I[Check day set]
  H --> J{Current local time within slot?}
  I --> J
  J -->|yes| K[Enqueue / run Check-In Agent for eligible ICs]
  J -->|no| L[Skip]
  K --> M[200 + summary JSON]
  L --> M
```

### 7.1 “Due now” algorithm

For each workspace with `schedule_enabled`:

1. Convert `now` (UTC) to `workspace.timezone`.
2. If `frequency === specific_days` and today's weekday ∉ `schedule_days`, skip.
3. Parse `schedule_time` as local HH:mm.
4. **Due** if local time is within `[schedule_time, schedule_time + tick_interval)`  
   - With 15-minute cron: due if `floor(now_local to 15m bucket) === floor(schedule_time to 15m bucket)` **or** simpler: `abs(minutes_since_midnight(now) - minutes_since_midnight(schedule)) < 15` and same calendar day.
5. **Idempotency:** Record last run per workspace per local date+slot (e.g. `last_checkin_schedule_fire_at`) so a duplicate cron tick in the same window does not double-DM ICs.

### 7.2 Check-In Agent invocation

When workspace is due:

- Load active question set version
- Load IC roster (not paused, opted in)
- Stagger Slack DMs if large team (PRD risk: rate limits)
- Persist `CheckIn` session stubs as needed

Synthesis / digest scheduling can follow the same pattern on a separate internal route in Phase 2.

---

## 8. Environment Variables

### Web Service (Express)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Render Postgres connection string |
| `CRON_SECRET` | Yes | Shared secret for `X-Cron-Secret` |
| `SLACK_*` | Yes | Bot token, signing secret, client id/secret (per Slack app) |
| `GEMINI_API_KEY` | Yes | Gemini for agents |
| `JWT_SECRET` / session secret | Yes | Vercel ↔ API auth |
| `FRONTEND_URL` | Yes | Vercel origin for OAuth redirects / CORS |

### Cron Job (Render)

| Setting | Value |
|---------|--------|
| `X-Cron-Secret` header | Same value as `CRON_SECRET` on Web Service |

### Vercel (Next.js)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Express base URL |

---

## 9. Build Order & Verification

### 9.1 Implementation order

1. **Express scaffold** — health check, Drizzle, migrations for `Workspace` + schedule fields  
   - Verify: `GET /health` returns 200 on Render  
2. **Postgres** — provision, migrate, seed one test workspace  
   - Verify: API reads/writes workspace row  
3. **Schedule API** — `GET`/`PUT` schedule endpoints + auth  
   - Verify: Vercel settings page saves and reloads schedule  
4. **Internal scheduler** — `POST /internal/checkin-scheduler` + secret check + due logic + idempotency  
   - Verify: manual `curl` with header triggers check-in for test workspace; without header → 401  
5. **Render Cron Job** — `*/15 * * * *` → production URL  
   - Verify: Render cron logs show 200; `SchedulerRun` or app logs show evaluations  
6. **Slack Check-In Agent** — wire scheduler to DM flow  

### 9.2 Acceptance criteria

- [ ] Founder can set Mon+Thu, 9:00 AM, workspace timezone in Settings UI  
- [ ] Changing timezone updates displayed preview without redeploying cron  
- [ ] Cron tick at wrong secret returns 401, no DMs sent  
- [ ] Cron tick at correct secret only DMs workspaces due in their local window  
- [ ] Same workspace not double-triggered within one 15-minute window  
- [ ] PRD tech stack table lists Render Cron Jobs, not Inngest  

---

## 10. Out of Scope (this spec)

- Per-day different times (Mon 9am, Thu 4pm) — v1.1 unless explicitly pulled into MVP  
- Per-user or per-sub-team schedules (PRD open question)  
- Inngest or other job queues  
- Synthesis cron (specify in Phase 2 spec addendum)  
- Email/Teams  
- Full LangGraph/CrewAI multi-agent graph (Phase 5; PRD §4.6)

---

## 13. Executive Dashboard & Strategy Agent (Vercel)

**PRD:** §4.5 — executives use the **web app** as the primary strategy surface; Slack for digests/alerts is supplementary.

### 13.1 Layout (v1 foundation)

| Region | Purpose |
|--------|---------|
| **Chat panel** | Strategy Agent thread; streaming text responses |
| **Context panel** | Charts/metrics the agent attaches to a turn (velocity, sentiment, capacity list) |
| **Team Health strip** | Color-coded roster; overload = orange/red + one-line reason |

v1 may ship chat + Team Health fed by **check-in data only**; Linear-backed charts land in Phase 4 (PRD §10).

### 13.2 Request flow

```
Vercel (authenticated exec) → POST /api/strategy/chat { message, workspace_id }
  → Express → validate founder/admin
  → Load context: recent digests, check-ins, capacity scores (when available), Linear snapshots (Phase 4)
  → Claude (Strategy system prompt) → { reply, visualizations[] }
  → Vercel renders markdown + chart components from visualization descriptors
```

**Visualization descriptor (API contract sketch):**

```ts
type Visualization =
  | { type: "team_health_list"; members: TeamHealthRow[] }
  | { type: "sentiment_trend"; series: { date: string; avg: number }[] }
  | { type: "capacity_heatmap"; rows: { user_id: string; score: number }[] }
  | { type: "velocity_chart"; series: ... }; // Phase 4 — Linear

interface TeamHealthRow {
  user_id: string;
  name: string;
  status: "ok" | "watch" | "overload";
  summary_line: string; // e.g. "4 active tickets, high workload score"
}
```

### 13.3 REST API (exec-only)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/workspaces/:id/strategy/chat` | Send message; returns reply + optional `visualizations` |
| `GET` | `/api/workspaces/:id/team-health` | Current Team Health rows (for strip refresh without chat) |
| `GET` | `/api/workspaces/:id/metrics/sentiment` | Check-in-derived sentiment series (v1 chart data) |

**Authorization:** `founder` / admin only for strategy routes; same trust boundary as PRD §7.

### 13.4 Guardrails

- Strategy Agent answers must cite sources (check-in date, Linear issue id when integrated) — no unsourced claims (align with Q&A Agent PRD §4.3)
- Overload summaries must not include raw private Slack message content — only aggregated signals and work-context quotes ICs shared in check-ins
- Ticket reassignment suggestions return as **proposals**; `POST /api/.../actions/reassign` requires explicit exec confirmation (and IC consent flow per §16)

---

## 14. Linear Integration (Phase 4)

**PRD:** §4.7 Linear — ticket lifecycle, capacity, performance signals.

### 14.1 Connection

- Workspace-level OAuth to Linear (store refresh token on `LinearConnection`)
- Periodic sync job (Render cron or dedicated `/internal/linear-sync`) + webhooks if enabled
- Map Linear users → Ceptly `User.linear_user_id`

### 14.2 Synced fields (minimum)

Per assignee, per sync:

- Active issue count and total estimate points in "started" states
- Completed issues in rolling 14d window
- Time in state vs estimate (flag when >1.25× historical baseline for that user)

Persist as `LinearIssueSnapshot` rows or aggregated daily rollups per user.

### 14.3 Agent write paths (Phase 5)

- Strategy/Coordination agents call Linear API to **create/update** issues only after exec approval in v1 of write path
- Acceptance criteria generated by LLM; human can edit in Linear as usual

---

## 15. Capacity Score

**PRD:** §4.8 — combines Linear, Slack, and check-in signals.

### 15.1 Components (0–1 each, weighted)

| Component | Source | Example signal |
|-----------|--------|----------------|
| `linear_load` | Linear sync | Active issues + estimate overrun |
| `slack_stress` | Slack analysis | After-hours ratio, latency spike, keyword flags (configurable) |
| `checkin_workload` | Check-In Agent | Latest 1–5 workload; trend vs 4-week avg |

**Formula (v1 implementation):**

```
capacity_score = clamp(
  0.45 * linear_load + 0.35 * checkin_workload_norm + 0.20 * slack_stress,
  0, 1
)
```

Thresholds (tunable per workspace):

- `≥ 0.7` → `watch`
- `≥ 0.85` → `overload` → trigger §16 flow + Team Health color

Recompute on: check-in completed, Linear sync tick, daily Slack rollup job.

### 15.2 Storage

Update `User.capacity_score`, `User.capacity_updated_at`; optional `CapacitySignal` audit rows for debugging.

---

## 16. Overload Response Flow

**PRD:** §4.8 IC + executive experiences.

```mermaid
sequenceDiagram
  participant S as Scheduler / sync
  participant A as Check-In or Overload Agent
  participant IC as IC (Slack DM)
  participant API as Express
  participant E as Exec (Web dashboard)

  S->>API: capacity_score crosses threshold
  API->>A: start OverloadEvent
  A->>IC: private DM offer to talk
  IC->>A: optional triage replies
  A->>API: save triage_summary
  API->>E: Team Health + notify Strategy context
  E->>API: optional approve reassignment
  API->>IC: confirm before Linear assignee change
```

**Idempotency:** One active `OverloadEvent` per user per rolling 7 days unless resolved.

**Internal/cron:** `/internal/capacity-recalc` (future) with same `X-Cron-Secret` pattern as §3.

---

## 17. HRIS Onboarding (Phase 5 — outline)

**PRD:** §4.6 Onboarding agent, §4.7 HRIS.

- Ingest `HireEvent` (webhook): `role`, `team`, `skills[]`, `email`
- Steps (automated, logged): create/link Linear user, invite Slack channels, schedule first Check-In Agent DM, post welcome template to `#team` or DM
- All steps retryable; failures alert workspace admin in Slack

Provider-specific payloads live in provider adapters — not fixed in this spec until vendor is chosen (PRD open question).

---

## 18. Performance Profile (Phase 5 — outline)

**PRD:** §4.9.

Weekly job aggregates:

- Linear: completion rate, rework rate, estimate delta
- Check-ins: workload/morale trend
- Peer pulses (when enabled): rolling 30d avg
- Outcomes: manual or metrics API link (TBD)

Store summarized JSON on `User.performance_profile_summary`; Strategy Agent reads summary + cites underlying metrics in chat.

---

## 11. PRD Amendments

When this spec is accepted, [prd.md](./prd.md) should stay aligned on:

| Topic | PRD section | Spec section |
|-------|-------------|--------------|
| Workspace schedule UI | §4.1 | §4 |
| Render Cron Jobs | §7 | §2–§3, §7 |
| Executive dashboard | §4.5 | §13 |
| Linear + capacity | §4.7–§4.8 | §14–§16 |
| HRIS + performance | §4.6–§4.9 | §17–§18 |
| Build phases | §10 | §9 + PRD Phase 4–5 |

---

## 12. Open Questions

- [ ] Weekends in day picker for v1, or Mon–Fri only?  
- [ ] Single `time_local` vs per-weekday times for Mon 9am / Thu 4pm default  
- [ ] Can `lead` role edit schedule or founder-only?  
- [ ] Cron interval: 15 vs 5 minutes (cost vs precision)  
- [ ] Separate cron job for synthesis digest or same endpoint with `?job=digest`  
- [ ] Chart library for executive dashboard (Recharts vs Tremor vs custom)  
- [ ] Slack stress signals: run in Express batch job vs stream processing  
- [ ] Linear webhook vs poll-only for v1 of sync  
- [ ] IC consent: Slack button ("OK to reassign X") vs explicit text reply  
