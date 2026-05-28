# PRD: Ceptly — AI-Powered Team Management for Flat Organizations

**Version:** 0.4  
**Status:** Draft  
**Author:** Michael Ehmke  
**Last Updated:** May 2026

---

## 1. Overview

### Problem Statement

Flat organizations — startups, small companies intentionally operating without a middle management layer, and larger companies that want to reduce middle management — break down at scale because coordination, visibility, and team health depend on humans manually doing the work managers typically own: check-ins, status updates, blocker identification, task assignment, and performance signals. Without tooling to replace that function, executives become the information bottleneck and problems surface too late.

### Product Vision (North Star)

Ceptly is **management by infrastructure instead of by person**: a swarm of specialized AI agents that sit between leadership and individual contributors (ICs), handling day-to-day management so people can focus on deep work.

Imagine a company, say 5 years in the future. They have developers, designers, marketing and executive team. But the executives barely ever talk with the Individual contributors. A system of AI agents does this instead. It handles nearly all the management stuff.

At full maturity, the system includes:

| Agent role                    | Responsibility                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| **Strategy**                  | Takes executive input; breaks goals into OKRs, timelines, tradeoffs, and project plans |
| **Coordination & assignment** | Matches work to people by skills, workload, capacity, and past performance             |
| **Communication**             | Tailored Slack updates, summaries, and clarifying questions per person’s preferences   |
| **Check-in & feedback**       | Async pulse, sentiment, burnout risk, lightweight peer feedback                        |
| **Review**                    | First-pass design/code review; escalates only when ambiguous or high-stakes            |
| **Culture**                   | Nudges when company values are missing from decisions                                  |
| **Onboarding**                | Triggered when a new hire appears in HRIS — role, channels, Linear, Slack sequence     |

Executives primarily interact with a **Strategy Agent** in the web app (chat + charts) and optionally in Slack. ICs interact mainly in Slack. The system learns from what gets approved, ships, and fails.

**MVP focus:** Check-ins, synthesis, Q&A, Question Editor, and executive dashboard foundations — then Linear, capacity signals, and assignment loops (see §8 and §10).

### Solution

Ceptly is a product powered by AI agents that proactively gather context from ICs (Slack conversations, integrations, and lightweight self-reports), synthesize it, and deliver structured updates, alerts, visual dashboards, and answers to founders and executives — without requiring a middle manager in the loop.

### Target User

- **Primary:** Founders and team leads at flat-structure startups (10–80 people).
- **Secondary:** Executives at large companies that want to flatten their companies org.
- **Thirdary:** Individual contributors who need a lightweight async way to surface blockers and progress.

### Core Value Proposition

> "Your team's AI chief of staff — so people focus on real work."
> "Replace your middle manager with infrastructure that scales."

---

## 2. Goals

### Goals

- Replace the coordination and visibility function of middle managers for flat orgs
- Reduce executive time spent on status gathering, meetings, and team health monitoring
- Surface problems (blockers, overload, morale dips) earlier than they would appear organically
- Minimize IC overhead for communicating upward — primarily via Slack, not forms or syncs
- Give executives a **conversational + visual** command center (Strategy Agent chat + charts)
- Integrate with tools teams already use (**Slack**, **Linear**; **HRIS** in later phases)
- Provide consistent, data-driven capacity and performance signals (reduce manager bias)
- Automate routine management: task breakdown, assignment suggestions, onboarding setup (phased)
- Assist team leads with evidence-based performance context (not firing recommendations in v1)

old:

- Reduce founder time spent on status gathering and team health monitoring
- Surface problems earlier than they would appear organically
- Reduce time spent by IC's communicating with higher ups
- Require zero behavior change from ICs beyond a Slack DM
- Assist Team Leads with performance reviews
- Assist Team Leads with tracking performance
- Assist Team Leads by tracking lateness etc.
- Assist Team Leads with giving requirements to Team Leads

## 3. User Stories

### Executive / Founder / Team Lead

