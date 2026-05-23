# Ceptly — User Story Pipeline

**Sources:** [prd.md](./prd.md) · [spec.md](./spec.md) · [conversation.md](./conversation.md)  
**Repos:** `ceptly2` (Next.js / Vercel) · `ceptly-backend` (Express / Render)  
**Last updated:** May 2026

Use this file as the execution checklist. Check items when shipped and verified in staging or with one real team.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress (optional — replace with `[x]` when done) |
| `[x]` | Done |

**Phase gates:** Do not start the next phase until the previous phase’s “Phase complete” box is checked.

---

## Phase 0 — Platform & Auth (foundation)

**Goal:** Vercel app and Render API share auth; workspace exists in Postgres.

### User stories

- [ ] **As a founder**, I can sign up and sign in on the web app so I can configure Ceptly for my team.
- [ ] **As a founder**, my session is validated on every API call so the backend remains the single trust boundary.

### Tasks

**Backend (`ceptly-backend`)**

- [x] Express scaffold + `GET /health`
- [x] Drizzle + Postgres connection
- [x] `workspaces` table with:
    - schedule columns: `timezone`, `days`, `time`, `frequency`, idempotency field (e.g. `last_checkin_schedule_fire_at`)
    - `team_members` column (associates multiple users to a workspace)
    - unique constraint or composite primary key as necessary for integrity
    - workspace `name` (display), `created_at`, `updated_at`
    - foreign key to organization (if multi-org/future-proofing)
    - migration or seed for first workspace in dev
- [x] User auth routes (`/api/auth/*`) + JWT
- [x] Link authenticated user → workspace (membership / role model)
- [x] Seed script or admin path for first test workspace

**Frontend (`ceptly2`)**

- [x] Auth page (sign in / sign up)
- [x] Auth cookies + server session helpers
- [x] `NEXT_PUBLIC_API_URL` wired to backend
- [x] Post-login redirect to home (not stuck on `/auth`)
- [x] Protected routes for settings / dashboard (middleware or layout guard)

### Phase complete

- [x] Founder can register, log in, and hit a protected page that calls the API with a valid token.

---

## Phase 1 — Check-In Core Loop (Weeks 1–4)

**Goal:** Scheduled Slack DMs → conversational check-in → responses stored. One real team can run a week.

**Spec reference:** [spec.md §9](./spec.md) (build order 1–6, acceptance criteria).

### User stories — Individual contributor

- [x] **As an IC**, I receive a short conversational check-in in Slack DM on the days my team configured, so I can report status without a meeting.
- [x] **As an IC**, the check-in feels like a chat, not a form, so I actually reply.
- [x] **As an IC**, I can flag a blocker in natural language so leadership can hear it without me escalating manually.

### User stories — Founder / team lead

- [x] **As a founder**, I can set check-in days, time, frequency, and workspace timezone in Settings so the schedule fits my team.
- [x] **As a founder**, I see a preview of when check-ins run in local time so I don’t misconfigure timezone.
- [x] **As a founder**, I can add ICs to a roster (Slack user mapping) so the agent knows who to DM.
- [ ] **As a founder**, I can designate `#leadership-digest` (or equivalent) for digests and alerts.
- [ ] **As a founder**, I get a weekly digest in Slack summarizing what everyone is working on (manual trigger OK for Phase 1 end).
>> BLOCKED: - [ ] **As a founder**, I am alerted in Slack when someone reports a blocker during a check-in.

### Tasks

**Backend**

