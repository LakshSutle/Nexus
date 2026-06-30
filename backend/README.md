# NEXUS Backend

AI-powered goal execution system backend built with FastAPI and Supabase.

## Overview

This backend provides the AI agent infrastructure for NEXUS - an execution operating system that:
- Decomposes goals into actionable tasks
- Schedules tasks based on user preferences
- Predicts failure risk and triggers interventions
- Generates weekly insights
- Tracks progress and execution health

## Architecture

### Core Components

- **FastAPI**: Web framework for API endpoints
- **Supabase**: Database and authentication
- **Google Gemini AI**: AI model for intelligent task decomposition and insights
- **Python Agents**: Autonomous agents that handle different aspects of goal execution

### Agents

The system uses 9 autonomous agents that work together:

1. **Goal Ingestion Agent** (`goal_ingestion_agent.py`)
   - Analyzes user goals and extracts key topics
   - Identifies deadlines and constraints

2. **Task Decomposition Agent** (`task_decomposition_agent.py`)
   - Breaks down goals into actionable tasks
   - Estimates time for each task
   - Creates milestones for progress tracking

3. **Scheduling Agent** (`scheduling_agent.py`)
   - Schedules tasks based on user's peak hours
   - Adds buffer days for flexibility
   - Optimizes task order

4. **Progress Tracking Agent** (`progress_tracking_agent.py`)
   - Monitors task completion velocity
   - Tracks execution health score
   - Logs progress events

5. **Failure Prediction Agent** (`failure_prediction_agent.py`)
   - Calculates failure probability based on velocity and deadlines
   - Identifies risk factors using AI
   - Triggers interventions when risk exceeds threshold (60%)

6. **Replanning Agent** (`replanning_agent.py`)
   - Generates rescue plans when goals are at risk
   - Preserves completed tasks
   - Reschedules remaining tasks

7. **Intervention Agent** (`intervention_agent.py`)
   - Creates intervention records
   - Surfaces rescue plans to users
   - Tracks intervention acceptance/dismissal

8. **Insight Agent** (`insight_agent.py`)
   - Generates weekly performance insights
   - Calculates stats (completion rate, best day, etc.)
   - Identifies patterns, strengths, risks, and wins

9. **Health Analysis Agent** (`health.py`)
   - Calculates real-time execution health score
   - Updates goal health in database

## API Routes

### Goals (`/api/goals`)
- `GET /api/goals?user_id={id}` - Fetch user's goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/{id}` - Fetch goal details
- `DELETE /api/goals/{id}` - Delete goal

### Tasks (`/api/tasks`)
- `GET /api/tasks?goal_id={id}` - Fetch tasks for a goal
- `POST /api/tasks/{id}/complete` - Mark task as completed
- `POST /api/tasks/{id}/skip` - Skip a task

### Health (`/api/health`)
- `GET /api/health/{goal_id}` - Get goal health score
- `POST /api/health/{goal_id}/analyze` - Run failure prediction analysis

### Interventions (`/api/interventions`)
- `GET /api/interventions?user_id={id}` - Fetch user's interventions
- `POST /api/interventions/{id}/accept` - Accept intervention (triggers replanning)
- `POST /api/interventions/{id}/dismiss` - Dismiss intervention

### Insights (`/api/insights`)
- `GET /api/insights/latest?user_id={id}` - Get cached insights or generate new
- `POST /api/insights/generate?user_id={id}` - Force generate new insights

### Agent Events (`/api/agent-events`)
- `GET /api/agent-events?goal_id={id}` - Fetch agent activity log

## Database Schema

Key tables:
- `users` - User preferences (persona, peak hours, daily availability)
- `goals` - User goals with health scores and failure probability
- `milestones` - Goal milestones for progress tracking
- `tasks` - Individual tasks with scheduling and status
- `interventions` - Rescue plans and risk alerts
- `agent_events` - Log of all agent activities
- `insights` - Weekly performance insights

## Environment Variables

Required in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## Running the Backend

### Option 1: Start script (Windows)
Double-click `start.bat` in this folder

### Option 2: Command line
```bash
py -m uvicorn main:app --reload --port 8000
```

### Option 3: With frontend (from project root)
```bash
pnpm dev:all
```

## File Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── db/
│   ├── client.py          # Supabase client
│   ├── schema.sql         # Database schema
│   └── seed_demo.py       # Demo data seeding script
├── agents/
│   ├── goal_ingestion_agent.py
│   ├── task_decomposition_agent.py
│   ├── scheduling_agent.py
│   ├── progress_tracking_agent.py
│   ├── failure_prediction_agent.py
│   ├── replanning_agent.py
│   ├── intervention_agent.py
│   └── insight_agent.py
├── api/
│   └── routes/
│       ├── goals.py
│       ├── tasks.py
│       ├── health.py
│       ├── interventions.py
│       ├── insights.py
│       └── agent_events.py
├── services/
│   └── gemini_service.py   # Gemini AI integration
└── requirements.txt       # Python dependencies
```

## Key Workflows

### Goal Creation Flow
1. User creates goal via frontend
2. Goal Ingestion Agent analyzes goal
3. Task Decomposition Agent breaks into tasks
4. Scheduling Agent creates timeline
5. Progress Tracking Agent starts monitoring

### Intervention Flow
1. Failure Prediction Agent detects high risk (>60%)
2. Intervention Agent creates intervention record
3. User accepts intervention
4. Replanning Agent generates rescue plan
5. Tasks are rescheduled

### Insights Generation
1. Insight Agent fetches user's goals and tasks
2. Calculates weekly stats
3. Calls Gemini for AI-generated insights
4. Saves to database for caching

## Demo Data

To seed demo data for presentations:
```bash
py -m db.seed_demo
```

This creates a demo goal with:
- 19 tasks across 3 milestones
- 6 completed, 13 pending
- 68% failure risk
- Active intervention
- 7 agent events

## Troubleshooting

### Backend won't start
- Check Python is installed: `py --version`
- Install dependencies: `pip install -r requirements.txt`
- Verify `.env` file exists with correct values

### AI calls failing
- Check GEMINI_API_KEY in `.env`
- Verify API key has valid credits
- Check network connectivity

### Database errors
- Verify Supabase project is active
- Check tables exist (run schema.sql if needed)
- Verify RLS policies allow operations
