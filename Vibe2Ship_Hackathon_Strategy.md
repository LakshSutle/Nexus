# Vibe2Ship Hackathon: Complete Strategy & Execution Plan
### Product: **NEXUS — The Autonomous Execution Operating System**
---

> Written from the combined perspective of a FAANG Staff Engineer, YC Partner, VC, Hackathon Judge, and Agentic AI Researcher. Every assumption is challenged before it is accepted.

---

## DELIVERABLE 1 — IDEA VALIDATION

### Challenging the Core Assumptions

**Assumption 1: "The core problem is execution, not awareness."**
Partially true — but dangerously incomplete. Research on behavioral change (BJ Fogg, James Clear) shows execution failure has three root causes: unclear next actions, insufficient motivation, and structural friction. An AI that handles scheduling and replanning addresses structural friction but does nothing for motivation. If users don't want to do the thing, no AI will make them. This is the single biggest adoption risk.

**Assumption 2: "Users will trust an AI to manage their execution."**
Weak. High-stakes users (professionals, students under exam stress, founders) are deeply anxious about their systems. They will second-guess the AI, override it constantly, and blame it when things fail. The product must be designed so that the user feels in control even when the AI is doing most of the work.

**Assumption 3: "This is different from a task manager."**
This is the right instinct but the hardest thing to prove. Motion.ai and Reclaim.ai already do AI-powered scheduling. Notion AI already does document understanding. The differentiation must be in *agentic depth* — not in feature lists but in the system's ability to detect that something is going wrong and intervene *before* it becomes a crisis. That is genuinely novel.

**Assumption 4: "Students, professionals, and entrepreneurs have the same core need."**
False. Students have deadlines imposed externally. Professionals have accountability to others. Entrepreneurs define their own deadlines and often avoid accountability altogether. The AI's intervention style must differ for each persona.

**Assumption 5: "Free-tier tools can support this."**
True for the hackathon. Risky long-term. Gemini's free tier (1.5 Pro: 50 RPD on free) will be hit quickly with an agentic system making multiple LLM calls per user session. Architecture must batch LLM calls aggressively.

---

### Biggest Weaknesses

1. **Cold start problem**: Without data on the user's behavior, the AI's first plans are just educated guesses. The wow moment must be strong enough to get users to the point where the AI has enough data to be genuinely useful.
2. **Context window cost**: Processing a full syllabus or PRD with Gemini Long Context is expensive even on free tier.
3. **Trust erosion**: One bad replan — especially around a real deadline — and the user abandons the product entirely.
4. **Notification fatigue**: An AI that intervenes "proactively" becomes a source of stress, not relief, if the interventions are poorly timed or inaccurate.

---

### Biggest Opportunities

1. **The Gemini 1.5/2.0 long context window is genuinely underused in this category.** Nobody has built a product that ingests a 300-page syllabus and produces a day-by-day, topic-by-topic study plan that automatically adjusts as the exam approaches. This is achievable and demonstrable.
2. **Agentic replanning as a first-class feature.** Every competitor treats replanning as a side effect. Make it the hero: "NEXUS detected you're 2 days behind on your thesis. Here's the new plan."
3. **The failure prediction angle is unexplored.** No productivity tool currently says "you are 73% likely to miss this deadline based on your current pace." This is both technically feasible and viscerally compelling in a demo.

---

### Improved Concept

Remove: generic task management, reminder spam, calendar sync complexity.

Add: **Execution Health Score** (a single number reflecting a user's trajectory toward their goal), **Failure Prediction Engine** (probabilistic, based on pace vs. required pace), and **One-Tap Rescue Plans** (when the AI detects failure risk, it doesn't just alert — it presents a revised plan the user can accept in one tap).

The product is repositioned as: **"Your AI that tells you when you're going to fail, and fixes it before you do."**

---

## DELIVERABLE 2 — PRODUCT POSITIONING

### Product Category
**Autonomous Execution Intelligence** — a new category that sits between AI assistants (reactive, conversational) and project management tools (manual, static).

### Positioning Statement
> NEXUS is the first AI that doesn't just help you plan — it monitors your execution in real time, predicts when you're going to miss a deadline before you do, and automatically restructures your roadmap to get you back on track. Not a calendar. Not a task manager. A co-pilot for finishing things.

### Unique Value Proposition
The core UVP is **proactive failure prevention**. Every other tool tells you what to do. NEXUS tells you what's about to go wrong and fixes it.

### Why Users Would Switch

| Tool | Their Gap | NEXUS Advantage |
|---|---|---|
| Google Calendar | Dumb time slots, no intelligence | Intelligent scheduling that accounts for cognitive load, task dependencies, and pace |
| Notion | Brilliant for capture, terrible for execution | Execution-first, not document-first; AI does the work of structuring the plan |
| Todoist | Tasks with no context | Goals → milestones → tasks, with automatic decomposition |
| ClickUp | Overwhelming complexity | Radical simplicity at the front; complexity lives inside the AI |
| Motion | Reschedules tasks, no failure prediction | Not just reschedules — detects and predicts failure risk |
| Reclaim.ai | Calendar focus only | Full lifecycle from goal intake to completion |
| ChatGPT | Stateless conversation | Persistent, context-aware, proactive agent with memory of your goals |

### Category Creation Strategy
Coin the term **"Execution Intelligence"** — distinct from productivity (about doing), project management (about coordinating), and AI assistants (about responding). Own the phrase in every touchpoint.

### Brand Strategy
Name: **NEXUS** — the point of connection between intention and action.
Voice: Direct, confident, never anxious. "Here's what's happening. Here's what to do."
Visual: Clean, data-forward, mission-control aesthetic. Think NASA ops center meets Notion's whitespace.

---

## DELIVERABLE 3 — COMPETITIVE ANALYSIS

### What 80% of Participants Will Build
AI-powered task managers with a chat interface. User types "I have an exam in 2 weeks," AI generates a bullet list of tasks. Essentially ChatGPT with a to-do list UI. These will be immediately forgettable. The AI is reactive, the output is static, and there is no execution tracking.

### What 15% Will Build
Something more sophisticated: document upload (syllabus, PRD) → AI-generated plan → basic progress tracking. Some will add calendar export. A few will add a daily briefing email. These are meaningfully better but still fail at the "agentic" criterion because the AI acts once at setup and then goes silent.

### What the Top 5% Will Build
Multi-agent pipelines with genuine runtime behavior: an agent that tracks progress, another that detects drift, another that replans. Some will attempt integrations (Google Calendar, Notion). The best will have a genuinely compelling demo moment. **This is where NEXUS must live — and must exceed.**

### Saturated Ideas (Avoid)
- AI study planner
- AI journal / reflection tool
- AI reminder + calendar sync
- AI Pomodoro timer
- AI note-taker with action items

### White-Space Opportunities (Pursue)
- **Failure prediction with confidence scores** — nobody is building this
- **Proactive intervention with one-tap acceptance** — nobody is building this
- **Execution Health Score as a persistent, visible metric** — nobody is building this
- **Agentic replanning that shows its reasoning** — "I moved your thesis section to Thursday because you spent 4 hours on Chapter 1 instead of 2" — nobody is building this

### Key Differentiation Axis
Most competitors compete on *planning quality*. NEXUS competes on *execution monitoring and recovery*. This is a completely different problem.

---

## DELIVERABLE 4 — USER RESEARCH

### Persona 1: The Student — "Priya"

**Profile**: 21-year-old CS student, 4 active courses, side project, part-time job.

**Goals**: Pass exams, finish assignments before late penalties, build portfolio.

**Frustrations**: Everything feels equally urgent. Studies late, cramming the night before. "I knew I should have started earlier."

**Current Workflow**: Notion for notes, Google Calendar for class times, brain for everything else.

**Pain Points**: No system for translating a syllabus into a study schedule. Can't see which deadlines are about to slip until it's too late. Existing reminders are ignored because they're not contextual.

**Success Metrics**: Submits on time, sleeping better the night before exams, feeling "ahead" rather than "behind."

**Key Insight**: Priya needs the AI to do the cognitive work of breaking down a syllabus and building a calendar. She doesn't need more reminders — she needs a system that makes her feel like she's on track.

---

### Persona 2: The Professional — "Marcus"

**Profile**: 34-year-old product manager at a mid-size SaaS company. 3 active projects, 12 stakeholders, weekly exec reviews.

**Goals**: Ship quarterly roadmap items, stay ahead of blockers, look credible in exec meetings.

**Frustrations**: Too many context switches. Project tracking is manual and falls behind. Misses dependencies until they become fires.

**Current Workflow**: Jira for team tasks, Notion for personal notes, Slack for everything, Google Calendar for meetings.

**Pain Points**: No single view of his personal commitments vs. project health. Can't see impact of a week of meetings on his own deliverables. Context-switches destroy his deep work.

**Success Metrics**: Delivers on commitments, fewer last-minute surprises, feels organized rather than reactive.

**Key Insight**: Marcus needs the AI to track his personal accountability separate from team tracking tools. He needs "what am I personally at risk of missing this week?"

---

### Persona 3: The Entrepreneur — "Samira"

**Profile**: 28-year-old building a B2B SaaS product, solo founder, pre-revenue.

**Goals**: Launch MVP, get first 10 customers, raise a pre-seed round.

**Frustrations**: Everything is self-defined — no external deadlines, so no urgency until crisis. Switches between building, selling, and fundraising without a system.

**Current Workflow**: Linear for bugs, Notion for strategy, calendar for investor calls.

**Pain Points**: No accountability mechanism. Plans fall apart after the first week. Can't see if she's spending time on the right things. "I'm busy but I'm not sure I'm moving the needle."

