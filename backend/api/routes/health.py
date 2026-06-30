from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from db.client import supabase
from datetime import datetime, date
from agents.failure_prediction_agent import run_failure_prediction_agent
import asyncio
import json

router = APIRouter()

@router.get("/{goal_id}")
async def get_goal_health(goal_id: str):
  try:
    # Get goal
    goal = supabase.table("goals") \
      .select("*") \
      .eq("id", goal_id) \
      .single() \
      .execute().data

    # Get task stats
    all_tasks = supabase.table("tasks") \
      .select("*") \
      .eq("goal_id", goal_id) \
      .execute().data

    total = len(all_tasks)
    completed = len([
      t for t in all_tasks
      if t["status"] == "completed"
    ])
    remaining = total - completed

    def safe_parse_date(date_str: str, default_val: date = None) -> date:
      try:
        if not date_str:
          return default_val or date.today()
        # Handle extreme year values gracefully
        parts = date_str[:10].split("-")
        if len(parts) >= 1 and parts[0].isdigit():
          year = int(parts[0])
          if year > 9999:
            parts[0] = "9999"
            date_str = "-".join(parts)
          elif year < 1:
            parts[0] = "0001"
            date_str = "-".join(parts)
        return date.fromisoformat(date_str[:10])
      except Exception:
        return default_val or date.today()

    # Calculate velocity
    today = date.today()
    from datetime import timedelta
    deadline = safe_parse_date(goal.get("deadline"), today + timedelta(days=7))
    days_elapsed = (today - safe_parse_date(
      goal.get("created_at"), today - timedelta(days=1)
    )).days or 1
    days_remaining = (deadline - today).days

    velocity_actual = (
      completed / days_elapsed
      if days_elapsed > 0 else 0
    )
    velocity_required = (
      remaining / days_remaining
      if days_remaining > 0 else 999
    )

    # Failure probability
    if velocity_required == 0:
      failure_prob = 0.05
    elif velocity_actual == 0 and remaining > 0:
      failure_prob = 0.90
    else:
      ratio = velocity_actual / velocity_required if velocity_required > 0 else 1
      if ratio >= 1.2:
        failure_prob = 0.10
      elif ratio >= 1.0:
        failure_prob = 0.20
      elif ratio >= 0.8:
        failure_prob = 0.40
      elif ratio >= 0.6:
        failure_prob = 0.65
      else:
        failure_prob = 0.85

    # Health score
    completion_pct = (
      completed / total if total > 0 else 0
    )
    health_score = int(
      (1 - failure_prob) * 60 +
      completion_pct * 40
    )

    # Projected completion date
    if velocity_actual > 0 and remaining > 0:
      from datetime import timedelta
      days_to_finish = remaining / velocity_actual
      projected_date = (today + timedelta(days=int(days_to_finish))).isoformat()
    else:
      projected_date = None

    # Update goal in DB
    supabase.table("goals").update({
      "failure_probability": failure_prob,
      "execution_health_score": health_score
    }).eq("id", goal_id).execute()

    return {
      "goal_id": goal_id,
      "health_score": health_score,
      "failure_probability": round(failure_prob, 2),
      "velocity_actual": round(velocity_actual, 2),
      "velocity_required": round(velocity_required, 2),
      "tasks_completed": completed,
      "tasks_remaining": remaining,
      "days_remaining": days_remaining,
      "projected_completion": projected_date,
      "risk_level": (
        "critical" if failure_prob > 0.6
        else "warning" if failure_prob > 0.3
        else "good"
      )
    }
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )

@router.post("/{goal_id}/analyze")
async def analyze_goal_health(goal_id: str):
  try:
    result = await run_failure_prediction_agent(goal_id)
    return result
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )

@router.get("/{goal_id}/history")
async def get_health_history(goal_id: str):
  """Get execution snapshots for trend chart."""
  try:
    result = supabase.table("execution_snapshots") \
      .select("*") \
      .eq("goal_id", goal_id) \
      .order("snapshot_date") \
      .limit(30) \
      .execute()
    return {"snapshots": result.data}
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )
