# NEXUS Demo Script

## Before Demo
- [ ] Run backend: double-click `backend/start.bat`
- [ ] Run frontend: `pnpm dev`  
- [ ] Open browser to `localhost:3000`
- [ ] Log in with demo account

## Demo Flow (2.5 minutes)

### 1. Landing Page (15s)
- Show the landing page with "Start for free" CTA
- Mention: "AI-powered goal execution system"

### 2. Dashboard (20s)
- Click "Start for free" → Sign in
- Show dashboard with real data
- **Point to health score: 62** (orange/yellow)
- **Point to intervention card: 68% failure risk** (red alert)
- Say: "The system detected you're at risk of missing your deadline"

### 3. Intervention Center (30s)
- Click the intervention card
- Read the risk factors aloud:
  - "Velocity 36% below required pace"
  - "3 high-effort tasks in next 48h"
  - "No buffer days remaining"
- Click "Accept Rescue Plan"
- **Show confetti celebration**
- **Score jumps from 62 to 79** (green)
- Say: "The AI replanned your schedule automatically"

### 4. Agent Feed (30s)
- Go to Agent Feed
- Show agents working in real time
- Read: "Failure Prediction Agent: 68% risk detected"
- Read: "Replanning Agent: Rescue plan generated"
- Say: "9 autonomous agents working behind the scenes"

### 5. Timeline (20s)
- Go to timeline
- Show task cards organized by milestones
- Complete one task
- **Show score update in real-time**
- Say: "Every action updates your execution health"

### 6. Close (15s)
- Return to dashboard
- **Key pitch:**
  > "This is NEXUS — not a task manager. An execution operating system that predicts failure, intervenes automatically, and keeps you on track."

## Key Numbers to Mention
- **68%** → failure probability before intervention
- **79%** → health score after accepting rescue plan
- **18 seconds** → time to generate a plan
- **9 agents** → working autonomously
- **3 milestones** → automatically created
- **19 tasks** → decomposed from syllabus

## Demo Data (from seed script)
- Goal: "Pass Data Structures Final Exam"
- Deadline: 9 days from today
- Tasks: 6 completed, 13 pending
- Health Score: 62 (before), 79 (after)
- Intervention: ACTIVE (68% risk)

## Backup Plan
If demo data isn't available:
1. Run `py -m db.seed_demo` in backend
2. Paste demo user UUID when prompted
3. Refresh the page