**Success Metrics**: Achieving weekly milestones, measurable progress toward launch, feeling of controlled momentum.

**Key Insight**: Samira needs an external accountability system since she has no boss or team to answer to. The AI functions as her chief of staff and board of one.

---

## DELIVERABLE 5 — PRODUCT REQUIREMENTS DOCUMENT

### Executive Summary
NEXUS is an Autonomous Execution Intelligence platform that transforms goals into managed outcomes. Users provide goals, deadlines, and optional supporting documents. NEXUS extracts tasks, builds roadmaps, schedules work, monitors execution in real time, predicts failure risks, and replans proactively — with minimal ongoing user input.

### Vision
A world where the gap between intention and completion is closed by AI.

### Mission
To give every student, professional, and entrepreneur the kind of systematic execution support that was previously only available to people with a dedicated chief of staff.

### Goals
1. Reduce missed deadlines by 60% vs. baseline for active users.
2. Eliminate the cognitive overhead of planning and scheduling.
3. Surface execution risks before they become crises.
4. Create a product that judges recognize as genuinely novel and startup-worthy.

### Problem Statement
The execution gap — the space between "I know what needs to be done" and "it is done" — is the defining productivity failure of the modern era. Existing tools address awareness but not execution continuity. They are static plans in a dynamic world.

### Success Metrics
- Onboarding completion rate > 80%
- Goals that reach completion > 60%
- Average time-to-first-plan < 2 minutes
- User NPS > 50 at 30 days
- Demo wow moment triggered within 60 seconds

### User Stories

**Core Stories**
- As a student, I want to upload my syllabus and immediately see a week-by-week study plan so that I don't have to manually figure out what to study when.
- As a professional, I want to be told when a commitment I made is at risk so I can address it before it becomes a problem.
- As an entrepreneur, I want my AI to hold me accountable to my weekly milestones and tell me when I'm falling behind.
- As any user, I want the AI to detect that I've been slower than expected and automatically offer a revised plan.
- As any user, I want a single number (Execution Health Score) that tells me at a glance how I'm doing.

**Edge Case Stories**
- As a user with conflicting deadlines, I want the AI to help me triage and decide what to deprioritize.
- As a user who has completely abandoned a goal, I want the AI to archive it without judgment and without breaking my other plans.
- As a user whose plan was derailed by an external event (illness, meeting overload), I want the AI to recognize the disruption and offer a compassionate recovery plan.

### Functional Requirements

**FR-001**: Goal Intake — System accepts text goals, deadlines, available hours, and optional document uploads.

**FR-002**: Document Processing — System parses uploaded PDFs/docs to extract topics, requirements, and implicit milestones.

**FR-003**: Task Decomposition — System converts goals into task hierarchies: Goal → Milestones → Tasks → Subtasks.

**FR-004**: Intelligent Scheduling — System generates a calendar-aware schedule respecting user's available hours, cognitive load patterns, and task dependencies.

**FR-005**: Execution Tracking — System allows users to mark tasks complete and logs timestamps.

**FR-006**: Velocity Calculation — System computes actual pace vs. required pace per goal.

**FR-007**: Failure Prediction — System outputs probability scores for each active goal based on velocity, remaining work, and time remaining.

**FR-008**: Proactive Intervention — When failure probability exceeds threshold (default 60%), system surfaces an intervention card with a revised plan option.

**FR-009**: One-Tap Replanning — User can accept a revised plan with a single interaction.

**FR-010**: Execution Health Score — System computes a composite score (0–100) reflecting overall execution trajectory.

**FR-011**: Daily Focus View — System surfaces the 3 most critical tasks for the current day.

**FR-012**: AI Insights — System generates weekly insights: patterns, risk factors, recommendations.

### Non-Functional Requirements

- Response time for plan generation < 10 seconds
- System available 99.5% uptime
- Works on mobile (responsive design)
- Handles documents up to 50 pages
- HTTPS encryption for all data

### Edge Cases

- User uploads a document in a language other than English (handle via Gemini multilingually)
- User sets an impossible deadline (fewer hours available than tasks require) — surface warning immediately
- User marks 100% of tasks complete but deadline is weeks away — prompt to add stretch goals
- User abandons app for 7+ days — send re-engagement email with goal status summary

### Constraints

- All services must have free tiers sufficient for hackathon demo
- No native mobile app (PWA only for hackathon)
- No real-time collaboration in V1

### Assumptions

- Users have reliable internet access
- Users' primary language is English (multilingual is a stretch goal)
- Users have Google accounts for auth

---

## DELIVERABLE 6 — AGENTIC AI ARCHITECTURE

### Architecture Overview: The NEXUS Agent Mesh

NEXUS operates as an **orchestrated multi-agent system** where a Master Orchestrator routes tasks to specialized sub-agents and aggregates their outputs. All agents share a persistent state store (the Goal Context Object) and communicate via an event-driven message bus.

---

### Agent 1: Goal Ingestion Agent (GIA)

**Responsibility**: Transforms raw user input (text goals, deadlines, available hours, uploaded documents) into a structured Goal Context Object.

**Inputs**:
- Raw goal text (string)
- Deadline (ISO date)
- Weekly hours available (number)
- Uploaded documents (PDF, DOCX, images)

**Outputs**:
- Goal Context Object (structured JSON):
  - Goal summary
  - Extracted topics/sections (from documents)
  - Implicit milestones
  - Constraints
  - Estimated complexity score

**Internal Reasoning**:
Uses Gemini 1.5 Pro with long context to process uploaded documents. Structured output (JSON mode) ensures clean downstream consumption. Extracts:
1. What the user is trying to achieve
2. What external structure exists (syllabus sections, PRD requirements, project phases)
3. What's already known vs. unknown

**Failure Handling**: If document parsing fails, falls back to text-only goal decomposition. Alerts user that document parsing was partial.

---

### Agent 2: Task Decomposition Agent (TDA)

**Responsibility**: Converts Goal Context Objects into hierarchical task trees.

**Inputs**: Goal Context Object from GIA

**Outputs**:
- Task hierarchy: Goal → Milestones → Tasks → Subtasks
- Effort estimates per task (hours)
- Dependency graph
- Critical path

**Internal Reasoning**:
Uses chain-of-thought prompting to:
1. Identify major milestones (what are the "chapters"?)
2. Break milestones into concrete tasks ("Read Chapter 3" not "Study chemistry")
3. Estimate effort based on task type and content depth
4. Identify task dependencies (Task B cannot start before Task A completes)

**Failure Handling**: If decomposition produces fewer than 5 tasks for a complex goal, triggers re-decomposition with increased depth prompt.

---

### Agent 3: Scheduling Agent (SA)

**Responsibility**: Maps the task tree onto the user's calendar respecting constraints.

**Inputs**:
- Task tree + effort estimates from TDA
- User's available hours (by day of week)
- Fixed commitments (if calendar connected)
- Current date

**Outputs**:
- Day-by-day schedule: date → task(s)
- Buffer days built in at 20% of total time
- Weekly milestones checkpoints
- Warning flags for impossible schedules

**Internal Reasoning**:
Applies constraint satisfaction logic:
1. Reverse-schedule from deadline (start from end date, work backwards)
2. Allocate cognitive-heavy tasks to user's stated "peak hours"
3. Distribute work to prevent single-day spikes
4. Insert buffer days before major milestones
5. Flag if total required hours exceed available hours

**Failure Handling**: If schedule is impossible (hours deficit > 20%), surfaces immediate warning to user with options: reduce scope, extend deadline, increase daily hours.

---

### Agent 4: Progress Tracking Agent (PTA)

**Responsibility**: Monitors task completion events and updates execution state.

**Inputs**:
- Task completion events (user-triggered)
- Timestamps
- Current schedule from SA
- Historical completion velocity

**Outputs**:
- Completed task log
- Actual vs. planned velocity (tasks/day)
- Updated "tasks remaining" count
- Estimated completion date at current pace

**Internal Reasoning**:
Runs on a lightweight compute loop (not full LLM — uses deterministic calculation):
1. On task completion: update completed count, log timestamp
2. Compute velocity: tasks completed / days elapsed
3. Compare to required velocity: tasks remaining / days remaining
4. If actual < required by >20%, flag to Failure Prediction Agent

**Failure Handling**: If user hasn't logged any activity in 48h, triggers an "Are you still on track?" check-in.

---

### Agent 5: Failure Prediction Agent (FPA)

**Responsibility**: Computes probabilistic failure risk for each active goal.

**Inputs**:
- Velocity data from PTA
- Schedule from SA
- Historical user completion patterns
- Days remaining to deadline

**Outputs**:
- Failure probability score (0–100%) per goal
- Contributing risk factors (e.g., "velocity 40% below required," "3 high-effort tasks in next 2 days")
- Time-to-failure estimate ("At current pace, you will miss deadline by 4 days")

**Internal Reasoning**:
Hybrid approach — deterministic velocity math + LLM interpretation:
1. Velocity gap calculation (deterministic)
2. Risk factor extraction (LLM: "What are the 3 biggest risks to this goal right now?")
3. Probability score calibration based on historical patterns
4. Narrative explanation generation

**Failure Handling**: If insufficient data for reliable prediction (< 3 days of tracking), outputs "Insufficient data — check back in 3 days" rather than a noisy early estimate.

---

### Agent 6: Replanning Agent (RPA)

**Responsibility**: Generates revised plans when failure risk exceeds threshold.

**Inputs**:
- Failure probability from FPA
- Remaining tasks from PTA
- Available hours remaining
- User preferences (if any: "I can do extra hours on weekends")

