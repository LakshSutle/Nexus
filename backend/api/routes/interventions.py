from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.client import supabase
from datetime import datetime, timedelta
from agents.replanning_agent import run_replanning_agent
from services.calendar_service import sync_goal_tasks_to_calendar, create_calendar_event
from services.email_service import send_test_alert_email
from agents.outreach_agent import outreach_agent

router = APIRouter()


class AcceptInterventionRequest(BaseModel):
    access_token: Optional[str] = None


@router.get("")
async def get_interventions(user_id: str):
  try:
    # Get all active goals for user
    goals = supabase.table("goals")\
      .select("id")\
      .eq("user_id", user_id)\
      .execute().data
    
    goal_ids = [g["id"] for g in goals]
    
    if not goal_ids:
      return {"interventions": []}

    # Get all interventions (pending, accepted, dismissed)
    result = supabase.table("interventions")\
      .select("*, goals(title, deadline)")\
      .in_("goal_id", goal_ids)\
      .order("created_at", desc=True)\
      .execute()
    
    return {"interventions": result.data}
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )

@router.post("/{intervention_id}/accept")
async def accept_intervention(
  intervention_id: str,
  request: Optional[AcceptInterventionRequest] = None
):
  try:
    # Get intervention details
    intervention = supabase.table("interventions")\
      .select("*")\
      .eq("id", intervention_id)\
      .single().execute().data
    
    if not intervention:
      raise HTTPException(status_code=404, detail="Intervention not found")

    # Update intervention status
    supabase.table("interventions")\
      .update({
        "status": "accepted",
        "responded_at": datetime.now().isoformat()
      })\
      .eq("id", intervention_id)\
      .execute()
    
    # Trigger replanning agent to apply rescue plan
    await run_replanning_agent(intervention["goal_id"])
    
    # If Google OAuth access token is provided, auto-sync the new schedule to Google Calendar if enabled
    if request and request.access_token:
      try:
        # Resolve owner user_id to verify calendar sync toggle settings status
        goal_owner = supabase.table("goals").select("user_id").eq("id", intervention["goal_id"]).single().execute().data
        if goal_owner:
          user_id = goal_owner["user_id"]
          setts_res = supabase.table("user_settings").select("google_calendar_enabled").eq("user_id", user_id).execute()
          if setts_res.data and setts_res.data[0].get("google_calendar_enabled", False):
            await sync_goal_tasks_to_calendar(request.access_token, intervention["goal_id"])
          else:
            print("Skipping calendar sync: Google Calendar integration is disabled in settings.")
      except Exception as cal_err:
        print(f"Error during auto-sync to calendar on replan: {str(cal_err)}")
        # We don't fail the entire request if calendar sync fails, but log it
    
    return {
      "success": True,
      "message": "Rescue plan accepted and schedule updated"
    }
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )

@router.post("/{intervention_id}/dismiss")
async def dismiss_intervention(
  intervention_id: str
):
  try:
    supabase.table("interventions").update({
      "status": "dismissed",
      "responded_at": datetime.now().isoformat()
    }).eq("id", intervention_id).execute()
    
    return {"success": True}
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )


class TestAlertRequest(BaseModel):
    access_token: Optional[str] = None
    user_email: Optional[str] = None
    user_id: Optional[str] = None