- [x] `GET` / `PUT` `/api/workspaces/:id/schedule` (auth + founder/admin only)
- [x] Roster schema + CRUD (IC Slack user id, display name, paused/opt-out flags)
- [x] Check-in session + response storage schema (session links to workspace; `question_id` FK on responses)
- [x] Re-enable `POST /internal/checkin-scheduler` with `X-Cron-Secret` (401 without secret)
- [x] Due-window algorithm per conversation timezone (§7.1 in spec)
- [x] Idempotency: no double-DM in same 15-minute window (`last_fire_at` per conversation)
- [x] Render Cron Job: `*/15 * * * *` → scheduler endpoint
- [x] Slack app: OAuth install, bot token, signing secret (per-workspace OAuth + events receiver)
- [x] Check-In Agent: DM opener + bullet list; loads enabled questions from DB
- [x] Persist each turn; mark session complete
- [ ] Blocker detection on response → post to leadership channel *(detection logs only; no channel post yet)*
- [ ] Manual/internal endpoint or script to trigger synthesis digest (stub OK)

**Frontend**

- [x] Settings → **Check-in schedule** section (days, time, frequency, timezone)
- [x] Local time preview string (“9:00 AM Central Time”)
- [x] Save/load schedule via schedule API
- [x] Settings → **Team roster** (minimal list + add Slack member by email)
- [x] Settings → **Slack connection** (install app / team linked indicator)
- [ ] Settings → **Digest channel** picker (or channel id field)

### Acceptance (from spec §9.2)

- [x] Founder sets Mon+Thu, 9:00 AM, workspace timezone in UI; reload persists
- [x] Timezone change updates preview without redeploying cron
- [x] Wrong cron secret → 401, no DMs
- [x] Correct secret → DMs only workspaces due in local window
- [x] Same workspace not double-triggered within one 15-minute window

### Phase complete

- [ ] One real team completes at least one full check-in cycle (scheduled DM → replies → data in DB → digest or blocker alert visible to founder).

---

## Product model — Scheduled conversations (Phase 2+)

**Concept:** A workspace runs one or more **scheduled conversations** — each is a named program with its own purpose, schedule, and ordered question list. The Check-In Agent DMs ICs when a conversation is due; the opener includes a **bullet list of topics**, then the agent asks about each in chat (not a form).

```
Workspace
  timezone (shared default for all conversations)
  └── ScheduledConversation[]
        ├── name            e.g. "Monday sprint check-in"
        ├── purpose         e.g. "Track progress and blockers"
        ├── schedule        days, time, frequency, enabled (same shape as workspace schedule today)
        ├── last_fire_at    idempotency per conversation (replaces workspace-level fire for multi-conv)
        └── questions[]     ordered prompt_text rows
              ├── "What did you ship since last check-in?"
              ├── "Any blockers?"
              └── "How's team energy?"
```

**IC Slack UX (default):** Short greeting → bullet list of topics → conversational turn per topic → session complete.

**Migration path:** Phase 1 uses workspace `schedule_*` + hardcoded questions. Phase 2A adds custom questions on a **single implicit conversation**. Phase 2B splits into multiple conversations and moves schedule off the workspace row.

**Build order:** Finish Phase 1 gate → Phase 2A (custom questions) → Phase 2B (multiple conversations) → Phase 2C (intelligence: synthesis, Q&A, AI suggester).

---

## Phase 2A — Custom questions (single conversation) (Weeks 5–6)

**Goal:** Founders type what they want asked, add/remove/reorder prompts, preview the IC bullet list. Still **one** schedule (workspace Settings schedule from Phase 1). Agent uses the custom list on the next due check-in.

**Prerequisite:** Phase 1 phase complete (Slack DMs + session storage working).

### User stories

- [ ] **As a founder**, I type what I want asked and add another prompt so check-ins reflect what I care about now.
- [ ] **As a founder**, I reorder prompts so the most important topics are asked first.
- [x] **As a founder**, I preview the bullet list the IC will see before saving.
- [x] **As a founder**, changes apply on the next scheduled check-in (no redeploy).
- [x] **As an IC**, the agent opens with a short bullet list of topics, then asks about each in chat.

### Tasks

**Backend (`ceptly-backend`)**