**Outputs**:
- Revised schedule (day-by-day)
- Explanation of changes ("I moved X to Thursday because...")
- Scope reduction options ("If you drop subtask Y, you recover 3 hours")
- One-tap accept/decline

**Internal Reasoning**:
1. Re-run scheduling algorithm with updated remaining tasks
2. Identify 2–3 plan variants (aggressive catch-up, moderate catch-up, scope reduction)
3. Use LLM to generate human-readable explanation of each variant
4. Present the single best recommendation with alternatives visible

**Failure Handling**: If no viable replan exists (deadline is tomorrow, 5 days of work remaining), generates an honest assessment: "This goal is at critical risk. Here are your options: [scope reduction / deadline extension / triage]."

---

### Agent 7: Intervention Agent (IA)

**Responsibility**: Decides *when* and *how* to surface interventions to the user.

**Inputs**:
- Failure probability from FPA
- User notification preferences
- Time of day
- Last intervention timestamp (prevent fatigue)

**Outputs**:
- Intervention card (type: warning / critical / recovery)
- Timing decision (now / morning / evening)
- Message content
- Action options presented to user

**Internal Reasoning**:
Applies suppression logic to prevent notification fatigue:
1. Never send more than 1 intervention per goal per 24h
2. Prefer morning delivery (7–9am user local time)
3. Escalate tone as failure probability increases (warning → critical → emergency)
4. After 3 ignored interventions, switch from push to in-app only

---

### Agent 8: Insight Agent (InsA)

**Responsibility**: Generates weekly execution intelligence reports.

**Inputs**:
- Full task completion history
- Failure events
- Recovery events
- Time allocation patterns

**Outputs**:
- Weekly insight narrative ("You complete tasks 40% faster in the morning")
- Pattern identification ("You consistently underestimate research tasks")
- Behavioral recommendations
- Progress celebration moments

**Internal Reasoning**:
Uses LLM to translate raw data into human-meaningful insights. Not prediction — reflection. Runs once per week, not in real-time.

---

### Agent 9: Master Orchestrator (MO)

**Responsibility**: Routes tasks between agents, manages state, handles concurrency.

**Inputs**: All user events + scheduled triggers

**Outputs**: Coordinated agent calls + state updates

**Communication Flow**:
```
User Action → MO → GIA (on new goal)
                 → TDA (after GIA)
                 → SA (after TDA)
                 → PTA (on task completion)
                 → FPA (on schedule update, every 6h)
                 → RPA (when FPA > threshold)
                 → IA (when RPA produces replan)
                 → InsA (weekly cron)
```

---

### Architecture Diagram (Text Form)

```
┌─────────────────────────────────────────────────┐
│                  USER INTERFACE                  │
│  Goal Intake | Dashboard | Focus View | Insights │
└──────────────────────┬──────────────────────────┘
                       │ Events
┌──────────────────────▼──────────────────────────┐
│              MASTER ORCHESTRATOR (MO)            │
│         Event Router | State Manager             │
└──┬────────┬────────┬────────┬────────┬──────────┘
   │        │        │        │        │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│ GIA │ │ TDA │ │ SA  │ │ PTA │ │ FPA │
│Goal │ │Task │ │Sched│ │Track│ │Pred.│
│Ing. │ │Dec. │ │     │ │     │ │     │
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │        │        │        │        │
   └────────┴────────┴────────┴────────┤
                                  ┌──▼──┐ ┌──────┐ ┌──────┐
                                  │ RPA │ │  IA  │ │ InsA │
                                  │Repl.│ │Interv│ │Insig.│
                                  └──┬──┘ └──┬───┘ └──┬───┘
                                     └───────┴─────────┘
                                           │
                              ┌────────────▼────────────┐
                              │    GOAL CONTEXT STORE    │
                              │  PostgreSQL + pgvector   │
                              └─────────────────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │      GEMINI API          │
                              │  1.5 Pro + 2.0 Flash     │
                              └─────────────────────────┘
```

---

## DELIVERABLE 7 — FEATURE BRAINSTORM

*(100 features scored on Innovation/Demo Value/Judge Impact/Startup Potential/Build Difficulty, all out of 5)*