@router.post("/test-alert")
async def trigger_test_alert(channel: str = "whatsapp", request: Optional[TestAlertRequest] = None):
  try:
    if channel in ("whatsapp", "pushover", "telegram"):
      # Look up user's saved credentials from settings
      to_override = None
      push_override = None
      telegram_override = None
      if request and request.user_id:
          try:
              settings_result = supabase.table("user_settings") \
                  .select("whatsapp_number, pushover_user_key, telegram_chat_id") \
                  .eq("user_id", request.user_id) \
                  .execute()
              if settings_result.data and len(settings_result.data) > 0:
                  setts = settings_result.data[0]
                  if setts.get("whatsapp_number"):
                      num = setts["whatsapp_number"].strip()
                      if not num.startswith("whatsapp:"):
                          num = f"whatsapp:{num}"
                      to_override = num
                  if setts.get("pushover_user_key"):
                      push_override = setts["pushover_user_key"].strip()
                  if setts.get("telegram_chat_id"):
                      telegram_override = setts["telegram_chat_id"].strip()
          except Exception:
              pass  # Fall back to .env defaults

      # --- Fetch REAL user goals and tasks ---
      goal_title = "NEXUS Test Goal"
      days_behind = 1.5
      deadline = "2026-07-05"
      progress_pct = 45.0
      rescheduled_tasks = [
          {"title": "Complete study guide", "new_date": "Tomorrow at 4 PM"},
          {"title": "Take practice exam", "new_date": "Wednesday at 2 PM"},
      ]

      if request and request.user_id:
          try:
              # Get the user's most at-risk active goal (lowest health score)
              goals_res = supabase.table("goals") \
                  .select("id, title, deadline, execution_health_score") \
                  .eq("user_id", request.user_id) \
                  .eq("status", "active") \
                  .order("execution_health_score") \
                  .limit(1) \
                  .execute()

              if goals_res.data and len(goals_res.data) > 0:
                  real_goal = goals_res.data[0]
                  goal_title = real_goal["title"]
                  deadline = real_goal.get("deadline", deadline)

                  # Calculate days behind from health score
                  health = real_goal.get("execution_health_score", 100)
                  days_behind = round(max(0.5, (100 - health) / 15), 1)

                  # Get all tasks for this goal to compute real progress
                  all_tasks_res = supabase.table("tasks") \
                      .select("id, title, status, scheduled_date") \
                      .eq("goal_id", real_goal["id"]) \
                      .execute()
                  all_tasks = all_tasks_res.data or []
                  total = len(all_tasks)
                  completed = len([t for t in all_tasks if t.get("status") == "completed"])
                  progress_pct = round((completed / total) * 100, 1) if total > 0 else 0.0

                  # Get upcoming pending tasks (sorted by date) as "rescheduled" context
                  pending = [t for t in all_tasks if t.get("status") == "pending"]
                  pending.sort(key=lambda t: t.get("scheduled_date", "9999-12-31"))
                  rescheduled_tasks = [
                      {"title": t["title"], "new_date": t.get("scheduled_date", "Soon")}
                      for t in pending[:4]
                  ]
          except Exception as e:
              print(f"Failed to fetch real goal data for test alert: {e}")
              # Falls back to hardcoded defaults above

      res = await outreach_agent.notify_velocity_deficit(
        goal_id="test-goal-id",
        goal_title=goal_title,
        days_behind=days_behind,
        rescheduled_tasks=rescheduled_tasks,
        deadline=deadline,
        progress_pct=progress_pct,
        ignore_cooldown=True,
        to_number_override=to_override if channel == "whatsapp" else None,
        pushover_key_override=push_override if channel == "pushover" else None,
        telegram_key_override=telegram_override if channel == "telegram" else None,
        user_id_override=request.user_id if request else None
      )
      
      chan_res = res.get("channels", {}).get(channel, {})
      return {"success": chan_res.get("sent", False), "reason": chan_res.get("reason", "ok")}

    elif channel == "calendar":
      if not request or not request.access_token:
        return {"success": False, "reason": "No Google access token provided. Please sign in with Google."}
      
      # Create a test event 1 hour from now
      now = datetime.utcnow()
      start_date = now.strftime("%Y-%m-%d")
      start_hour = now.hour + 1
      if start_hour >= 24:
        start_hour = 12
      
      try:
        result = await create_calendar_event(
          access_token=request.access_token,
          title="Test Alert — Channels Active ✅",
          description="This is a test event created by NEXUS to verify your Google Calendar integration is working. You can safely delete this event.",
          scheduled_date=start_date,
          estimated_hours=0.5,
        )
        return {"success": True, "reason": "ok", "event_id": result.get("id")}
      except Exception as e:
        return {"success": False, "reason": str(e)}

    elif channel == "email":
      if not request or not request.user_email:
        return {"success": False, "reason": "No email address provided."}
      
      result = send_test_alert_email(request.user_email)
      return {"success": result.get("sent", False), "reason": result.get("reason", "ok")}

    return {"success": False, "reason": f"Unknown channel: {channel}"}
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )
