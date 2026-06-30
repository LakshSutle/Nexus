from db.client import supabase
from agents.goal_ingestion_agent import log_agent_event
from datetime import date, datetime
from services.gemini_service import call_gemini

async def run_failure_prediction_agent(goal_id: str) -> dict:
  
  # Get goal data
  goal = supabase.table("goals")\
    .select("*")\
    .eq("id", goal_id)\
    .single().execute().data

  # Get task stats
  tasks = supabase.table("tasks")\
    .select("*")\
    .eq("goal_id", goal_id)\
    .execute().data

  total = len(tasks)
  completed = len([
    t for t in tasks 
    if t["status"] == "completed"
  ])
  remaining = total - completed

  if total == 0:
    return {"failure_probability": 0.1, "health_score": 90}

  # Calculate velocity
  deadline = date.fromisoformat(goal["deadline"])
  today = date.today()
  created = date.fromisoformat(goal["created_at"][:10])
  
  days_elapsed = max((today - created).days, 1)
  days_remaining = max((deadline - today).days, 1)

  velocity_actual = completed / days_elapsed
  velocity_required = remaining / days_remaining

  # Calculate failure probability
  if velocity_required == 0:
    failure_prob = 0.05
  elif velocity_actual == 0 and remaining > 0:
    failure_prob = 0.85
  else:
    ratio = (velocity_actual / velocity_required if velocity_required > 0 else 1)
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
  completion_pct = completed / total
  health_score = int((1 - failure_prob) * 60 + completion_pct * 40)

  # Get risk factors from Gemini if risky
  risk_factors = []
  if failure_prob > 0.4:
    prompt = f"""
    Goal: {goal['title']}
    Days remaining: {days_remaining}
    Tasks remaining: {remaining}
    Current velocity: {velocity_actual:.1f} tasks/day
    Required velocity: {velocity_required:.1f} tasks/day
    
    Return JSON only:
    {{
      "risk_factors": [
        "risk 1 in one sentence",
        "risk 2 in one sentence",
        "risk 3 in one sentence"
      ],
      "recommendation": "one sentence action to take"
    }}
    """
    try:
      result = await call_gemini(prompt, use_flash=True, goal_id=goal_id)
      risk_factors = result.get("risk_factors", [])
    except:
      risk_factors = [
        f"Velocity {round(failure_prob*100)}% below required pace",
        f"{remaining} tasks in {days_remaining} days",
        "Consider increasing daily hours"
      ]

  # Log to agent events
  await log_agent_event(
    goal_id=goal_id,
    agent_name="Failure Prediction Agent",
    event_type="analysis",
    message=f"Failure probability: {round(failure_prob*100)}%. Health score: {health_score}. Velocity: {velocity_actual:.1f}/{velocity_required:.1f} tasks/day"
  )

  # Update goal in DB
  supabase.table("goals").update({
    "failure_probability": failure_prob,
    "execution_health_score": health_score
  }).eq("id", goal_id).execute()

  # Create intervention if probability > 60%
  if failure_prob > 0.60:
    # Check if recent intervention exists
    recent = supabase.table("interventions")\
      .select("id")\
      .eq("goal_id", goal_id)\
      .eq("status", "pending")\
      .execute().data
    
    if not recent:
      supabase.table("interventions").insert({
        "goal_id": goal_id,
        "intervention_type": "critical",
        "failure_probability": failure_prob,
        "message": f"You are at risk of missing '{goal['title']}'. Current failure probability: {round(failure_prob*100)}%.",
        "proposed_plan": {
          "risk_factors": risk_factors,
          "recommendation": f"Increase to {velocity_required:.1f} tasks/day to hit deadline"
        }
      }).execute()

      await log_agent_event(
        goal_id=goal_id,
        agent_name="Intervention Agent",
        event_type="decision",
        message=f"Intervention created. Failure risk: {round(failure_prob*100)}%"
      )

  return {
    "failure_probability": failure_prob,
    "health_score": health_score,
    "risk_factors": risk_factors,
    "velocity_actual": velocity_actual,
    "velocity_required": velocity_required
  }