| # | Feature | Innov | Demo | Judge | Startup | Build | Total |
|---|---|---|---|---|---|---|---|
| 1 | Failure Probability Score per goal | 5 | 5 | 5 | 5 | 3 | 23 |
| 2 | One-tap Rescue Plan acceptance | 5 | 5 | 5 | 5 | 3 | 23 |
| 3 | Document upload → instant plan (syllabus/PRD) | 4 | 5 | 5 | 5 | 3 | 22 |
| 4 | Execution Health Score (0-100) | 5 | 5 | 4 | 5 | 2 | 21 |
| 5 | AI explains *why* it replanned | 5 | 5 | 4 | 4 | 3 | 21 |
| 6 | "You're 4 days behind. Here's what to do." intervention card | 4 | 5 | 5 | 4 | 3 | 21 |
| 7 | Agentic replan that shows reasoning chain | 5 | 5 | 5 | 4 | 4 | 23 |
| 8 | Daily 3-task Focus View with priority reasoning | 4 | 4 | 4 | 4 | 2 | 18 |
| 9 | Goal decomposition from free-text input | 3 | 4 | 4 | 4 | 2 | 17 |
| 10 | Milestone timeline visualization | 3 | 4 | 4 | 4 | 2 | 17 |
| 11 | "At current pace, you finish on [date]" projection | 4 | 5 | 4 | 4 | 2 | 19 |
| 12 | Weekly AI insight report | 4 | 3 | 4 | 4 | 3 | 18 |
| 13 | Scope reduction suggestions ("Drop X, save 3 hours") | 4 | 4 | 4 | 4 | 3 | 19 |
| 14 | Cognitive load-aware scheduling ("heavy tasks in AM") | 4 | 3 | 4 | 4 | 3 | 18 |
| 15 | Voice goal intake (speak your goal) | 3 | 4 | 4 | 3 | 3 | 17 |
| 16 | Multi-goal priority triage | 4 | 4 | 4 | 4 | 3 | 19 |
| 17 | Impossible deadline warning at intake | 3 | 4 | 3 | 4 | 1 | 15 |
| 18 | "AI Chief of Staff" weekly briefing | 4 | 4 | 4 | 4 | 3 | 19 |
| 19 | Task velocity tracking (tasks/day) | 3 | 3 | 3 | 4 | 2 | 15 |
| 20 | Buffer day auto-insertion | 3 | 3 | 3 | 4 | 2 | 15 |
| 21 | Calendar view of scheduled tasks | 2 | 3 | 3 | 3 | 2 | 13 |
| 22 | Dark mode | 1 | 2 | 1 | 1 | 1 | 6 |
| 23 | Google Calendar sync | 2 | 3 | 3 | 3 | 4 | 15 |
| 24 | Notion integration | 2 | 2 | 2 | 3 | 4 | 13 |
| 25 | Email digest of daily tasks | 2 | 2 | 3 | 3 | 2 | 12 |
| 26 | Dependency graph visualization | 3 | 4 | 3 | 3 | 3 | 16 |
| 27 | Critical path highlighting | 3 | 3 | 3 | 3 | 3 | 15 |
| 28 | Pomodoro timer integration | 1 | 2 | 1 | 2 | 2 | 8 |
| 29 | "Why this task today?" AI explanation | 4 | 4 | 4 | 4 | 2 | 18 |
| 30 | Progress bar per milestone | 2 | 3 | 2 | 3 | 1 | 11 |
| 31 | AI-generated motivational message at task completion | 2 | 2 | 2 | 2 | 1 | 9 |
| 32 | Goal completion celebration | 2 | 3 | 2 | 2 | 1 | 10 |
| 33 | Burndown chart per goal | 3 | 3 | 3 | 3 | 2 | 14 |
| 34 | Time spent vs. time estimated per task | 3 | 3 | 3 | 4 | 3 | 16 |
| 35 | AI-generated exam prep quiz from syllabus | 4 | 5 | 4 | 4 | 4 | 21 |
| 36 | Multi-persona mode (Student/Professional/Founder) | 3 | 3 | 3 | 4 | 2 | 15 |
| 37 | "Emergency mode" plan (12 hours to deadline) | 4 | 5 | 4 | 4 | 3 | 20 |
| 38 | Plan confidence score | 3 | 3 | 3 | 3 | 2 | 14 |
| 39 | Accountability partner feature | 3 | 3 | 4 | 4 | 4 | 18 |
| 40 | AI-detected procrastination pattern | 4 | 4 | 4 | 4 | 4 | 20 |
| 41 | Smart task duration estimation by type | 3 | 3 | 3 | 4 | 3 | 16 |
| 42 | Daily check-in prompt (30 seconds) | 2 | 3 | 3 | 3 | 1 | 12 |
| 43 | Retroactive task logging ("I actually did X yesterday") | 2 | 2 | 2 | 3 | 2 | 11 |
| 44 | Animated execution timeline | 3 | 4 | 3 | 3 | 3 | 16 |
| 45 | "Parallel goals" conflict detection | 4 | 4 | 4 | 4 | 3 | 19 |
| 46 | Priority override by user | 2 | 2 | 2 | 3 | 2 | 11 |
| 47 | AI-suggested deadline based on content complexity | 4 | 4 | 3 | 4 | 3 | 18 |
| 48 | Task postpone with automatic ripple effect | 4 | 4 | 4 | 4 | 3 | 19 |
| 49 | "What should I do next?" single button | 4 | 5 | 4 | 4 | 1 | 18 |
| 50 | Real-time plan health indicator (color-coded) | 3 | 4 | 3 | 3 | 2 | 15 |
| 51 | Agent transparency log (what agents did and why) | 5 | 5 | 5 | 4 | 3 | 22 |
| 52 | Week-ahead risk report | 3 | 3 | 4 | 4 | 2 | 16 |
| 53 | Custom intervention thresholds by user | 2 | 2 | 2 | 3 | 2 | 11 |
| 54 | AI-suggested task batching | 3 | 3 | 3 | 4 | 3 | 16 |
| 55 | Historical completion rate per task type | 3 | 3 | 3 | 4 | 2 | 15 |
| 56 | "Your most productive day is Wednesday" insight | 3 | 3 | 4 | 4 | 2 | 16 |
| 57 | Adaptive scheduling after plan acceptance | 4 | 4 | 4 | 5 | 3 | 20 |
| 58 | External deadline import (from syllabus PDF) | 4 | 5 | 4 | 4 | 3 | 20 |
| 59 | AI-detected scope creep | 4 | 4 | 4 | 4 | 4 | 20 |
| 60 | Onboarding with AI-guided goal setup | 3 | 4 | 3 | 3 | 2 | 15 |
| 61 | Mobile PWA with offline task logging | 2 | 3 | 2 | 4 | 3 | 14 |
| 62 | Streak tracking for consecutive on-plan days | 2 | 3 | 2 | 3 | 1 | 11 |
| 63 | AI-summarized goal status in one sentence | 4 | 4 | 4 | 4 | 1 | 17 |
| 64 | "Abandon goal" with AI-generated learning summary | 3 | 3 | 3 | 3 | 2 | 14 |
| 65 | Collaborative goal sharing (future) | 2 | 2 | 3 | 4 | 4 | 15 |
| 66 | Scheduled task complexity heatmap | 3 | 4 | 3 | 3 | 3 | 16 |
| 67 | Time estimation calibration from history | 4 | 3 | 4 | 5 | 3 | 19 |
| 68 | "What's most at risk right now?" single-query | 4 | 5 | 4 | 4 | 1 | 18 |
| 69 | AI-generated task sequencing rationale | 4 | 4 | 4 | 4 | 2 | 18 |
| 70 | Slack notification integration | 2 | 2 | 2 | 3 | 3 | 12 |
| 71 | Custom AI persona name/voice | 1 | 2 | 1 | 2 | 2 | 8 |
| 72 | Goal template library (Exam prep, Launch, etc.) | 3 | 3 | 3 | 4 | 2 | 15 |
| 73 | Multi-language support | 1 | 2 | 2 | 4 | 4 | 13 |
| 74 | Progress photo log per milestone | 1 | 2 | 1 | 2 | 2 | 8 |
| 75 | Skill gap identification from goal | 3 | 3 | 3 | 4 | 3 | 16 |
| 76 | AI-recommended learning resources for tasks | 3 | 3 | 3 | 4 | 3 | 16 |
| 77 | Meeting time detection and buffer scheduling | 3 | 3 | 3 | 4 | 4 | 17 |
| 78 | Waitlist and early access feature for MVP launch | 1 | 2 | 2 | 3 | 1 | 9 |
| 79 | Goal archive and re-activation | 2 | 2 | 2 | 3 | 2 | 11 |
| 80 | "Day in the life" preview for tomorrow | 3 | 4 | 3 | 3 | 2 | 15 |
| 81 | Execution score history (trend over time) | 3 | 3 | 3 | 4 | 2 | 15 |
| 82 | In-app chat with AI about any goal | 3 | 3 | 3 | 3 | 2 | 14 |
| 83 | API for external integrations | 2 | 2 | 3 | 5 | 4 | 16 |
| 84 | AI-written project retrospective | 3 | 3 | 3 | 3 | 2 | 14 |
| 85 | Anonymous benchmark ("Users like you average X tasks/day") | 3 | 3 | 3 | 4 | 3 | 16 |
| 86 | "Time bank" — saved hours from efficiency | 2 | 3 | 2 | 3 | 3 | 13 |
| 87 | AI narrator for demo mode | 4 | 5 | 5 | 3 | 3 | 20 |
| 88 | Shareable goal progress page | 2 | 2 | 3 | 4 | 2 | 13 |
| 89 | Agent activity feed (live log of what AI is doing) | 5 | 5 | 5 | 4 | 2 | 21 |
| 90 | Risk flag visual indicator on timeline | 3 | 4 | 4 | 4 | 2 | 17 |
| 91 | AI-generated SMART reformulation of vague goals | 4 | 4 | 4 | 4 | 2 | 18 |
| 92 | "One-thing focus" mode (show only next action) | 3 | 4 | 3 | 3 | 1 | 14 |
| 93 | Automatic deadline extension request draft | 3 | 3 | 3 | 3 | 2 | 14 |
| 94 | Pre-mortem analysis (AI predicts top failure modes at intake) | 5 | 5 | 5 | 5 | 3 | 23 |
| 95 | "Catch-up sprint" mode (intensive 48h plan) | 4 | 5 | 4 | 4 | 3 | 20 |
| 96 | Daily energy level input affecting scheduling | 3 | 3 | 3 | 4 | 3 | 16 |
| 97 | AI-generated plan comparison (plan A vs. plan B) | 4 | 4 | 4 | 4 | 3 | 19 |
| 98 | Webhook triggers for external tools | 2 | 2 | 3 | 4 | 4 | 15 |
| 99 | NPS prompt after goal completion | 1 | 1 | 2 | 3 | 1 | 8 |
| 100 | "Execution replay" — how the AI handled the goal (post-mortem) | 4 | 4 | 4 | 4 | 3 | 19 |

---

## DELIVERABLE 8 — FEATURE SELECTION

### Top 20 Features

Selected based on total score ≥ 18 AND strategic fit with hackathon differentiation:

1. Failure Probability Score per goal (23)
2. One-tap Rescue Plan acceptance (23)
3. Agentic replan with visible reasoning chain (23)
4. Pre-mortem analysis at goal intake (23)
5. Document upload → instant plan (22)
6. Agent transparency / activity feed (21)
7. AI-generated exam quiz from syllabus (21)
8. Execution Health Score (21)
9. AI intervention card with explanation (21)
10. "At current pace, finish on [date]" projection (19)
11. Scope reduction suggestions (19)
12. Multi-goal priority triage (19)
13. Parallel goals conflict detection (19)
14. Time estimation calibration from history (19)
15. Task postpone with automatic ripple effect (19)
16. AI-generated plan comparison (A vs. B) (19)
17. "AI Chief of Staff" weekly briefing (19)
18. Adaptive scheduling after plan acceptance (20)
19. "Emergency mode" plan (20)
20. "Catch-up sprint" mode (20)

---

### Top 10 Features

Refined to the ones that are both high-impact AND achievable within the hackathon:

1. Document upload → instant structured plan
2. Failure probability score with real-time update
3. Agentic replan with visible reasoning
4. One-tap rescue plan acceptance
5. Agent transparency / activity feed (shows AI "thinking")
6. Pre-mortem at goal intake ("Here are your 3 biggest risks")
7. Execution Health Score
8. Daily 3-task Focus View with AI reasoning
9. "At current pace" completion date projection
10. Intervention card with escalating urgency

---

### Top 5 MVP Features

The 5 features that together create the core demo moment and differentiate from 95% of competitors:

**MVP-1: Document Upload → Instant Plan**
This is the "holy shit" intake moment. Upload your syllabus, get a week-by-week study plan in 30 seconds. Demonstrates Gemini long context + structured output in one move.

**MVP-2: Failure Probability Score**
The number that changes everything. Every other tool shows progress. NEXUS shows risk. Judges will immediately understand this is different.

**MVP-3: Proactive Intervention Card + One-Tap Replan**
The agentic moment. The AI doesn't wait to be asked. It detects failure, surfaces a card, and offers a fixed plan. One tap. Done. This is the "wow."

**MVP-4: Agent Transparency Feed**
Shows that this is a *system*, not a chatbot. Judges see agents running, reasoning, communicating. This is the technical depth moment.

**MVP-5: Execution Health Score**
The single number. 0–100. Goes up when you complete tasks, goes down when you fall behind. Emotionally compelling, immediately understandable, uniquely positioned.

---

## DELIVERABLE 9 — HACKATHON KILLER FEATURE

### THE KILLER FEATURE: Live Agentic Replan with Transparent Reasoning

**The Feature in One Sentence:**
When NEXUS detects you're falling behind, it doesn't send a notification — it *shows you its agents working in real time*, produces a revised plan, explains every change in plain English, and lets you accept with one tap.

**Why It Wins:**

1. **It is demonstrably agentic.** Judges can *watch* agents running: the Failure Prediction Agent fires, triggers the Replanning Agent, which calls the Scheduling Agent, which produces a new plan. This is not a chatbot with a task list — it is a multi-agent system making decisions.

2. **It creates a visceral emotional response.** Watching an AI detect your failure risk in real time and fix your plan before you miss the deadline is *genuinely useful*. Judges will feel it.

3. **It is hard to replicate.** Most competitors will show a static plan. Showing a *live agent reasoning trace* while a plan is being rebuilt requires actual multi-agent architecture, which takes significant engineering. Most teams won't have it.

4. **It uses Google AI optimally.** Gemini's function calling and structured output power the agent-to-agent communication. The long context window processes the full goal context on every replan.

**How It Works:**

