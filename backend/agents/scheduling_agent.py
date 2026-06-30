"""
Scheduling Agent (SA)

Responsibility: Maps the task tree onto the user's calendar respecting constraints.
Uses a combination of deterministic scheduling and Gemini-powered cognitive load
awareness to create optimal schedules.

Inputs: Task list, deadlines, daily hours, user preferences
Outputs: Day-by-day schedule with buffer days and cognitive load balancing
"""

from db.client import supabase
from agents.goal_ingestion_agent import log_agent_event
from services.scheduler_service import build_schedule
from services.gemini_service import call_gemini
from datetime import datetime, date, timedelta


async def run_scheduling_agent(
    goal_id: str,
    deadline: str,
    daily_hours: float
) -> dict:
    """
    Schedule all pending tasks for a goal.
    Uses deterministic bin-packing + Gemini for cognitive load insights.
    """
    await log_agent_event(
        goal_id=goal_id,
        agent_name="Scheduling Agent",
        event_type="action",
        message="Building optimized schedule with cognitive load balancing."
    )

    # Fetch all pending tasks for this goal
    tasks_result = supabase.table("tasks") \
        .select("*") \
        .eq("goal_id", goal_id) \
        .eq("status", "pending") \
        .order("sequence_order") \
        .execute()

    tasks = tasks_result.data
    if not tasks:
        await log_agent_event(
            goal_id=goal_id,
            agent_name="Scheduling Agent",
            event_type="action",
            message="No pending tasks to schedule."
        )
        return {"days_scheduled": 0, "warning": None}

    # Get user preferences from goal
    goal = supabase.table("goals") \
        .select("*, users(peak_hours, daily_available_hours)") \
        .eq("id", goal_id) \
        .single().execute().data

    # Build task list for scheduler
    task_list = [
        {
            "title": t["title"],
            "estimated_hours": t.get("estimated_hours", 1.0),
            "sequence_order": t.get("sequence_order", 0)
        }
        for t in tasks
    ]

    today = datetime.now().strftime("%Y-%m-%d")

    # Run deterministic scheduler
    schedule_result = build_schedule(
        tasks=task_list,
        start_date=today,
        deadline=deadline,
        daily_hours=daily_hours
    )

    schedule = schedule_result.get("schedule", {})
    warning = schedule_result.get("warning")

    # Apply schedule to tasks in DB
    days_scheduled = 0
    for date_str, task_indices in schedule.items():
        for idx in task_indices:
            if idx < len(tasks):
                supabase.table("tasks").update({
                    "scheduled_date": date_str
                }).eq("id", tasks[idx]["id"]).execute()
                days_scheduled += 1

    # Calculate schedule stats
    total_hours_needed = schedule_result.get("total_hours_needed", 0)
    total_hours_available = schedule_result.get("total_hours_available", 0)
    buffer_days = len(schedule_result.get("buffer_days", []))

    # Log schedule details
    schedule_summary = (
        f"Schedule built: {len(tasks)} tasks across "
        f"{len(schedule)} days. "
        f"{total_hours_needed:.1f}h needed / "
        f"{total_hours_available:.1f}h available. "
        f"{buffer_days} buffer day(s) reserved."
    )
    if warning:
        schedule_summary += f" ⚠️ Warning: {warning}"

    await log_agent_event(
        goal_id=goal_id,
        agent_name="Scheduling Agent",
        event_type="action",
        message=schedule_summary
    )

    # If schedule is tight, ask Gemini for optimization suggestions
    if warning or (total_hours_needed > total_hours_available * 0.8):
        try:
            optimization = await _get_schedule_optimization(
                tasks=task_list,
                total_hours_needed=total_hours_needed,
                total_hours_available=total_hours_available,
                days_remaining=(
                    date.fromisoformat(deadline) - date.today()
                ).days,
                goal_id=goal_id
            )
            await log_agent_event(
                goal_id=goal_id,
                agent_name="Scheduling Agent",
                event_type="decision",
                message=f"Schedule optimization: {optimization.get('suggestion', 'No suggestion')}"
            )
        except Exception:
            pass  # Non-critical, don't fail the schedule

    return {
        "days_scheduled": days_scheduled,
        "total_days": len(schedule),
        "buffer_days": buffer_days,
        "warning": warning,
        "total_hours_needed": total_hours_needed,
        "total_hours_available": total_hours_available
    }


async def _get_schedule_optimization(
    tasks: list,
    total_hours_needed: float,
    total_hours_available: float,
    days_remaining: int,
    goal_id: str = None
) -> dict:
    """Use Gemini to suggest schedule optimizations."""
    prompt = f"""
You are a scheduling optimization AI.
A user has a tight schedule. Analyze and suggest ONE optimization.

Schedule data:
- Total tasks: {len(tasks)}
- Hours needed: {total_hours_needed:.1f}
- Hours available: {total_hours_available:.1f}
- Days remaining: {days_remaining}
- Utilization: {(total_hours_needed/total_hours_available*100) if total_hours_available > 0 else 999:.0f}%

Return JSON only:
{{
  "suggestion": "one sentence optimization suggestion",
  "priority_action": "most important thing to do first",
  "risk_level": "low" or "medium" or "high"
}}
"""
    return await call_gemini(prompt, use_flash=True, goal_id=goal_id)