- As an executive, I want to talk to a Strategy Agent in the web app (like a sharp COO) and get both answers and the right charts inline (velocity, timelines, capacity, sentiment).
- As an executive, I want to ask "Show me who's overloaded" and see a respectful summary with hard data (Linear) and soft signals (Slack, check-ins) — without oversharing private detail.
- As an executive, when someone is overloaded, I want suggested actions (reassign ticket, quick sync) and a one-line Team Health view (color-coded roster).
- As a founder, I want to see a weekly summary of what every team member is working on, without having to ask them myself.
- As a founder, I want to be alerted when someone is blocked so I can unblock them before it becomes a sprint-level problem.
- As a founder, I want to ask a question like "Is anyone burnt out?" and get an honest synthesized answer based on recent check-in data.
- As a founder, I want to ask "How has Jordan been performing?" and get an evidence-based summary from Linear, reviews, pulses, and outcomes — not gut feel.
- As a team lead, I want to know if team morale is trending down before someone quits.
- As an executive, I want high-level goals (e.g. "Launch mobile checkout by Black Friday") broken into priorities, tickets, and tradeoffs via Linear integration (later phase).

### Founder / Team Lead (Question Editor)

- As a founder, I want to tell Ceptly what I care about (e.g. "I want to track sprint progress and team energy") and have it suggest a question set I can customize.
- As a manager, I want to add my own custom questions so the check-in reflects what actually matters to my team right now.
- As a manager, I want to reorder questions so the most important ones get asked first.
- As a manager, I want to preview exactly what the agent will say to an IC before I publish changes.
- As a manager, I want to see which questions ICs tend to skip or give short answers to, so I can improve them.

### Individual Contributor

- As an IC, I just want to talk to my boss about technical things. Nothing else.
- As an IC, I want to report my status without having to write a formal update or attend a sync.
- As an IC, I want to flag a blocker to leadership without having to navigate politics or escalate manually.
- As an IC, I want the check-in to feel conversational, not like filling out a form.
- As an IC, when I'm overloaded, I want a private, supportive Slack message and triage — not silent burnout or surprise reassignment without my consent.

---

## 4. Agent Architecture

**v1 (MVP):** Check-In, Synthesis, and Q&A agents — primarily in Slack; managers configure questions in the web app.

**Later phases:** Strategy, Coordination, Communication, Feedback/Culture, Review, and Onboarding agents (see §4.5–§4.6 and §10).

All IC-facing agents default to Slack. Executive Strategy Agent is **web-first** with optional Slack digest (§4.5).

---

### 4.1 Check-In Agent

**Role:** Proactively contacts individual contributors on a set cadence to gather status context.

**Behavior:**

- DMs each IC on a configurable schedule (default: Monday morning and Thursday EOD)
- Conducts a short, conversational async interview — not a form
- Adapts follow-up questions based on prior responses (e.g., if someone flagged a blocker last week, asks for an update on it)
- Persists responses to a structured data store for downstream synthesis

**Sample Check-In Flow:**

> **Agent:** Hey Sarah — quick check-in! What are you focused on this week?  
> **Sarah:** Finishing the onboarding flow and a bug fix for the dashboard.  
> **Agent:** Got it. Any blockers or things slowing you down?  
> **Sarah:** Waiting on design to finalize the empty state screens.  
> **Agent:** Noted. On a scale of 1–5, how are you feeling about your workload right now?  
> **Sarah:** 3, it's manageable but getting full.

**Questions Asked (rotating, not all every session):**

- What are you working on this week?
- Any blockers or dependencies waiting on others?
- How is your workload feeling? (1–5)
- Anything you want leadership to know?
- Is there anything you're unclear on in terms of priorities?

**Configuration (per workspace):**

- Check-in schedule (manager-configurable in Settings UI):
  - Days of week — checkboxes (any combination, e.g. Mon + Thu)
  - Time of day — time picker in workspace timezone
  - Frequency — daily, or specific days (custom = any day combination)
  - Timezone — workspace-level; auto-detected on onboarding, editable
- Default: Monday and Thursday mornings (team-specific schedules override via UI)
- Active question set (managed via Question Editor — see Section 4.4)
- Whether ICs can opt out of specific questions

See [spec.md](./spec.md) for Render cron + scheduler implementation.

---

### 4.2 Synthesis Agent

**Role:** Processes raw check-in responses and produces structured summaries and alerts for team leads.

**Behavior:**

- Runs after each check-in window closes
- Reads all IC responses for the period
- Groups insights by theme: progress, blockers, workload, morale, open questions
- Identifies patterns across the team (e.g., multiple people waiting on the same dependency)
- Flags anomalies: someone who usually responds positively suddenly rates workload 1 or 5
- Posts a digest to a designated Slack channel (e.g., `#leadership-digest`)

