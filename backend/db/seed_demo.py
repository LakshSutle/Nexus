import asyncio
from datetime import date, timedelta, datetime
from db.client import supabase

async def seed_demo_data(user_id: str, email: str):
  print(f"Seeding demo data for user: {user_id} ({email})...")

  today = date.today()
  deadline = today + timedelta(days=9)

  # Upsert user preferences
  supabase.table("users").upsert({
    "id": user_id,
    "email": email,
    "full_name": "Alex Demo",
    "persona": "student",
    "peak_hours": "morning",
    "daily_available_hours": 2.5
  }).execute()

  # Create goal
  goal = supabase.table("goals").insert({
    "user_id": user_id,
    "title": "Pass Data Structures Final Exam",
    "description": "Cover all syllabus topics",
    "deadline": deadline.isoformat(),
    "daily_hours_available": 2.5,
    "status": "active",
    "failure_probability": 0.65,
    "execution_health_score": 33,
    "created_at": (datetime.now() - timedelta(days=6)).isoformat()
  }).execute().data[0]
  
  goal_id = goal["id"]
  print(f"Goal: {goal_id}")


  # Create milestones
  ms = supabase.table("milestones").insert([
    {
      "goal_id": goal_id,
      "title": "Core Data Structures",
      "sequence_order": 1,
      "status": "in_progress"
    },
    {
      "goal_id": goal_id,
      "title": "Algorithms",
      "sequence_order": 2,
      "status": "pending"
    },
    {
      "goal_id": goal_id,
      "title": "Practice & Review",
      "sequence_order": 3,
      "status": "pending"
    }
  ]).execute().data
  m_ids = [m["id"] for m in ms]

  # Tasks
  tasks = []
  
  completed = [
    ("Arrays & Dynamic Arrays", 1.5, -5, 0),
    ("Linked Lists", 2.0, -4, 0),
    ("Stacks & Queues", 1.5, -4, 0),
    ("Hash Tables", 2.0, -3, 0),
    ("Binary Trees", 1.5, -2, 0),
    ("BST Operations", 2.0, -2, 0),
  ]
  
  for title, hrs, offset, mi in completed:
    d = today + timedelta(days=offset)
    tasks.append({
      "goal_id": goal_id,
      "milestone_id": m_ids[mi],
      "title": title,
      "estimated_hours": hrs,
      "scheduled_date": d.isoformat(),
      "status": "completed",
      "completed_at": datetime(d.year, d.month, d.day, 9, 0).isoformat(),
      "sequence_order": len(tasks)
    })

  pending = [
    ("Graph representations", 2.0, 0, 0),
    ("BFS & DFS", 2.5, 0, 0),
    ("Sorting algorithms", 2.0, 1, 1),
    ("Binary search", 1.5, 1, 1),
    ("Dynamic programming", 2.5, 2, 1),
    ("DP practice problems", 2.0, 3, 1),
    ("Recursion patterns", 1.5, 4, 1),
    ("Time complexity", 2.0, 4, 1),
    ("Mock exam 1", 3.0, 5, 2),
    ("Review weak areas", 2.0, 6, 2),
    ("Mock exam 2", 3.0, 7, 2),
    ("Final review", 2.0, 8, 2),
    ("Exam day prep", 1.0, 8, 2),
  ]
  
  for title, hrs, offset, mi in pending:
    d = today + timedelta(days=offset)
    tasks.append({
      "goal_id": goal_id,
      "milestone_id": m_ids[mi],
      "title": title,
      "estimated_hours": hrs,
      "scheduled_date": d.isoformat(),
      "status": "pending",
      "sequence_order": len(tasks)
    })

  supabase.table("tasks").insert(tasks).execute()
  print(f"Created {len(tasks)} tasks")

  # Agent events
  events = [
    {
      "goal_id": goal_id,
      "agent_name": "Goal Ingestion Agent",
      "event_type": "analysis",
      "message": "Analyzed goal. Extracted 12 topics, 3 milestones. Deadline: " + deadline.isoformat() + ".",
      "created_at": (datetime.now() - timedelta(days=5)).isoformat()
    },
    {
      "goal_id": goal_id,
      "agent_name": "Task Decomposition Agent",
      "event_type": "action",
      "message": "Created 19 tasks across 3 milestones. Total: 38.5h.",
      "created_at": (datetime.now() - timedelta(days=5)).isoformat()
    },
    {
      "goal_id": goal_id,
      "agent_name": "Scheduling Agent",
      "event_type": "action",
      "message": "Schedule built. 2.1h/day required. 3 buffer days added.",
      "created_at": (datetime.now() - timedelta(days=5)).isoformat()
    },
    {
      "goal_id": goal_id,
      "agent_name": "Progress Tracking Agent",
      "event_type": "analysis",
      "message": "Day 3: velocity 1.3/day vs required 1.4. Slightly behind.",
      "created_at": (datetime.now() - timedelta(days=2)).isoformat()
    },
    {
      "goal_id": goal_id,
      "agent_name": "Failure Prediction Agent",
      "event_type": "analysis",
      "message": "Failure probability: 68%. Velocity 0.9 vs required 1.4. Threshold crossed. Triggering intervention.",
      "created_at": (datetime.now() - timedelta(hours=2)).isoformat()
    },
    {
      "goal_id": goal_id,
      "agent_name": "Replanning Agent",
      "event_type": "action",
      "message": "Rescue plan generated. Recommend 2.5h/day. 2 low-priority tasks deferred.",
      "created_at": (datetime.now() - timedelta(hours=2)).isoformat()
    },
    {
      "goal_id": goal_id,
      "agent_name": "Intervention Agent",
      "event_type": "decision",
      "message": "Intervention surfaced. Type: CRITICAL. Risk: 68%.",
      "created_at": (datetime.now() - timedelta(hours=2)).isoformat()
    },
  ]
  
  supabase.table("agent_events").insert(events).execute()

  # Active intervention
  supabase.table("interventions").insert({
    "goal_id": goal_id,
    "intervention_type": "critical",
    "failure_probability": 0.65,
    "message": "You are 4 days behind on 'Pass Data Structures Final Exam'. At current pace you will miss your deadline by 4 days.",
    "proposed_plan": {
      "risk_factors": [
        "Velocity 36% below required pace",
        "3 high-effort tasks in next 48h",
        "No buffer days remaining"
      ],
      "recommendation": "Increase to 2.5h/day and merge sections 3 & 4 into one session",
      "alternatives": {
        "plan_a": "Intensive: 2.5h/day",
        "plan_b": "Scope reduction: remove 2 low-priority tasks"
      }
    },
    "status": "pending"
  }).execute()

  print(f"""
[SUCCESS] Demo seed complete!

Goal ID: {goal_id}
URL: /goals/{goal_id}/timeline

Health Score: 33
Failure Risk: 65%
Tasks: 6 done, 13 pending
Intervention: ACTIVE
  """)

async def seed_demo():
  print("Seeding demo data...")
  user_id = input("Paste your demo user UUID: ").strip()
  await seed_demo_data(user_id, "demo@demo.com")

if __name__ == "__main__":
  asyncio.run(seed_demo())