1. User is 3 days into a 14-day goal. They've completed 4 of 20 tasks (required pace: 1.4/day, actual: 1.3/day — borderline).
2. On Day 4, they complete only 0.5 tasks.
3. FPA fires: failure probability crosses 65% threshold.
4. Intervention Agent decides to surface an intervention.
5. UI displays the Agent Activity Feed showing:
   - "Failure Prediction Agent: Detected velocity at 0.9 tasks/day (required: 1.4). Probability of missing deadline: 68%."
   - "Replanning Agent: Analyzing remaining 16 tasks. Available hours: 22 over 10 days."
   - "Scheduling Agent: Generating revised schedule. Option A: Increase to 1.6 tasks/day. Option B: Remove 2 low-priority tasks."
   - "Intervention Agent: Surfacing rescue plan to user."
6. Intervention card appears: "You're 68% likely to miss this deadline. Here's a plan to get back on track." [Show revised schedule] [Accept in One Tap]

**How to Demo It:**

Pre-populate a demo account with a goal that's *already slightly behind* (Day 5 of 14, 4/20 tasks complete). Open the app. Show the Execution Health Score has dropped to 62. Show the intervention card that arrived this morning. Click to expand the agent reasoning feed. Read aloud: "This is the Replanning Agent figuring out how to fix my plan." Accept the revised plan. Score jumps to 74. Close.

Total demo time: 90 seconds. Judges will remember it.

**How to Build It:**

1. Store all agent events in a timestamped `agent_events` table.
2. On the frontend, poll the `agent_events` endpoint every 3 seconds.
3. Display events in a vertically scrolling feed with agent icon, timestamp, and message.
4. Trigger a real replan call when FPA score > 65.
5. Show the replan card with side-by-side: old plan vs. new plan.
6. "Accept" button writes new schedule to DB and recalculates Execution Health Score live.

---

## DELIVERABLE 10 — BUILD VS FUTURE

### Bucket A: Must Build During Hackathon

- Goal intake form (text + deadline + hours/week)
- Document upload → Gemini parsing → structured plan output
- Task decomposition and milestone creation
- Day-by-day schedule generation
- Task completion logging
- Velocity tracking (deterministic)
- Failure probability score (deterministic + LLM)
- Execution Health Score (0–100)
- Intervention card with one-tap replan
- Agent activity feed (live reasoning trace)
- Daily Focus View (top 3 tasks)
- Goal dashboard with timeline
- Authentication (Google OAuth)

### Bucket B: Demo-Only Features (Mock for Demo, Don't Build)

- AI-generated exam quiz from syllabus (mockable with static data)
- Weekly AI insight report (can show a static example card)
- Calendar view (show a mockup screenshot)
- "Emergency mode" (mockable via pre-seeded data)
- Pre-mortem at intake (show as part of onboarding flow in demo)

### Bucket C: Post-Hackathon Features (Build in First 30 Days)

- Google Calendar sync (read/write)
- Email notifications (daily briefing)
- Execution replay / retrospective
- Multi-goal conflict resolution
- Task batching suggestions
- Mobile PWA optimization
- Streak tracking
- Weekly AI insight report (fully real)

### Bucket D: Long-Term Startup Vision

- Collaborative goal spaces (team execution intelligence)
- Enterprise product (team-level execution dashboards)
- Native mobile app (iOS + Android)
- Integration marketplace (Jira, Linear, Asana, Notion)
- Execution benchmarking (anonymous industry comparisons)
- AI-powered quarterly planning
- Accountability partner network
- Voice-first interaction

---

## DELIVERABLE 11 — COMPLETE TECHNICAL ARCHITECTURE

### Frontend

**Framework**: Next.js 14 (App Router)
*Reasoning*: SSR for fast initial load, excellent developer experience, free on Vercel, best React ecosystem.*

**UI Library**: Shadcn/UI + Tailwind CSS
*Reasoning*: Production-quality components, zero lock-in, fast to customize, accessible.*

**State Management**: Zustand + React Query (TanStack Query)
*Reasoning*: Zustand for lightweight client state; React Query for server state, caching, and optimistic updates.*

**Charting**: Recharts
*Reasoning*: Simple, React-native, free, excellent for the score/velocity visualizations needed.*

**Animation**: Framer Motion
*Reasoning*: The agent activity feed and intervention card entrance animations require smooth, programmable motion.*

---

### Backend

**Framework**: FastAPI (Python)
*Reasoning*: Native async support for multi-agent calls; Gemini Python SDK is first-class; excellent for building agent pipelines; free to host on Railway/Render.*

**Agent Orchestration**: LangGraph (LangChain)
*Reasoning*: Purpose-built for multi-agent state machines. Allows defining agent communication as a directed graph with conditional edges. Directly matches the NEXUS architecture.*

**Background Jobs**: APScheduler (in-process)
*Reasoning*: Sufficient for hackathon. Runs FPA every 6h and InsA weekly as background tasks.*

---

### Database

**Choice**: Supabase (PostgreSQL + Auth + Storage)
*Reasoning*: 
- Free tier: 500MB database, 1GB storage, unlimited auth
- PostgreSQL gives full relational queries for complex goal/task relationships
- Built-in auth means zero auth infrastructure to build
- Row-level security for multi-user data isolation
- pgvector extension available for future semantic search on goals

---

### Authentication

**Choice**: Supabase Auth with Google OAuth
*Reasoning*: Zero-cost, zero-config, gives Google account login in 30 minutes. Google OAuth also opens path to Google Calendar API access in future.*

---

### Storage

**Choice**: Supabase Storage
*Reasoning*: Document uploads (syllabus PDFs, PRDs) stored in Supabase buckets. Free tier handles hackathon demo volume. Files accessed server-side for Gemini processing.*

---

### AI / LLM

**Primary**: Google Gemini 1.5 Pro (via `google-generativeai` Python SDK)
- Document parsing (long context up to 1M tokens)
- Task decomposition
- Replanning
- Insight generation

**Secondary**: Gemini 2.0 Flash (for fast, lightweight calls)
- Intervention message generation
- Quick task classification
- Health score narrative

**Structured Output**: Gemini's JSON mode for all agent-to-agent communication

---

### Deployment

**Frontend**: Vercel (free tier, auto-deploys from GitHub)

**Backend**: Railway (free tier: $5/month credit = 500MB RAM, sufficient for demo)

**Database**: Supabase (free tier)

**Domain**: Vercel default subdomain for demo

---

## DELIVERABLE 12 — DATABASE DESIGN

### Core Entities and Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  persona TEXT CHECK (persona IN ('student', 'professional', 'entrepreneur')),
  peak_hours TEXT DEFAULT 'morning',  -- morning/afternoon/evening
  daily_available_hours FLOAT DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  daily_hours_available FLOAT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  failure_probability FLOAT DEFAULT 0.0,
  execution_health_score INT DEFAULT 100,
  document_url TEXT,
  document_parsed_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  sequence_order INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  title TEXT NOT NULL,
  description TEXT,
  estimated_hours FLOAT NOT NULL DEFAULT 1.0,
  actual_hours FLOAT,
  scheduled_date DATE,
  sequence_order INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution Snapshots (velocity tracking)
CREATE TABLE execution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  tasks_completed INT DEFAULT 0,
  tasks_remaining INT DEFAULT 0,
  velocity_actual FLOAT DEFAULT 0.0,   -- tasks/day
  velocity_required FLOAT DEFAULT 0.0, -- tasks/day to hit deadline
  failure_probability FLOAT DEFAULT 0.0,
  health_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Events (for transparency feed)
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'analysis', 'decision', 'action', 'warning'
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interventions
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL,  -- 'warning', 'critical', 'rescue'
  failure_probability FLOAT NOT NULL,
  message TEXT NOT NULL,
  proposed_plan JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  content JSONB NOT NULL,  -- structured insight object
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Indexes

```sql
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_execution_snapshots_goal_date ON execution_snapshots(goal_id, snapshot_date);
CREATE INDEX idx_agent_events_goal_id ON agent_events(goal_id);
CREATE INDEX idx_interventions_goal_status ON interventions(goal_id, status);
```

---

## DELIVERABLE 13 — API DESIGN

### Core Endpoints

```
POST   /api/goals                    Create a new goal
GET    /api/goals                    List all user goals
GET    /api/goals/{id}               Get a single goal with tasks
DELETE /api/goals/{id}               Archive a goal

POST   /api/goals/{id}/upload        Upload a document for a goal
POST   /api/goals/{id}/generate      Trigger full plan generation (GIA → TDA → SA)
POST   /api/goals/{id}/replan        Trigger manual replan

GET    /api/goals/{id}/tasks         Get all tasks for a goal
PATCH  /api/tasks/{id}/complete      Mark a task complete
PATCH  /api/tasks/{id}/skip          Skip a task

GET    /api/goals/{id}/health        Get current health score + failure probability
GET    /api/goals/{id}/timeline      Get milestone/task timeline
GET    /api/goals/{id}/agents        Get agent activity feed (last 50 events)
GET    /api/goals/{id}/focus         Get today's 3-task focus list

GET    /api/interventions            Get all pending interventions for user
POST   /api/interventions/{id}/accept   Accept a rescue plan
POST   /api/interventions/{id}/dismiss  Dismiss an intervention

GET    /api/dashboard                Get dashboard summary (all goals + scores)
GET    /api/insights/latest          Get latest weekly insight
```

### Example: POST /api/goals/{id}/generate

**Request:**
```json
{
  "goal_id": "uuid",
  "document_url": "https://storage.../syllabus.pdf"  // optional
}
```