**Output Format (posted to Slack):**

```
Weekly Team Digest — Week of May 19

Progress:
• Sarah B:
  - [5/10] Onboarding flow
  - [7/10] dashboard bug fix
• James G:
  - [2/10] Auth refactor (Day 3/5)
• Meagan K:
  - [9/10] Customer interviews for Q3 research

Blockers (3):
• Sarah B → waiting on design: empty state screens
• James G → needs backend env access from DevOps
• Meagan K → no blockers

Workload Sentiment
Average: 3.2 / 5  ▓▓▓░░
• 2 people trending toward overload (4+)
• 1 person underloaded (1)

Flags
• James hasn't responded to 2 consecutive check-ins
• Workload scores up 0.8 pts vs last week — worth a pulse check

Open Items for Leadership
• "Are we still targeting a June launch or has that shifted?"
• "Can we get clarity on the new feature prioritization?"
```

**Alert Types:**

| Alert               | Trigger                                                         |
| ------------------- | --------------------------------------------------------------- |
| Blocker Alert       | IC reports a blocker; posts immediately to `#leadership-digest` |
| Disengagement Flag  | IC misses 2+ consecutive check-ins                              |
| Workload Spike      | Team average workload score increases >1pt week-over-week       |
| Morale Dip          | 2+ ICs report low scores in same window                         |
| Unanswered Question | IC submits a question that no digest has addressed in 7+ days   |

---

### 4.3 Q&A Agent

**Role:** Allows founders and team leads to ask natural language questions about their team and get answers synthesized from check-in history.

**Behavior:**

- Responds to @mentions or DMs from authorized users (founders, leads)
- Queries the check-in data store to construct answers
- Answers are grounded in actual IC responses — never fabricated
- Cites the source timeframe ("based on check-ins from this week")

**Example Queries:**

| Query                                       | Agent Response                                       |
| ------------------------------------------- | ---------------------------------------------------- |
| "Is anyone blocked right now?"              | Lists current blockers with names and context        |
| "How is team morale looking?"               | Synthesizes workload and sentiment scores with trend |
| "What is James working on?"                 | Summarizes James's last 2 check-ins                  |
| "Who hasn't checked in this week?"          | Lists non-responders                                 |
| "Are there any recurring blockers?"         | Identifies dependencies that have appeared 2+ times  |
| "What questions does the team have for me?" | Surfaces unaddressed IC questions                    |

**Guardrails:**

- Q&A Agent only answers questions about team members to authorized roles (founder, team lead)
- ICs can only query their own data
- Agent always attributes answers to timeframe and source ("Sarah mentioned this on Monday")
- Agent does not speculate or extrapolate beyond what was said

---

### 4.4 Question Editor (Next.js UI)

**Role:** Gives managers a web UI to define, customize, and preview the exact questions the Check-In Agent asks their team — with an AI assistant that suggests and refines questions based on stated goals.

This is the primary surface of the Ceptly web app. Everything else (digests, alerts) flows through Slack; this is where managers shape what the agents ask.

---

#### 4.4.1 Question Management

Managers can build and maintain a question library for their workspace.

**Question Types:**

| Type            | Description                        | Example                                                     |
| --------------- | ---------------------------------- | ----------------------------------------------------------- |
| Open text       | Free-form response                 | "What are you working on this week?"                        |
| Scale (1–5)     | Numeric rating with optional label | "How is your workload? (1 = light, 5 = overwhelmed)"        |
| Yes / No        | Binary with optional follow-up     | "Are you blocked on anything?"                              |
| Multiple choice | Select from options                | "Which best describes your week: on track / behind / ahead" |

**Question List UI:**

- Displays all questions in the active question set as a drag-and-drop ordered list
- Each question row shows: question text, type, active/inactive toggle, edit and delete controls
- Max active questions per check-in session: configurable (default: 4)
- Questions marked inactive stay in the library but won't be asked
- Changes to the active set take effect on the next scheduled check-in

**Editing a Question:**

- Inline edit or modal editor
- Fields: question text, question type, follow-up prompt (optional), skip logic (optional: only ask if previous answer meets condition)
- "Tone preview" toggle: shows how the agent will phrase the question conversationally (e.g., a stiff "Please rate your workload 1–5" becomes "How's your workload feeling this week? (1 = easy, 5 = overwhelming)")

---

#### 4.4.2 AI Question Suggester

