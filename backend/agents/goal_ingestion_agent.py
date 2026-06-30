import os
import json
from datetime import datetime
from services.gemini_service import call_gemini
from db.client import supabase

async def run_goal_ingestion_agent(
  goal_id: str,
  goal_title: str,
  deadline: str,
  daily_hours: float,
  document_bytes: bytes = None,
  user_id: str = None
) -> dict:

  # Log agent start
  await log_agent_event(
    goal_id=goal_id,
    agent_name="Goal Ingestion Agent",
    event_type="analysis",
    message=f"Analyzing goal: '{goal_title}'"
      + (" with uploaded document" 
         if document_bytes else "")
  )

  # Load prompt
  prompt_path = os.path.join(
    os.path.dirname(__file__), 
    "../prompts/goal_extraction.txt"
  )
  with open(prompt_path) as f:
    base_prompt = f.read()

  full_prompt = f"""
{base_prompt}

Goal Title: {goal_title}
Deadline: {deadline}
Daily hours available: {daily_hours}
Today's date: {datetime.now().strftime('%Y-%m-%d')}
"""

  # Call Gemini
  result = await call_gemini(
    prompt=full_prompt,
    file_bytes=document_bytes,
    user_id=user_id,
    goal_id=goal_id
  )

  # Log completion
  topics_count = len(result.get("topics", []))
  milestones_count = len(
    result.get("milestones", [])
  )
  
  await log_agent_event(
    goal_id=goal_id,
    agent_name="Goal Ingestion Agent",
    event_type="analysis",
    message=f"Extracted {topics_count} topics, "
      f"{milestones_count} milestones. "
      f"Total estimated: "
      f"{result.get('total_estimated_hours')}h"
  )

  # Save parsed content to goal
  supabase.table("goals").update({
    "document_parsed_content": result,
    "updated_at": datetime.now().isoformat()
  }).eq("id", goal_id).execute()

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