**Response:**
```json
{
  "goal_id": "uuid",
  "milestones": [...],
  "tasks": [...],
  "schedule": {
    "2025-01-15": ["task_1", "task_2"],
    "2025-01-16": ["task_3"]
  },
  "warnings": ["deadline is tight — only 1.2h buffer/day"],
  "failure_probability": 0.22,
  "health_score": 88
}
```

### Example: GET /api/goals/{id}/health

**Response:**
```json
{
  "goal_id": "uuid",
  "health_score": 62,
  "failure_probability": 0.68,
  "velocity_actual": 0.9,
  "velocity_required": 1.4,
  "estimated_completion_date": "2025-02-03",
  "deadline": "2025-01-28",
  "days_behind": 6,
  "risk_factors": [
    "Velocity 36% below required",
    "3 high-effort tasks in next 48h",
    "No buffer days remaining"
  ],
  "active_intervention_id": "uuid"
}
```

---

## DELIVERABLE 14 — FOLDER STRUCTURE

```
nexus/
├── frontend/                          # Next.js 14 App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── (app)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── goals/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx           # Goal overview
│   │   │   │       ├── timeline/page.tsx
│   │   │   │       ├── focus/page.tsx
│   │   │   │       └── agents/page.tsx    # Agent feed
│   │   │   ├── interventions/page.tsx
│   │   │   └── insights/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                            # Shadcn components
│   │   ├── goals/
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalIntakeForm.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   └── PlanGenerating.tsx         # Loading state with agent events
│   │   ├── execution/
│   │   │   ├── HealthScoreRing.tsx
│   │   │   ├── FailureProbabilityBar.tsx
│   │   │   ├── VelocityChart.tsx
│   │   │   └── BurndownChart.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── FocusView.tsx
│   │   │   └── TaskTimeline.tsx
│   │   ├── interventions/
│   │   │   ├── InterventionCard.tsx
│   │   │   └── RescuePlanModal.tsx
│   │   └── agents/
│   │       ├── AgentFeed.tsx
│   │       └── AgentEventItem.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   └── utils.ts
│   └── stores/
│       ├── goalStore.ts
│       └── interventionStore.ts
│
├── backend/                           # FastAPI + LangGraph
│   ├── main.py
│   ├── config.py
│   ├── agents/
│   │   ├── orchestrator.py            # LangGraph state machine
│   │   ├── goal_ingestion_agent.py
│   │   ├── task_decomposition_agent.py
│   │   ├── scheduling_agent.py
│   │   ├── progress_tracking_agent.py
│   │   ├── failure_prediction_agent.py
│   │   ├── replanning_agent.py
│   │   ├── intervention_agent.py
│   │   └── insight_agent.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── goals.py
│   │   │   ├── tasks.py
│   │   │   ├── interventions.py
│   │   │   ├── health.py
│   │   │   └── insights.py
│   │   └── middleware.py
│   ├── services/
│   │   ├── gemini_service.py          # All Gemini API calls
│   │   ├── document_service.py        # PDF/doc parsing
│   │   ├── scheduler_service.py       # Plan generation logic
│   │   ├── velocity_service.py        # Deterministic velocity math
│   │   └── notification_service.py
│   ├── models/
│   │   ├── goal.py
│   │   ├── task.py
│   │   ├── milestone.py
│   │   └── intervention.py
│   ├── db/
│   │   ├── client.py                  # Supabase Python client
│   │   └── migrations/
│   ├── jobs/
│   │   ├── scheduler.py               # APScheduler setup
│   │   ├── health_check_job.py        # Runs every 6h
│   │   └── insight_generation_job.py  # Runs weekly
│   └── prompts/
│       ├── goal_extraction.txt
│       ├── task_decomposition.txt
│       ├── scheduling.txt
│       ├── failure_analysis.txt
│       ├── replan.txt
│       └── insight_generation.txt
│
└── README.md
```

---

## DELIVERABLE 15 — GOOGLE AI STRATEGY

### Gemini Technology Usage Map

**Gemini 1.5 Pro — Long Context (Up to 1M tokens)**

*Used in: Goal Ingestion Agent (GIA)*
Upload a 200-page syllabus as a PDF. Gemini 1.5 Pro processes the entire document in a single call. The prompt instructs it to extract all topics, subtopics, exam weights, and implicit milestones. Output: structured JSON with a complete topic breakdown.

*Specific prompt pattern*:
```
System: You are an academic planning assistant. Extract all topics, subtopics, 
and their estimated study weights from the provided syllabus document. 
Return ONLY valid JSON in this exact schema: {...}

User: [PDF bytes as base64 or file URI]
Extract the complete topic structure.
```

This is the most powerful Google AI flex in the demo. No other hackathon team will be ingesting a 200-page document and producing a structured study plan in real time.

---

**Gemini Structured Outputs (JSON Mode)**

*Used in: Every inter-agent communication*
All agent-to-agent data transfer uses Gemini's `response_mime_type: "application/json"` with a defined schema. This ensures clean, reliable downstream parsing and prevents hallucination of structure.

*Example*: Task Decomposition Agent returns:
```json
{
  "milestones": [{"title": "...", "target_date": "...", "tasks": [...]}],
  "total_estimated_hours": 42.5,
  "critical_path": ["task_1", "task_3", "task_7"]
}
```

---

**Gemini Function Calling**

*Used in: Replanning Agent, Scheduling Agent*
Function calling allows the agent to request specific data (e.g., "get user's available hours for the next 10 days") without the full context needing to be in the prompt. This reduces token cost and enables more precise agent behavior.

*Example function registered*:
```python
get_user_schedule = {
  "name": "get_user_available_hours",
  "description": "Returns user's available working hours for a date range",
  "parameters": {
    "type": "object",
    "properties": {
      "start_date": {"type": "string"},
      "end_date": {"type": "string"}
    }
  }
}
```

---

**Gemini Document Understanding (Multimodal)**

*Used in: GIA for image-heavy documents*
When a syllabus contains tables, charts, or handwritten annotations, Gemini's multimodal capability extracts information that pure text extraction would miss. A course schedule table in a PDF is parsed correctly into structured date/topic pairs.

---

**Gemini 2.0 Flash**

*Used in: Intervention Agent, Insight Agent, Health Score narratives*
For short, fast LLM calls that don't require long context — generating the intervention message copy, producing one-line insight summaries, creating the "Execution Health Score explanation" — Gemini Flash is used to minimize latency and API costs.

---

**Summary Table**

| Google Technology | Used In | Key Benefit |
|---|---|---|
| Gemini 1.5 Pro Long Context | Document upload → plan generation | Processes full syllabus in one call |
| Structured Outputs (JSON mode) | All agent communications | Reliable inter-agent data passing |
| Function Calling | Replanning, Scheduling agents | Dynamic data retrieval within agent |
| Multimodal (image + text) | Document understanding | Handles tables, diagrams in PDFs |
| Gemini 2.0 Flash | Intervention copy, insights | Fast, cheap for short outputs |

---

## DELIVERABLE 16 — UI/UX DESIGN

### Design Aesthetic
Mission-control meets modern SaaS. Dark-mode first with a single accent color (electric blue `#4F9EFF`). Data-forward: numbers are heroes. Clean whitespace. Zero decorative elements. Every pixel earns its place.

Typography: Inter for all UI. Tabular nums for scores and percentages. Large display for the Execution Health Score.

---

### Screen 1: Landing Page

**Hero**: Full-width, dark background. Centered: "Your AI that tells you when you're going to fail. And fixes it."
Sub-headline: "NEXUS is the first Autonomous Execution Intelligence platform. Upload your goals. Get a plan. Let the AI keep you on track."
CTA: [Start for free — it takes 2 minutes]

**Below fold**: Three-panel feature showcase:
- Panel 1: Document upload → instant plan (animated)
- Panel 2: Failure probability score (number ticks up)
- Panel 3: One-tap rescue plan card

**Social proof row**: "Built for students. Trusted by professionals. Loved by founders."

---

### Screen 2: Onboarding

Step 1 of 3: "Who are you?" — Three large persona cards: Student / Professional / Entrepreneur. Select one. Each card shows a quote from that persona type.

Step 2 of 3: "When do you do your best work?" — Time selection: Morning (6am–12pm) / Afternoon (12pm–6pm) / Evening (6pm–12am). Slider for daily available hours (1h – 8h).

Step 3 of 3: "What's your first goal?" — Minimal form: Goal title, Deadline, Upload document (optional). Large upload zone: "Drop your syllabus, PRD, or assignment brief here."

---

### Screen 3: Goal Intake + Plan Generation

After submission: Full-screen generating state.

Shows live Agent Activity Feed while plan is generating:
```
🤖 Goal Ingestion Agent   "Analyzing your uploaded document (47 pages)..."
🤖 Goal Ingestion Agent   "Extracted 12 major topics, 34 subtopics. Deadline: April 15."
🔧 Task Decomposition     "Generating task hierarchy..."
🔧 Task Decomposition     "Created 8 milestones, 23 tasks, 44.5h estimated work."
📅 Scheduling Agent       "Building your day-by-day schedule..."
📅 Scheduling Agent       "Plan complete. 2.1h/day required. Buffer days: 3."
⚠️  Failure Prediction     "Initial risk: 18%. You're in good shape. Let's keep it that way."
```

Each line animates in as the agents complete. This is the first wow moment.

After 8–15 seconds: Transition to Dashboard.

---

### Screen 4: Dashboard

Left sidebar: Goal list with colored health bars.

Main content area (3-panel grid):

**Top left**: Execution Health Score
- Giant circular gauge (0–100), color shifts: green (80–100), yellow (50–79), red (0–49)
- Current score: e.g., 74
- Sub-label: "2 active goals · Next milestone in 3 days"