The Question Editor includes an AI-powered suggestion flow that helps managers build their question set without starting from scratch.

**Entry Point:** "Help me build my question set" prompt at the top of the Question Editor page.

**Flow:**

```
Step 1 — Manager states their goal
Ceptly: "What do you most want to understand about your team right now?"
Manager: "I want to track sprint velocity and whether people are burning out"

Step 2 — AI generates suggested questions
Ceptly returns 6–8 suggested questions tailored to the stated goal:

  Suggested for "sprint velocity + burnout":
  ✦ What did you ship or complete since the last check-in?
  ✦ Are you on track to hit your goals this sprint?
  ✦ What's one thing slowing you down right now?
  ✦ How are you feeling energy-wise this week? (1 = drained, 5 = energized)
  ✦ Is your current workload sustainable at this pace?
  ✦ Anything you'd want to flag before the weekend?

Step 3 — Manager reviews and selects
  - Add individual questions with one click
  - Edit any question before adding
  - Regenerate the whole set with a different goal

Step 4 — Confirm active set
  - Drag to reorder
  - Preview full check-in flow
  - Publish
```

**Guardrails on AI Suggestions:**

- Agent will not suggest questions that could be used to surveil ICs beyond their work context (e.g., no questions about personal life, health, or off-hours behavior)
- Questions framed to feel conversational, not evaluative
- Manager can always override or write from scratch

---

#### 4.4.3 Check-In Preview

Before publishing a question set, managers can preview the full check-in experience as an IC would see it in Slack.

**Preview Mode:**

- Renders a simulated Slack DM conversation showing the agent's exact messages
- Manager can "respond" as a test IC and see how the agent handles follow-ups
- Shows estimated time to complete (target: under 2 minutes)
- Highlights any questions flagged as potentially confusing or too long

**Preview UI location:** Accessible via "Preview as IC" button in the Question Editor, opens in a right-side panel or modal.

---

#### 4.4.4 Question Performance Insights

After at least 2 check-in cycles, the Question Editor surfaces lightweight analytics per question to help managers improve their set.

| Metric              | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| Response rate       | % of ICs who answered this question                          |
| Avg response length | Signals engagement (very short may mean question is unclear) |
| Skip rate           | % who skipped or said "N/A"                                  |
| Sentiment signal    | For scale questions: avg score and trend over last 4 cycles  |

These are shown inline on each question row as small badges. No separate analytics page needed in v1.

---

#### 4.4.5 Question Set Versioning

Each time a manager publishes a change to the active question set, Ceptly saves a version snapshot.

- Versions are timestamped and labeled (e.g., "Updated May 19 — added burnout question")
- Manager can view prior versions and restore any previous set
- Digests reference the question set version active during that period, so historical data stays interpretable

---

### 4.5 Executive Dashboard & Strategy Agent (Web App)

**Role:** Primary executive surface — conversational strategy plus real-time data and charts.

**Behavior:**

- Main UI: chat with the **Strategy Agent** (natural language in/out; optional voice later)
- Agent responses can include inline or adjacent **visualizations**: team velocity, project timelines, budget burn, capacity heatmaps, sentiment trends, org-wide workload
- User can click charts to drill down or ask follow-ups ("Show me who's overloaded" → highlights people on roster/org view with supporting numbers)
- **Team Health** panel: color-coded team list; overloaded ICs in orange/red with one-line explanation (e.g. "Sarah — 4 active tickets, 3 after-hours Slack messages this week")
- Queries like "What's going on with Sarah?" return short, respectful summaries with suggested actions ("Reassign one ticket?" / "Schedule a quick sync?")
- Does not overshare personal detail or make ICs feel surveilled; summaries are work-context only

**Overload on executive side:** When capacity flags fire, exec sees Team Health + optional Strategy Agent narrative; agent suggests concrete actions, human always approves reassignment.

**Relationship to Slack:** Digests and alerts may still post to `#leadership-digest`; deep work and "show me the chart" flows live in the web app.

---

### 4.6 Future Agents (Post–MVP)

Documented for roadmap alignment; not all built in v1.

