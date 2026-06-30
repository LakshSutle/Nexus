import os
import json
from datetime import datetime
from services.gemini_service import call_gemini
from db.client import supabase

async def run_task_decomposition_agent(
  goal_id: str,
  goal_title: str,
  goal_context: dict
) -> dict:

  # Log agent start
  await log_agent_event(
    goal_id=goal_id,
    agent_name="Task Decomposition Agent",
    event_type="planning",
    message=f"Decomposing goal into tasks"
  )

  # Load prompt
  prompt_path = os.path.join(
    os.path.dirname(__file__), 
    "../prompts/task_decomposition.txt"
  )
  with open(prompt_path) as f:
    base_prompt = f.read()

  full_prompt = f"""
{base_prompt}

Goal Context:
{json.dumps(goal_context, indent=2)}
"""

  # Call Gemini
  try:
    result = await call_gemini(
      prompt=full_prompt,
      file_bytes=None,
      goal_id=goal_id
    )
  except Exception as e:
    await log_agent_event(
      goal_id=goal_id,
      agent_name="Task Decomposition Agent",
      event_type="warning",
      message=f"Gemini decomposition failed ({e}). Using mock task list."
    )
    
    milestones = goal_context.get("milestones", [])
    fallback_tasks = []
    
    if milestones:
      for idx, m in enumerate(milestones):
        m_title = m.get("title", f"Milestone {idx + 1}")
        fallback_tasks.extend([
          {
            "title": f"Study {m_title}",
            "description": "Read through resources, slides, and textbooks for this phase.",
            "milestone_index": idx,
            "estimated_hours": 3.0,
            "sequence_order": idx * 3 + 1,
            "dependencies": []
          },
          {
            "title": f"Practice {m_title}",
            "description": "Solve practice questions, build sample projects, and verify skills.",
            "milestone_index": idx,
            "estimated_hours": 4.0,
            "sequence_order": idx * 3 + 2,
            "dependencies": [idx * 3 + 1]
          },
          {
            "title": f"Review {m_title}",
            "description": "Conduct milestone self-assessment and clarify remaining questions.",
            "milestone_index": idx,
            "estimated_hours": 2.0,
            "sequence_order": idx * 3 + 3,
            "dependencies": [idx * 3 + 2]
          }
        ])
    else:
      fallback_tasks = [
        {
          "title": "Establish Goal Foundations",
          "description": "Define scope, gather resources, and outline initial requirements.",
          "milestone_index": 0,
          "estimated_hours": 4.0,
          "sequence_order": 1,
          "dependencies": []
        },
        {
          "title": "Implement Core Execution",
          "description": "Work on the primary features, modules, or chapters of the goal.",
          "milestone_index": 0,
          "estimated_hours": 12.0,
          "sequence_order": 2,
          "dependencies": [1]
        },
        {
          "title": "Final Verification & Review",
          "description": "Perform checks, test outputs, and complete final deliverables.",
          "milestone_index": 0,
          "estimated_hours": 6.0,
          "sequence_order": 3,
          "dependencies": [2]
        }
      ]
        
    result = {
      "tasks": fallback_tasks,
      "critical_path_indices": [t["sequence_order"] for t in fallback_tasks]
    }

  # Log completion
  tasks_count = len(result.get("tasks", []))
  critical_path_count = len(
    result.get("critical_path_indices", [])
  )
  
  await log_agent_event(
    goal_id=goal_id,
    agent_name="Task Decomposition Agent",
    event_type="planning",
    message=f"Created {tasks_count} tasks, "
      f"{critical_path_count} on critical path"
  )

  # Ensure milestones exist in the database and build a mapping from index to milestone_id (UUID)
  milestones = goal_context.get("milestones", [])
  milestone_id_map = {}
  
  if not milestones:
    # Use default milestones if none exist in the context
    milestones = [
      {
        "title": "Core Study & Practice",
        "description": "Cover core topics and verify understanding through practice",
        "sequence_order": 1,
        "status": "pending"
      }
    ]

  for idx, m in enumerate(milestones):
    m_title = m.get("title", f"Milestone {idx + 1}")
    m_desc = m.get("description", "")
    m_seq = m.get("sequence_order", idx + 1)
    
    m_data = {
      "goal_id": goal_id,
      "title": m_title,
      "description": m_desc,
      "sequence_order": m_seq,
      "status": "pending",
      "created_at": datetime.now().isoformat()
    }
    
    # Calculate target_date if days_from_start or target_date is available
    if m.get("target_date"):
      m_data["target_date"] = m.get("target_date")
    elif m.get("days_from_start"):
      from datetime import date, timedelta
      target = date.today() + timedelta(days=int(m["days_from_start"]))
      m_data["target_date"] = target.isoformat()
    elif m.get("target_day"):
      from datetime import date, timedelta
      target = date.today() + timedelta(days=int(m["target_day"]))
      m_data["target_date"] = target.isoformat()
      
    try:
      res = supabase.table("milestones").insert(m_data).execute()
      if res.data:
        milestone_id_map[idx] = res.data[0]["id"]
    except Exception as me:
      print(f"Failed to insert milestone: {me}")

  # Save tasks to database
  for task in result.get("tasks", []):
    task_idx = task.get("milestone_index", 0)
    milestone_id = milestone_id_map.get(task_idx)
    if not milestone_id and milestone_id_map:
      milestone_id = list(milestone_id_map.values())[0]

    task_data = {
      "goal_id": goal_id,
      "milestone_id": milestone_id,
      "title": task.get("title"),
      "description": task.get("description"),
      "estimated_hours": task.get("estimated_hours"),
      "sequence_order": task.get("sequence_order"),
      "dependencies": task.get("dependencies", []),
      "status": "pending",
      "created_at": datetime.now().isoformat()
    }
    try:
      supabase.table("tasks").insert(task_data).execute()
    except Exception as e:
      # If the 'dependencies' column is missing or schema cache is stale, retry without it
      if "dependencies" in str(e) or "PGRST204" in str(e):
        task_data.pop("dependencies", None)
        try:
          supabase.table("tasks").insert(task_data).execute()
        except Exception as retry_err:
          print(f"Failed to insert task on retry: {retry_err}")
      else:
        print(f"Failed to insert task: {e}")

  return result

async def log_agent_event(
  goal_id: str,
  agent_name: str,
  event_type: str,
  message: str,
  data: dict = None
):
  try:
    supabase.table("agent_events").insert({
      "goal_id": goal_id,
      "agent_name": agent_name,
      "event_type": event_type,
      "message": message,
      "data": data
    }).execute()
  except Exception as e:
    print(f"Failed to log agent event: {e}")