- [x] `conversation_questions` table (via `scheduled_conversations`; skipped workspace-only `checkin_questions`)
- [x] Default seed: 3 hardcoded questions for new workspaces (match Phase 1 agent defaults)
- [x] Question API nested under conversations (founder/admin write, any member read):
  - `POST/PATCH/DELETE .../conversations/:id/questions`
  - `PUT .../conversations/:id/questions/reorder`
- [x] Session/response schema: `checkin_sessions` + `checkin_responses.question_id` FK
- [x] Check-In Agent: load enabled questions; DM opener with bullet list
- [x] Validation: max 10 questions, prompt 1–500 chars; scheduler skips zero enabled questions

**Frontend (`ceptly2`)**

- [x] Settings → **Conversations** editor with question list per conversation *(superseded by AI setup chat — see below)*
- [x] Text input per question + “Add question” button *(superseded)*
- [x] Reorder (move up/down), delete, enable/disable per question *(superseded)*
- [x] **Preview as IC** panel: bullet list + sample opener copy (live as user edits)
- [x] Save/load via conversation + question APIs *(commit via AI setup replaces manual save)*

### Acceptance

- [x] Founder sets custom questions, saves, reload persists order and text
- [x] Preview shows bullet list matching saved questions
- [x] Next scheduled DM uses custom list; IC sees bullets; answers stored per `question_id`
- [x] Zero enabled questions → scheduler skips with warning log

### Phase 2A complete

- [ ] One real team runs a week with founder-authored questions end-to-end.

---

## Phase 2B — Multiple scheduled conversations (Weeks 7–8)

**Goal:** Founders create **multiple** scheduled conversations, each with its own purpose, schedule, and question list (e.g. Mon 9am sprint check-in + Thu 4pm EOD pulse).

**Prerequisite:** Phase 2A complete.

### User stories

- [x] **As a founder**, I create multiple scheduled conversations with different names and purposes.
- [x] **As a founder**, each conversation has its own days, time, and frequency.
- [x] **As a founder**, I add and edit the question list per conversation (same editor as 2A).
- [x] **As a founder**, I enable/disable a conversation without deleting it.
- [x] **As a founder**, I see a schedule preview per conversation (“Thu 4:00 PM Central Time”).
- [x] **As an IC**, I receive separate DMs when different conversations are due.

### Tasks

**Backend**

- [x] `scheduled_conversations` table: `workspace_id`, `name`, `purpose`, `timezone`, schedule fields, `last_fire_at`, `sort_order`, `is_default`
- [x] Migration + backfill: default conversation from workspace `schedule_*`; questions under `conversation_id`
- [x] Scheduler uses per-conversation `last_fire_at`; workspace `timezone` kept as shared default
- [x] Conversation CRUD API: `GET/POST/PATCH/DELETE /api/workspaces/:id/conversations`
- [x] Nest questions under conversation (+ reorder, patch, delete, preview)
- [x] Scheduler refactor: evaluate each enabled conversation; idempotency per `last_fire_at`
- [x] Session schema: `scheduled_conversation_id` on `checkin_sessions`
- [x] Limits: max 5 conversations, max 10 questions

**Frontend**

- [x] Settings → **Conversations** list + AI setup chat *(replaced `/settings/conversations/[id]` manual editor)*
- [x] “Add conversation” / manual schedule + question editor *(superseded by AI setup chat)*
- [x] Workspace Settings → **timezone only** + link to Conversations (legacy schedule API proxies to default conversation)

### Acceptance

- [x] Two conversations with different days/times can be created and listed independently
- [x] Disabling one conversation excludes it from scheduler evaluation only
- [x] Same conversation not double-fired within one 15-minute window (idempotency via `last_fire_at`)
- [x] Each conversation’s questions are isolated

### Phase 2B complete

- [ ] Founder runs Mon + Thu programs with different question lists; IC receives both over a week.

---

## AI conversation setup (replaces manual editor)

**Goal:** Founders describe check-in requirements in natural language; Claude returns a validated multi-conversation plan (schedules + questions). Publishing replaces all workspace conversations in one transaction. **No manual form editor.**

