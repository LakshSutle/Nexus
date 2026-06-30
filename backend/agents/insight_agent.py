from db.client import supabase
from services.gemini_service import call_gemini
from agents.goal_ingestion_agent import log_agent_event
from datetime import date, timedelta

async def run_insight_agent(user_id: str) -> dict:
  
  today = date.today()
  week_start = today - timedelta(days=7)

  goals = supabase.table("goals")\
    .select("id,title,deadline,failure_probability,execution_health_score")\
    .eq("user_id", user_id)\
    .execute().data

  if not goals:
    return {
      "insights": [],
      "weekly_summary": "No goals yet. Create your first goal to get started.",
      "top_recommendation": "Create a goal to begin tracking.",
      "stats": {
        "tasks_completed": 0,
        "completion_rate": 0,
        "goals_on_track": 0,
        "best_day": "N/A"
      }
    }

  goal_ids = [g["id"] for g in goals]

  all_tasks = supabase.table("tasks")\
    .select("*")\
    .in_("goal_id", goal_ids)\
    .execute().data

  completed_tasks = [
    t for t in all_tasks
    if t["status"] == "completed"
    and t.get("completed_at")
    and t["completed_at"][:10] >= week_start.isoformat()
  ]

  total_tasks = len(all_tasks)
  total_completed = len(completed_tasks)

  day_counts = {}
  for t in completed_tasks:
    if t.get("completed_at"):
      d = t["completed_at"][:10]
      day_counts[d] = day_counts.get(d, 0) + 1

  best_day = max(day_counts, key=day_counts.get) if day_counts else None

  goals_on_track = len([
    g for g in goals
    if g.get("failure_probability", 1) < 0.3
  ])

  avg_health = round(
    sum(g.get("execution_health_score", 0) for g in goals) / len(goals)
  ) if goals else 0

  prompt = f"""
You are an execution intelligence analyst.
Return ONLY valid JSON, no other text.

User performance data:
- Active goals: {len(goals)}
- Tasks completed this week: {total_completed}
- Total tasks: {total_tasks}
- Goals on track (<30% risk): {goals_on_track}
- Goals at risk (>60%): {len([g for g in goals if g.get("failure_probability", 0) > 0.6])}
- Average health score: {avg_health}
- Best completion day: {best_day or "N/A"}

Return this exact structure:
{{
  "insights": [
    {{
      "type": "strength",
      "headline": "short title",
      "detail": "2 sentence explanation",
      "category": "Performance"
    }}
  ],
  "weekly_summary": "2 sentence summary",
  "top_recommendation": "single most important action",
  "stats": {{
    "tasks_completed": {total_completed},
    "completion_rate": {round(total_completed/total_tasks*100) if total_tasks > 0 else 0},
    "goals_on_track": {goals_on_track},
    "best_day": "{best_day or 'N/A'}"
  }}
}}

Generate exactly 3 insights.
Types must be from: strength, pattern, risk, win
Be specific, not generic.
"""

  try:
    result = await call_gemini(prompt, use_flash=True, user_id=user_id)
    if not isinstance(result, dict):
      raise ValueError("Invalid response")
    if "insights" not in result:
      raise ValueError("Missing insights key")
  except Exception as e:
    print(f"Insight agent fallback: {e}")
    result = {
      "insights": [
        {
          "type": "pattern",
          "headline": "Build your momentum",
          "detail": f"You completed {total_completed} tasks this week. Daily consistency is the key to hitting your deadlines.",
          "category": "Performance"
        },
        {
          "type": "risk" if goals_on_track < len(goals) else "strength",
          "headline": f"{goals_on_track} of {len(goals)} goals on track",
          "detail": "Focus on your highest-risk goal first. Small daily progress compounds quickly.",
          "category": "Goals"
        },
        {
          "type": "win",
          "headline": "You're building a system",
          "detail": "Using NEXUS consistently means your execution data gets more accurate over time.",
          "category": "Growth"
        }
      ],
      "weekly_summary": f"You completed {total_completed} tasks this week with an average health score of {avg_health}.",
      "top_recommendation": "Focus on your highest-risk goal today.",
      "stats": {
        "tasks_completed": total_completed,
        "completion_rate": round(total_completed/total_tasks*100) if total_tasks > 0 else 0,
        "goals_on_track": goals_on_track,
        "best_day": best_day or "N/A"
      }
    }

  # Save to DB
  try:
    supabase.table("insights").insert({
      "user_id": user_id,
      "week_start": week_start.isoformat(),
      "content": result
    }).execute()
  except Exception as e:
    print(f"Failed to save insights: {e}")

  # Log to agent events for each goal
  for goal in goals:
    try:
      await log_agent_event(
        goal_id=goal["id"],
        agent_name="Insight Agent",
        event_type="analysis",
        message=f"Weekly insights generated. {total_completed} tasks completed. Health: {avg_health}."
      )
    except:
      pass

  return result