| Agent                         | Key behaviors                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategy**                  | Exec goals → OKRs, timelines, tradeoffs; asks clarifying questions; feeds Coordination agent                                                    |
| **Coordination & assignment** | Creates/updates/prioritizes Linear tickets; breaks vague goals into tasks with acceptance criteria; assigns by skills, workload, capacity score |
| **Communication**             | Channel/DM updates tailored per recipient (bullets vs context vs voice notes)                                                                   |
| **Feedback & culture**        | Pulse surveys, chat sentiment, burnout flags, values nudges                                                                                     |
| **Review**                    | First-pass code/design review; escalate edge cases                                                                                              |
| **Onboarding (HRIS)**         | On new hire in HR system: read role/team/skills → Linear profile, Slack channels, onboarding sequence                                           |

**Trust model (all phases):** Humans can override any agent action; critical decisions escalate; test per department before company-wide rollout.

---

### 4.7 Integrations

### Slack (v1)

Primary channel for IC check-ins, alerts, digests, and optional exec digests. See §5.

### Linear (Phase 2+)

- Create, update, and prioritize issues from executive/strategy input
- Break high-level goals into well-written tasks with acceptance criteria
- **Capacity signals:** in-progress count, estimates vs actuals, cycle time vs personal baseline
- **Performance signals:** completion rate, rework/review cycles, estimate accuracy
- Foundation for Coordination & assignment agent

### HRIS (Phase 3+)

- Webhook or poll on new hire: position, team, skills
- Triggers Onboarding agent: Linear user, Slack channels, scripted welcome/check-in sequence

### Company memory (ongoing)

- Vector store for docs, meeting notes, past projects, and agent outcomes (LangGraph/CrewAI-style orchestration when multi-agent flows land)
- Improves assignment and strategy quality over time

---

### 4.8 Capacity & Overload

**Purpose:** Answer "Who's overloaded?" with a **capacity score** per IC combining:

| Source        | Signals                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Linear**    | Active issues, estimate load, actual vs estimated duration, slowdown vs personal baseline         |
| **Slack**     | Response latency, after-hours activity, stress language ("swamped", "buried") — work-context only |
| **Check-ins** | Periodic 1–5 workload self-report (seconds to answer; trend over weeks)                           |

**IC experience when overloaded:**