**Status:** Implemented (May 2026).

### User stories

- [x] **As a founder**, I describe schedules and topics in chat and get a proposed plan with schedule previews and IC bullet previews.
- [x] **As a founder**, I refine the plan in chat and publish when ready (full replace of workspace conversations).
- [x] **As a non-admin**, I see the current schedule read-only without chat input.

### Backend (`ceptly-backend`)

- [x] `@google/genai`, `GEMINI_API_KEY` / `GEMINI_MODEL` env (503 if key missing on setup routes)
- [x] Zod plan schema (max 5 conversations, max 10 questions each)
- [x] `conversation-setup-agent`: `chat()` + `commit()` (transactional delete-all + insert)
- [x] `POST /api/workspaces/:id/conversation-setup/chat` and `/commit` (founder/admin)

### Frontend (`ceptly2`)

- [x] Settings → **Conversations**: read-only current schedule + AI chat + proposal preview + Publish
- [x] Removed `/settings/conversations/[id]` manual editor and manual editor components
- [x] `lib/api/conversation-setup.ts`, `actions/conversation-setup.ts`

### Supersedes

- Manual `ConversationEditor`, question reorder UI, and “Add conversation” form flow (Phase 2A/2B frontend editor tasks)
- Phase 2C “AI Question Suggester” as a separate editor feature — merged into setup chat (schedule + questions together)

### Acceptance

- [x] Chat → structured proposal; refinement returns full updated plan
- [x] Commit → DB matches proposal; list GET reflects changes
- [x] Invalid plan (6 conversations) → 400; missing API key → 503
- [x] Scheduler still evaluates committed conversations per `last_fire_at`

---

## Phase 2C — Intelligence (Weeks 8–10)

**Goal:** Synthesis, alerts, and Q&A on top of stored conversation data. AI question suggester optional enhancement.

**Prerequisite:** Phase 2B complete (or 2A if multi-conversation deferred — do not start 2C before custom questions work).

### User stories — AI & editor enhancements

- [x] **As a founder**, I describe what I care about and get suggested questions I can edit before saving (per conversation). *(Merged into AI conversation setup chat.)*
- [x] **As a manager**, I preview what the agent will say to an IC before publishing (extends 2A preview). *(Proposal preview on Conversations page.)*

### User stories — Executive / founder (Slack + web)

- [ ] **As a founder**, I receive an automated weekly digest in `#leadership-digest` without triggering it manually.
- [ ] **As a founder**, I get a real-time alert when an IC reports a blocker (refine detection beyond keywords).
- [ ] **As a founder**, I get an alert when an IC misses 2+ consecutive check-ins (disengagement).
- [ ] **As a founder**, I ask questions in Slack DM to the Q&A agent and get answers grounded in stored check-in data only.
- [ ] **As an executive**, I talk to a Strategy Agent in the web app and get text answers (charts optional shell; check-in data only).

### Tasks

**Backend**

- [x] AI Question Suggester endpoint (goal + optional conversation context → suggested prompts via Claude) *(merged into `conversation-setup/chat`)*
- [ ] `/internal/synthesis-scheduler` (same cron pattern as check-in)
- [ ] Synthesis Agent: digest generation + post to digest channel (aggregate across conversations)
- [ ] Disengagement alert job (per IC, any conversation missed 2+ times)
- [ ] Q&A Agent (Slack DM): RAG over stored responses only; no unsourced claims
- [ ] Strategy chat API for web (streaming optional v2)
- [ ] Question set versioning (optional — defer full history to Phase 3)

**Frontend**

- [x] “Suggest questions” flow on conversation editor (goal input → review → save) *(superseded by AI setup chat on Conversations page)*
- [ ] Home / dashboard: Strategy Agent chat shell wired to API
- [ ] Team Health strip placeholder (check-in sentiment only)