**Top right**: Active Intervention Card (if any)
- Red border. Title: "⚠️ Thesis Draft is at risk"
- "You're 68% likely to miss this deadline"
- [View Rescue Plan] button

**Bottom row**: Goal cards (horizontal scroll)
- Each card: Goal title, progress bar, days remaining, failure probability percentage, status dot (green/yellow/red)

---

### Screen 5: Goal Detail — Timeline View

Full-width timeline. Milestones as vertical columns. Tasks as cards within each column.

- Completed tasks: green checkmark, slightly faded
- Today's tasks: highlighted with blue border
- Future tasks: neutral
- At-risk tasks: orange background
- Agent reasoning on hover: "This task was rescheduled by Replanning Agent on Jan 12 because you were 2h behind."

Sidebar: Velocity chart (actual vs. required pace). Burndown chart. Failure probability trend.

---

### Screen 6: Daily Focus View

Minimal. Three tasks. Nothing else.

```
Today's Focus
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📚 Read Chapter 4: Algorithms         ~1.5h
     "Critical path task. Delay risks milestone."
  [Start]  [Skip]

  ✍️  Draft introduction for Essay 2     ~45min
     "Due tomorrow. Can't move."
  [Start]  [Skip]

  🔬 Review lab notes from Tuesday       ~30min
     "Feeds into next week's exam topics."
  [Start]  [Skip]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You're 2.3h behind this week.
[See rescue options]
```

---

### Screen 7: Intervention Center

Card-based layout. Each card represents one active intervention.

**Rescue Card (Critical)**:
```
┌──────────────────────────────────────────────────────┐
│ 🔴  CRITICAL: Thesis Draft                           │
│                                                      │
│ You are 4 days behind schedule.                      │
│ At current pace: you finish February 3rd.            │
│ Your deadline: January 28th.                         │
│ Failure probability: 68%                             │
│                                                      │
│ NEXUS Rescue Plan:                                   │
│ ▸ Increase to 2.5h/day (vs. current 1.8h/day)       │
│ ▸ Move "Appendix formatting" to post-deadline        │
│ ▸ Merge sections 3 & 4 into one writing session      │
│                                                      │
│  [✓ Accept Rescue Plan]    [See alternatives]        │
│  [Dismiss]                                           │
└──────────────────────────────────────────────────────┘
```

---

### Screen 8: Agent Transparency Feed

Full-page log of all agent activity for a goal. Timestamps, agent names, event types.

Filters: All / Planning / Tracking / Interventions / Insights

Useful for: demos (shows the system is genuinely agentic), power users (transparency and trust).

---

### Screen 9: AI Insights View

Weekly report card. Clean data visualization.

- "Your best completion day: Wednesday (avg 2.1 tasks)"
- "Tasks you consistently underestimate: Research tasks (avg 1.4x over estimate)"
- "You're 23% faster than last week"
- "At your current pace, you'll complete Goal 1 with 2 days to spare. Goal 2 needs attention."

---

## DELIVERABLE 17 — DEVELOPMENT ROADMAP

### Day 1 — Foundation (Hours 1–8)

**Objectives**: Get the skeleton running end-to-end before adding complexity.

**Tasks**:
1. Initialize Next.js 14 + FastAPI repos
2. Set up Supabase project + run migrations (all tables)
3. Implement Google OAuth via Supabase Auth
4. Build Goal Intake Form (basic: title + deadline + hours)
5. Set up Gemini API integration (test with a simple call)
6. Wire basic API routing (goal CRUD)

**Deliverable**: A logged-in user can create a goal and see it saved.

**Risk**: Supabase free tier has setup time. Do this first.

**Success Criteria**: Auth works. Goal creation works. DB stores data.

---

### Day 2 — Core AI Pipeline (Hours 9–16)

**Objectives**: Make the document upload → plan generation flow work.

**Tasks**:
1. Implement document upload to Supabase Storage
2. Build GIA: Gemini 1.5 Pro long context prompt for document parsing
3. Build TDA: Task decomposition prompt + structured output
4. Build SA: Scheduling algorithm (pure Python, no LLM needed)
5. Display generated tasks in basic list UI

**Deliverable**: Upload a syllabus → see a task list.

**Risk**: Gemini API rate limits on free tier. Have backup prompts ready.

**Success Criteria**: Full document → tasks pipeline works in < 30 seconds.

---

### Day 3 — Execution Tracking (Hours 17–24)

**Objectives**: Build the tracking and velocity engine.

**Tasks**:
1. Task completion UI (check off tasks)
2. PTA: Velocity calculation service (deterministic Python)
3. FPA: Failure probability calculation (math + brief LLM narrative)
4. Execution Health Score computation
5. Execution snapshots storage (daily)
6. Basic dashboard with health score display

**Deliverable**: Completing tasks updates velocity and health score in real time.

**Risk**: Health score calculation edge cases (brand new goal with no data).

**Success Criteria**: Mark 3 tasks complete. See health score change. See velocity update.

---

### Day 4 — Interventions + Replanning (Hours 25–32)

**Objectives**: Build the killer feature.

**Tasks**:
1. RPA: Replanning algorithm (reschedule remaining tasks)
2. IA: Intervention trigger logic (threshold-based)
3. Intervention card UI component
4. One-tap replan acceptance (write new schedule to DB)
5. Agent Events table + logging (every agent action writes an event)
6. Agent Feed UI component (poll endpoint, animate new events)

**Deliverable**: Trigger a manual intervention. See agent feed populate. Accept replan. See schedule update.

**Risk**: Replanning algorithm has edge cases. Focus on the happy path for demo.

**Success Criteria**: Demo flow works: low health score → intervention card → accept → schedule updates → health score improves.

---

### Day 5 — Demo-Quality UI (Hours 33–40)

**Objectives**: Make everything look like a real product.

**Tasks**:
1. Dashboard UI polish (health score ring, goal cards)
2. Timeline view (milestone columns + task cards)
3. Daily Focus View
4. Intervention Center page
5. Agent Feed full-page view
6. Responsive design (mobile-friendly)
7. Loading states and animations (Framer Motion)

**Deliverable**: The app looks demo-ready.

**Risk**: CSS/styling time is a black hole. Use Shadcn components aggressively.

**Success Criteria**: A judge watching a screen recording says "this looks like a real product."

---

### Day 6 — Seeding + Demo Flow (Hours 41–48)

**Objectives**: Prepare the perfect demo scenario.

**Tasks**:
1. Build a seed script: creates a user with a goal that's already 3 days in and slightly behind
2. Pre-load agent events to show a rich feed history
3. Demo script walkthrough — identify all friction points
4. Fix critical bugs
5. Deploy to Vercel + Railway
6. Test the full demo flow 5 times

**Deliverable**: Demo works flawlessly on the first try.

**Risk**: Deploy issues. Railway cold starts. Test everything.

**Success Criteria**: Full demo run in < 3 minutes with zero errors.

---

### Day 7 — Polish + Submission (Hours 49–56)

**Objectives**: Maximize judging score.

**Tasks**:
1. Record demo video (2 minutes, clean narration)
2. Write project description (lead with the unique angle)
3. Document Google AI usage prominently
4. Add README with setup instructions
5. Final bug fixes
6. Submit

**Deliverable**: Submitted, polished, documented.

---

### Critical Path

```
Auth → Goal Creation → Document Upload → Gemini Parsing 
     → Task Decomposition → Scheduling → Tracking → Velocity 
     → Failure Prediction → Replanning → Intervention Card → Agent Feed
     → Dashboard UI → Demo Seeding → Deployment
```

Every item depends on the previous. The Intervention Card + Agent Feed is the demo's core — protect it above all else.

---

## DELIVERABLE 18 — IMPLEMENTATION ORDER

The exact build order to minimize rework and maximize compounding progress:

1. Supabase project setup + schema migrations
2. Google OAuth integration
3. Basic Next.js app shell (layout, routing, auth guard)
4. Goal model + CRUD API
5. Goal Intake Form (UI → API → DB)
6. Supabase Storage setup + document upload UI
7. Gemini service layer (one reusable function: `call_gemini(prompt, file=None)`)
8. Goal Ingestion Agent (document → structured topics)
9. Task Decomposition Agent (topics → milestone/task tree)
10. DB schema: tasks + milestones tables
11. Scheduling algorithm (milestones + tasks → day-by-day schedule)
12. Schedule storage + retrieval API
13. Task list UI (show scheduled tasks per day)
14. Task completion UI + API
15. Velocity calculation service (deterministic)
16. Execution snapshot storage (run on each task completion)
17. Failure Prediction Agent (velocity → probability score)
18. Execution Health Score computation
19. Dashboard: Health Score Ring + Goal Cards
20. Agent Events logging (add to every agent function)
21. Replanning Agent (remaining tasks → new schedule)
22. Intervention Agent (threshold → create intervention)
23. Intervention Card UI component
24. One-tap replan acceptance API + UI
25. Agent Feed component (poll + animate)
26. Timeline View UI
27. Daily Focus View UI
28. Demo seed script
29. Deploy frontend (Vercel)
30. Deploy backend (Railway)
31. End-to-end demo testing
32. Demo video + submission

---

## DELIVERABLE 19 — DEMO STRATEGY

### The Demo Story

**User**: Priya, a CS student with an exam in 14 days.

**Narrative arc**: Priya uploaded her 47-page syllabus two weeks ago and got an instant study plan. She's been on track — until this week, when a group project consumed 3 days. Now she's behind and doesn't know it. Watch what NEXUS does.

---

### Demo Script (Target: 2.5 minutes)