1. Private, gentle Slack DM: e.g. "I've noticed a heavy load lately — want to talk about it?"
2. If yes: quick triage in Slack (what's heaviest, what could shift, what must stay)
3. Short summary to lead or Strategy Agent (configurable)
4. May suggest deprioritization or reassignment — **always confirms with IC before moving tickets**

**Executive experience:** Team Health list + drill-down via Strategy Agent; actionable suggestions without exposing raw private chat content.

---

### 4.9 Performance Tracking (IC)

**Purpose:** Fair, consistent, evidence-based profiles — not surveillance.

Combined automatically from:

| Source         | Signals                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| **Linear**     | Completion rate, quality/rework, estimate accuracy                            |
| **Reviews**    | First-pass approval rate on code/design review (when integrated)              |
| **Peer pulse** | Low-friction Slack prompts ("How was working with Alex on the last project?") |
| **Outcomes**   | Whether shipped work moved intended business metrics (when linked)            |
| **Check-ins**  | Morale, workload, blockers over time                                          |

Profiles update on a regular cadence (e.g. weekly). Executives query via Strategy Agent or dashboard ("How has Jordan been performing?"). **Out of scope for v1:** automated performance reviews or termination recommendations.

---

## 5. Slack Integration

### Workspace Setup

1. Founder installs the Slack app and authenticates
2. Designates `#leadership-digest` channel for digests and alerts
3. Invites the bot to team member DMs (or team members opt in via `/checkin start`)
4. Configures check-in schedule and team roster

### Slash Commands

| Command                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `/checkin start`        | IC opts into check-ins                          |
| `/checkin pause [days]` | IC pauses check-ins temporarily (PTO, etc.)     |
| `/digest now`           | Founder triggers an on-demand synthesis         |
| `/ask [question]`       | Founder queries the Q&A Agent                   |
| `/team status`          | Returns a quick snapshot of current team health |

### Permissions Model

| Role            | Can Do                                           |
| --------------- | ------------------------------------------------ |
| Founder / Admin | Full access: digests, alerts, Q&A, configuration |
| Team Lead       | Access to their direct team's digests and Q&A    |
| IC              | Check-in only; can view their own past responses |

---

## 6. Data Model (MVP + Roadmap)

```
User
  id, slack_id, linear_user_id (optional), name, role (founder | lead | ic), workspace_id, timezone
  capacity_score (computed), capacity_updated_at
  performance_profile_summary (computed, optional JSON)

QuestionSet
  id, workspace_id, version, created_at, published_at, created_by (user_id), label
  questions[] → Question (ordered)

Question
  id, question_set_id, text, type (open | scale | yes_no | multiple_choice),
  options[] (for multiple_choice), follow_up_prompt, skip_logic, is_active, order_index

CheckIn
  id, user_id, question_set_version_id, timestamp,
  responses[] { question_id, answer, response_length_chars }, workload_score, mood_score

Blocker
  id, user_id, check_in_id, description, status (open | resolved), created_at, resolved_at

Digest
  id, workspace_id, period_start, period_end, content (markdown), posted_at

Alert
  id, workspace_id, type, severity, message, triggered_at, resolved_at

-- Phase 2+
LinearConnection
  workspace_id, oauth_tokens, team_id, last_sync_at

LinearIssueSnapshot
  user_id, issue_id, state, estimate, completed_at, cycle_time_hours

CapacitySignal
  id, user_id, source (linear | slack | checkin), score_component, recorded_at

OverloadEvent
  id, user_id, detected_at, ic_contacted_at, triage_summary, resolved_at, exec_notified_at

-- Phase 3+
HRISConnection / HireEvent
  workspace_id, external_employee_id, role, team, skills[], hired_at
```

See [spec.md](./spec.md) for schedule fields, capacity computation notes, and dashboard API boundaries.

---

## 7. Tech Stack

| Layer                       | Choice                                          | Rationale                                                                                                                      |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Frontend / Config UI        | Next.js on Vercel                               | Fast to build, optimized Vercel deployment                                                                                     |
| Backend API                 | Node.js + Express on Render                     | Separate service, single trust boundary for all permissions                                                                    |
| Database                    | Render Postgres                                 | Managed Postgres, co-located with backend on Render                                                                            |
| ORM                         | Drizzle                                         | Type-safe queries, lightweight, pairs well with Postgres                                                                       |
| AI / Agents                 | Anthropic Claude API (claude-sonnet-4-20250514) | Conversational check-ins, Strategy Agent, synthesis                                                                            |
| Agent orchestration (later) | LangGraph or CrewAI                             | Multi-agent coordination when Strategy + Coordination ship                                                                     |
| Company memory (later)      | Vector DB                                       | Past projects, docs, who-is-good-at-what for assignment                                                                        |
| Slack Integration           | Slack Bolt SDK (Node)                           | Events, slash commands, IC and alert flows                                                                                     |
| Linear Integration (later)  | Linear API + OAuth                              | Tickets, capacity, performance signals                                                                                         |
| HRIS Integration (later)    | Provider API / webhooks                         | Onboarding trigger on new hire                                                                                                 |
| Job Scheduling              | Render Cron Jobs                                | Periodic HTTP trigger to Express `/internal/*` scheduler (see [spec.md](./spec.md)); per-workspace schedule stored in Postgres |

### Permissions Architecture

All role and permission checks are enforced exclusively in the **Express backend API layer**. The database is a dumb data store — no Row Level Security, no database-level access policies.

**Principles:**

- The frontend (Vercel/Next.js) never queries the database directly
- Every request from the frontend goes through the backend API
- The backend validates the requesting user's role and workspace before executing any query
- Render Postgres is only accessible from the backend service — not exposed publicly
- The backend is the single trust boundary for the entire application

**Request flow:**

```
Vercel (Next.js) → REST API request with auth token
  → Render (Express) → validate token → check role/permissions → query Render Postgres
                                                                 → return filtered response
  → Vercel (Next.js) ← response
```

---

## 8. MVP Scope

### In Scope (v1)

- Check-In Agent via Slack DM (configurable cadence)
- Synthesis Agent posting weekly digest to `#leadership-digest`
- Blocker alerts (real-time, on detection)
- Disengagement alerts (missed 2+ check-ins)
- Q&A Agent for founders via Slack DM
- Basic config UI: team roster, check-in schedule (days, time, frequency, timezone), channel selection
- **Question Editor (Next.js):**
  - Create, edit, reorder, toggle active/inactive questions
  - AI Question Suggester (goal → suggested question set)
  - Check-in preview ("Preview as IC")
  - Question set versioning
- **Executive dashboard (foundational):** Strategy Agent chat shell; Team Health placeholder; chart slots wired as data becomes available (check-in sentiment first)

### In Scope (Phase 2 — core management loop)

- Slack communication agents (richer tailored updates)
- **Linear integration:** ticket create/update, goal → tasks with acceptance criteria
- **Coordination loop:** task breakdown + assignment suggestions (human approve)
- **Capacity score** from Linear + check-ins + Slack signals; overload DM flow + exec Team Health
- Strategy Agent answers with inline charts (velocity, capacity heatmap)

### In Scope (Phase 3)

- HRIS-triggered onboarding agent
- Feedback & culture agent (pulses, sentiment, values nudges)
- Peer feedback prompts; performance profile rollups
- Review agent (first-pass); vector company memory

### Out of Scope (v1)

- Email or Teams integration
- Automated performance reviews or firing recommendations
- Full OKR product (strategy agent may draft OKRs later; not a standalone OKR tool in v1)
- Unsupervised ticket reassignment without IC consent
- Mobile native app
- Multi-workspace enterprise features
- SSO / SAML

---

## 9. Risks & Open Questions

| Risk                                          | Mitigation                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Low IC check-in completion                    | Keep questions short (<3 per session); make it feel like a chat, not a form        |
| ICs feeling surveilled                        | Transparent opt-in; IC can see their own data; no surveillance framing             |
| AI hallucinating IC responses                 | Q&A Agent only synthesizes from stored responses; never generates unsourced claims |
| Slack rate limits during large team check-ins | Stagger DM sends; use queue                                                        |
| Founders ignoring digests                     | Make digest scannable in <60 seconds; mobile-friendly formatting                   |

---

## 10. Build Phases

### Phase 1 — Core Loop (Weeks 1–4)

- Render: Web Service (Express) + Postgres + Cron Job → `/internal/checkin-scheduler`
- Slack app setup and OAuth
- Check-In Agent: DM flow, hardcoded default question set, response storage
- Workspace schedule in DB + secured cron scheduler (default Mon/Thu)
- Basic digest posted to channel (manual trigger)
- Test with 1 real team

### Phase 2 — Question Editor + Intelligence (Weeks 5–8)

- Next.js app scaffolding
- Question Editor: create, edit, reorder, toggle active questions
- AI Question Suggester (goal input → suggested set via Claude API)
- Check-in preview ("Preview as IC" panel)
- Synthesis Agent: automated digest on schedule
- Blocker + disengagement alerts
- Q&A Agent (basic)

### Phase 3 — Polish & Retention (Weeks 9–12)

- Question performance insights (response rate, skip rate, avg length)
- Question set versioning + restore
- Trend tracking (workload/sentiment over time)
- Adaptive follow-up questions based on prior responses
- IC opt-in/pause commands
- Onboarding flow for new workspaces

### Phase 4 — Linear & Capacity (Weeks 13–18)

- Linear OAuth and issue sync
- Capacity score pipeline; overload detection + IC triage flow
- Executive dashboard: capacity heatmap, "who's overloaded" drill-down
- Strategy Agent + chart responses for capacity/velocity

### Phase 5 — Assignment & HR (Weeks 19+)

- Executive goal → Linear ticket breakdown (Strategy + Coordination agents)
- Assignment suggestions with human override
- HRIS webhook → onboarding agent
- Peer pulse + performance profile summaries

---

## 11. Open Questions

- [ ] Should ICs see the digest, or only founders/leads?
- [ ] How do we handle contractors vs full-time employees in the roster?
- [ ] What's the right default check-in frequency — 2x/week may feel like too much for some teams
- [x] Do we want a web dashboard at all in v1, or stay fully Slack-native?
  - **Yes** — executives use the web app for Strategy Agent chat and charts; Slack remains primary for ICs and digests.
- [ ] Which chart library and auth pattern for exec-only dashboard routes?
- [ ] Linear: workspace-level OAuth vs per-user?
- [ ] HRIS vendor for first integration (Rippling, Gusto, etc.)?
- [ ] Slack "stress language" detection: keyword list vs classifier; privacy review
- [ ] How do we handle very small teams (2–5 people) where patterns are harder to detect?
- [ ] Should managers be able to assign different question sets to different team members or sub-teams?
- [ ] How do we handle question set changes mid-sprint — do we notify ICs?
- [ ] Should the AI Suggester have preset goal templates (e.g. "sprint health", "culture pulse", "project risk") to speed up onboarding?