### Phase 2 complete (2A + 2B + 2C)

- [ ] Founder runs multiple scheduled conversations with custom questions; digest and Q&A work in Slack; web Strategy chat returns answers from real data.

---

## Phase 2 (legacy index — see 2A / 2B / 2C above)

<details>
<summary>Original Phase 2 items (superseded by 2A–2C split)</summary>

Merged into Phase 2A–2C. Do not track separately.

</details>

---

## Phase 3 — Polish & Retention (Weeks 9–12)

**Goal:** Better questions, trends, and workspace onboarding.

### User stories

- [ ] **As a manager**, I see which questions ICs skip or answer briefly so I can improve them (per conversation).
- [ ] **As a manager**, I can restore a previous question list version after a bad edit.
- [ ] **As a founder**, I see workload and sentiment trends over time for the team.
- [ ] **As an IC**, check-in follow-ups reference my prior answers (e.g. blocker update).
- [ ] **As an IC**, I can pause check-ins or opt out temporarily (`/ceptly pause` or equivalent).
- [ ] **As a new workspace**, I get guided onboarding (Slack install, timezone, roster, digest channel, default schedule).

### Tasks

- [ ] Question analytics (response rate, skip rate, avg length per question, per conversation)
- [ ] Question list version history + restore (per scheduled conversation)
- [ ] Trend aggregates API + simple charts in web app
- [ ] Adaptive follow-up in Check-In Agent (prior session context)
- [ ] IC Slack commands: pause / resume / status
- [ ] Workspace onboarding wizard in Next.js
- [ ] Resolve PRD open questions: digest visible to ICs? contractors in roster?

### Phase complete

- [ ] Team runs 4+ weeks with measurable check-in completion; manager uses analytics to tune questions; onboarding works without engineer hand-holding.

---

## Phase 4 — Linear & Capacity (Weeks 13–18)

**Goal:** “Who’s overloaded?” with hard + soft signals; exec dashboard charts.

### User stories — Executive

- [ ] **As an executive**, I ask “Show me who’s overloaded” and see a respectful list with Linear data and check-in/Slack soft signals.
- [ ] **As an executive**, I see a color-coded Team Health roster with one-line reasons.
- [ ] **As an executive**, when someone is overloaded, I get suggested actions (reassign, sync) without oversharing private detail.
- [ ] **As an executive**, Strategy Agent responses include inline charts (velocity, capacity) when I ask.

### User stories — Individual contributor

- [ ] **As an IC**, when I’m overloaded, I get a private supportive Slack message and triage before burnout escalates silently.
- [ ] **As an IC**, the agent asks before reassigning or deprioritizing my work.

### Tasks

**Backend**

- [ ] Linear OAuth (workspace-level — confirm PRD decision)
- [ ] Issue sync job (assignee, state, estimates, cycle time)
- [ ] Capacity score pipeline (Linear + check-ins + optional Slack signals)
- [ ] Overload detection thresholds + IC triage DM flow
- [ ] Team Health API for dashboard
- [ ] Strategy Agent tool responses: `capacity_list`, `velocity_chart` (per spec §13)

**Frontend**

- [ ] Linear connect in Settings
- [ ] Team Health strip (live data)
- [ ] Context panel chart components (pick chart library — PRD open question)
- [ ] Drill-down from roster row → summary + suggested actions

### Phase complete

- [ ] Exec asks “who’s overloaded” in web app; sees evidence-based list; IC overload flow tested end-to-end with consent before ticket moves.

---

## Phase 5 — Assignment, HR & Full Swarm (Weeks 19+)

**Goal:** Goal → tickets, assignment suggestions, HR-triggered onboarding, performance rollups.

### User stories

- [ ] **As an executive**, I state a high-level goal and get OKRs / Linear tickets with acceptance criteria (human approves).
- [ ] **As an executive**, I get assignment suggestions matched to skills and capacity (human override).
- [ ] **As an executive**, I ask “How has Jordan been performing?” and get an evidence-based rollup.
- [ ] **As HR adds a hire**, onboarding agent sets up Slack, Linear profile, and channels from role data.
- [ ] **As a team**, culture/values nudges and peer pulses run lightly in Slack (later agent).

### Tasks

- [ ] Strategy + Coordination agents (LangGraph or CrewAI — per PRD)
- [ ] Executive goal → ticket breakdown + approval UI
- [ ] Assignment suggestion API + approve/reject flow
- [ ] HRIS webhook integration (vendor TBD)
- [ ] Onboarding agent workflow
- [ ] Performance profile job (Linear, reviews, pulses, outcomes)
- [ ] Vector store for company memory (docs, past projects)
- [ ] Review agent first-pass (design/code) — escalate only when ambiguous

### Phase complete

- [ ] At least one executive goal → approved Linear breakdown; one hire onboarded via HRIS; performance query returns sourced summary.

---

## Cross-cutting — Ops, trust & compliance

Not tied to a single phase; revisit before each phase gate.

- [ ] Environment variables documented and set on Render + Vercel (see spec §8)
- [ ] `CRON_SECRET` rotation procedure
- [ ] Slack rate-limit handling (stagger DMs for large teams)
- [ ] IC transparency copy: what is collected, who sees it, how to pause
- [ ] No surveillance framing in agent copy; IC can view own stored responses (product decision)
- [ ] Error monitoring / structured logs on scheduler runs
- [ ] Privacy review for Slack “stress language” signals (Phase 4)

---

## Open product decisions (block or default before build)

Track in [prd.md §11](./prd.md); resolve and check here when decided.

- [ ] Digest visible to ICs or exec-only?
- [ ] Contractors vs FTE in roster?
- [ ] Default check-in frequency (2×/week vs configurable only)?
- [ ] Chart library + exec-only auth pattern for dashboard?
- [ ] Linear OAuth: workspace vs per-user?
- [ ] HRIS vendor for first integration?
- [ ] Per-sub-team question sets vs one set per workspace? → **Superseded:** per **scheduled conversation** within workspace (Phase 2B)
- [ ] Agent opener UX: bullet list in first message vs one question per message? (Default: **bullets in opener**, then chat per topic)
- [ ] Max questions per conversation? (Default: **10**)
- [ ] Max scheduled conversations per workspace? (Default: **5**)
- [ ] Workspace `schedule_*` columns: keep as timezone-only after 2B migration, or remove? (Default: **timezone only** on workspace)
- [ ] All questions disabled on a due conversation: skip silently vs warn founder in Slack? (Decide before 2A ships)

---

## Quick status snapshot (codebase)

Update this section when phases advance.

| Area | Status |
|------|--------|
| Backend health + auth | Done |
| Workspace schedule schema | Done |
| Schedule API | Done |
| Internal cron scheduler | Done (per-conversation `last_fire_at`) |
| Slack OAuth + per-workspace install | Done |
| Slack Check-In Agent (DMs + turn persistence) | Done |
| Team roster (backend + Settings UI) | Done |
| Frontend auth | Done |
| Settings schedule UI | Done |
| Custom question lists (2A) | Done |
| Multi-conversation schedules (2B) | Done |
| AI conversation setup chat | Done |
| Digest channel + blocker alerts + synthesis | Not started |
| Linear / capacity | Not started |

---

## How to use this file

1. Work **top to bottom**; do not skip Phase 1 acceptance for question/conversation UI work.
2. Phase 2 order is fixed: **2A → 2B → 2C**. Do not build multiple conversations before custom questions work on one schedule.
3. When finishing a task, check `[ ]` → `[x]` and add PR link or commit hash in a comment if useful.
4. Keep [spec.md](./spec.md) and [prd.md](./prd.md) as source of truth for behavior; update this file when scope shifts.
5. **prd-test.md** is intentionally empty — do not use it for planning.