**[0:00–0:15] — Hook (The Problem)**
Narrator: "Every student knows this feeling — you think you're on track, and then suddenly it's 3 days before the exam and you're not. Traditional tools don't tell you this until it's too late. NEXUS does."

**[0:15–0:40] — The Plan (Showing the AI's Work)**
"Two weeks ago, Priya uploaded her syllabus. NEXUS analyzed it, extracted 12 topics, and built a day-by-day study plan in 18 seconds. Here's the Agent Activity Feed from that moment." [Show the historical agent feed — GIA → TDA → SA events scrolling]

**[0:40–1:00] — The Crisis (The Wow Setup)**
"Now let's look at Priya's dashboard today." [Switch to Dashboard] "Execution Health Score: 62. Failure probability: 68%. NEXUS detected this 6 hours before Priya even opened the app."

[Pause. Let the judges read "68%" on screen. Let it land.]

**[1:00–1:30] — The Agent in Action (The Wow Moment)**
"Here's what happened in NEXUS at 7am this morning." [Switch to Agent Feed. Read the events live:]
- "Failure Prediction Agent: Velocity 0.9 tasks/day (required: 1.4). 68% failure probability."
- "Replanning Agent: Analyzing 16 remaining tasks. 2 low-priority tasks can be deferred."
- "Scheduling Agent: Revised plan ready. Requires 2.3h/day for 9 remaining days."
- "Intervention Agent: Surfacing rescue plan."

"The AI didn't wait for Priya. It acted."

**[1:30–1:55] — The Rescue (One Tap)**
[Switch to Intervention Card] "At 7:03am, Priya saw this." [Read the card aloud] "She accepted the rescue plan with one tap." [Click Accept] "Watch the Health Score." [Score animates from 62 to 79.] "From 68% failure probability to 29% in one tap."

**[1:55–2:15] — The Agent Architecture (The Technical Depth)**
[Show architecture diagram] "Behind that one tap: 9 specialized agents working together. Goal Ingestion, Task Decomposition, Scheduling, Tracking, Failure Prediction, Replanning, Intervention, Insight. All powered by Gemini 1.5 Pro with long context and structured outputs."

**[2:15–2:30] — The Close**
"NEXUS isn't a task manager. It's not a planner. It's an autonomous execution system that monitors your trajectory, predicts your failures, and fixes your plans before you miss a deadline. This is what an AI Chief of Staff looks like."

---

### Judge Psychology

- Judges are tired. Most demos will be variations of the same thing. Start with the emotional hook, not the feature list.
- Numbers create visceral reactions. "68% likely to fail" is not a feature — it's a gut punch. Lead with it.
- The agent feed is your technical credibility signal. Judges who are engineers will lean forward when they see it.
- The one-tap moment is designed to feel inevitable. Of course the AI fixed it. Of course it took one tap. That's the point.

---

## DELIVERABLE 20 — STARTUP ROADMAP

### 30 Days Post-Hackathon
- Ship public beta on Product Hunt
- Google Calendar read integration (import existing commitments)
- Email daily briefing (morning digest of today's tasks + health score)
- Fix all demo-day bugs
- Instrument analytics (Mixpanel/PostHog)
- First 100 real users
- Target: identify 10 power users to interview weekly

### 90 Days
- Mobile PWA with push notifications
- Google Calendar write integration (sync schedule to calendar)
- Improved Gemini prompt quality based on real user data
- Weekly AI insight reports (fully automated)
- Onboarding A/B tests
- Target: 1,000 active users, identify first cohort with meaningful retention

### 6 Months
- **Moat #1: Behavioral calibration.** After 60+ days of use, NEXUS knows your completion velocity by task type, your peak hours, your failure patterns. This data makes the AI's plans dramatically more accurate than a cold start. Competitors can't replicate this without the data.
- Launch Pro tier ($12/month): unlimited goals, priority AI processing, advanced insights
- Native iOS app
- Target: $5K MRR, 50 paying users

### 1 Year
- **Moat #2: Team Execution Intelligence.** Launch a team product for small companies: each team member has their personal NEXUS, and managers get a team health dashboard. No competitor has this.
- Integration marketplace: Jira, Linear, Asana, Notion, Slack
- Enterprise pilot: 3 companies, $500+/month
- Target: $50K ARR

### 3 Years
- **Moat #3: Execution data network effects.** NEXUS knows, at population scale, how long different types of goals actually take, what triggers failure for different personas, what replanning strategies work. This data becomes an unfair advantage in plan quality.
- Enterprise-grade compliance, SSO, audit logs
- Acquisition potential from Notion, Atlassian, or Google (Workspace integration)
- Target: $5M ARR, Series A

### Revenue Model
- Free tier: 1 active goal, basic tracking, no document upload
- Pro ($12/month): unlimited goals, document upload, full agentic features, all integrations
- Team ($8/user/month, min 5 users): everything in Pro + team dashboard
- Enterprise (custom): SSO, compliance, SLA, dedicated support

### Go-to-Market
- Phase 1: Students (viral via university communities — TikTok/Instagram showing the syllabus upload demo)
- Phase 2: Professionals (Product Hunt, LinkedIn — "AI Chief of Staff for PMs")
- Phase 3: Founders (YC community, Twitter — "The execution layer your startup is missing")

---

## DELIVERABLE 21 — BRUTAL REVIEW

### As a Hackathon Judge

**What I'd look for**: Does the AI actually *do* something, or is it just a wrapper? Is the demo rehearsed enough to be clean? Does the team understand what they built?

**What concerns me about NEXUS**: The demo requires pre-seeded data to be compelling. A cold demo (genuinely onboarding a new user live on stage) would take 10–15 minutes and show nothing interesting. This is a significant demo risk. Mitigate by having a beautiful, pre-loaded demo account and being transparent: "Here's an account that's been active for 5 days."

**What impresses me**: The Agent Feed is genuinely differentiating. Nobody else will have this. Make sure it's working perfectly.

**Score Prediction**: 8.5/10 if the demo is clean. 6/10 if anything breaks.

---

### As a YC Partner

**The question I'd ask**: "Why can't Notion or Motion just add this?" 

**Honest answer**: In the short term, they could. The defensibility in year 1 is execution speed and product focus, not technical moats. The moat builds over time through behavioral calibration data. The honest answer to this question in the pitch: "They could, but they won't — their product surfaces are too complex to add this kind of execution intelligence without rebuilding the scheduling engine. We're building this as a native capability from day one, not a feature bolted onto a document editor."

**What I'd fund**: The thesis (execution gap → AI intervention) is solid. The market (everyone who works) is large. The question is CAC. Students are low-friction to acquire but low-willingness-to-pay. Professionals and founders are high-WTP but expensive to reach. The right GTM is student-first for virality + distribution, then expand upmarket.

**Verdict**: Fundable concept if the team can demonstrate retention. Build the retention story before Demo Day.

---

### As a VC

**Market sizing**: TAM is effectively "everyone with goals and deadlines" — let's be honest, that's almost every knowledge worker globally. SAM is productivity software users willing to pay ($10–15/month): approximately 200M users globally. SOM in year 1: 10,000 paying users = $1.2M ARR.

**Biggest risk**: Engagement cliff after the initial "wow." The product is deeply useful when you're working toward an active goal. But most people have goals that are months-long, low-urgency most of the time. Daily engagement will be challenging. Counter-strategy: make the daily 3-task Focus View a habit surface (open it every morning) so NEXUS becomes a daily ritual, not just a quarterly planning tool.

**Comparable exits**: Asana ($1.5B IPO), Monday.com ($7B IPO), Motion (growing rapidly, likely unicorn). The execution intelligence angle is differentiated enough that a strategic acquisition by Notion or Atlassian in 3–5 years is plausible.

---

### As a Power User

**What I actually want**: I want the AI to tell me I'm going to fail before I do. That's the thing. Everything else — the beautiful UI, the timeline, the insights — is nice but optional. The failure prediction + rescue plan is the *only* feature that matters for retention. Make that feature perfect before you build anything else.

**What would make me churn**: False positives. If the AI tells me I'm at 70% failure risk and I actually finish fine, I'll stop trusting it. Calibrate the probability scores conservatively until you have enough data to be accurate.

**What would make me pay**: Finishing something I thought I was going to miss, and being able to attribute it to NEXUS. That's the retention hook. Build in a "goal completed" moment that specifically references the rescue plan that got the user there: "You completed 'Pass Data Structures Final' — NEXUS helped you recover from a 68% failure risk on Day 9."

---

### Final Improvements to the Plan

1. **Add a "Cold Start" story to the demo.** Show what happens when a *new* user signs up. Even 30 seconds of "upload your syllabus" → agent feed → plan is compelling as an opener. Then switch to the pre-seeded account for the intervention demo.

2. **Name the health score something more visceral.** "Execution Health Score" is clear but clinical. Consider: "Trajectory Score" or simply the NEXUS Score. "Your NEXUS Score is 62 — and dropping" is more memorable.

3. **Build a 404-equivalent for "no active interventions."** The Intervention Center being empty should say something like: "All clear. No active risks. Keep going." This is as important as the warning state — it tells the user the AI is watching.

4. **Pre-warm the Gemini API calls.** The first call on a cold Vercel + Railway deployment can take 5–8 seconds to spin up. For the demo, make a dummy call 30 seconds before the live demo starts to pre-warm the backend.

5. **Record a backup video.** If the live demo breaks, have a pre-recorded 2-minute video ready. Judges prefer a great recorded demo to a broken live one.

---

*End of NEXUS Hackathon Strategy Document*
*Total Deliverables: 21 | Estimated Build Time: 7 days | Winning Probability: High*
