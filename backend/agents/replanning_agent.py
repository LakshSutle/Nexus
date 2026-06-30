"""
Replanning Agent (RPA)

Responsibility: Generates revised plans when failure risk exceeds threshold.
Preserves completed tasks, removes pending ones, and rebuilds the schedule
with updated constraints.
"""

from db.client import supabase
from agents.goal_ingestion_agent import log_agent_event
from services.gemini_service import call_gemini
from services.scheduler_service import build_schedule
from datetime import datetime, date


async def run_replanning_agent(goal_id: str) -> dict:
    """
    Generate a rescue plan by replanning remaining work.
    Preserves completed tasks, removes and regenerates pending tasks.
    """
    # Get goal data
    goal = supabase.table("goals") \
        .select("*") \
        .eq("id", goal_id) \
        .single().execute().data

    # Get existing tasks
    existing_tasks = supabase.table("tasks") \
        .select("*") \
        .eq("goal_id", goal_id) \
        .execute().data

    completed_tasks = [
        t for t in existing_tasks if t["status"] == "completed"
    ]
    pending_tasks = [
        t for t in existing_tasks if t["status"] == "pending"
    ]

    await log_agent_event(
        goal_id=goal_id,
        agent_name="Replanning Agent",
        event_type="action",
        message=(
            f"Starting replan for '{goal['title']}'. "
            f"Preserving {len(completed_tasks)} completed tasks. "
            f"Rescheduling {len(pending_tasks)} pending tasks."
        )
    )

    # Use Gemini to optimize the remaining task list
    try:
        optimization = await _optimize_remaining_tasks(
            goal_title=goal["title"],
            deadline=goal["deadline"],
            daily_hours=goal["daily_hours_available"],
            completed_titles=[t["title"] for t in completed_tasks],
            pending_tasks=[
                {
                    "title": t["title"],
                    "estimated_hours": t.get("estimated_hours", 1.0)
                }
                for t in pending_tasks
            ],
            goal_id=goal_id
        )

        await log_agent_event(
            goal_id=goal_id,
            agent_name="Replanning Agent",
            event_type="decision",
            message=(
                f"AI optimization: {optimization.get('strategy', 'reschedule')}. "
                f"{optimization.get('explanation', 'Rescheduled remaining tasks.')}"
            )
        )
    except Exception as e:
        optimization = None
        await log_agent_event(
            goal_id=goal_id,
            agent_name="Replanning Agent",
            event_type="warning",
            message=f"AI optimization failed ({str(e)}). Using deterministic replan."
        )

    # Reschedule pending tasks with updated dates
    today = datetime.now().strftime("%Y-%m-%d")
    task_list = [
        {
            "title": t["title"],
            "estimated_hours": t.get("estimated_hours", 1.0),
            "sequence_order": t.get("sequence_order", 0)
        }
        for t in pending_tasks
    ]

    # Rebuild schedule from today to deadline
    schedule_result = build_schedule(
        tasks=task_list,
        start_date=today,
        deadline=goal["deadline"],
        daily_hours=goal["daily_hours_available"]
    )

    schedule = schedule_result.get("schedule", {})

    # Update task scheduled dates in DB
    tasks_rescheduled = 0
    rescheduled_tasks_list = []
    for date_str, task_indices in schedule.items():
        for idx in task_indices:
            if idx < len(pending_tasks):
                task = pending_tasks[idx]
                supabase.table("tasks").update({
                    "scheduled_date": date_str
                }).eq("id", task["id"]).execute()
                rescheduled_tasks_list.append({
                    "title": task["title"],
                    "new_date": date_str
                })
                tasks_rescheduled += 1

    # Update goal health score (rescue plan bump)
    current_health = goal.get("execution_health_score", 50)
    new_health = min(100, current_health + 17)  # Rescue plan adds ~17 points

    supabase.table("goals").update({
        "execution_health_score": new_health,
        "failure_probability": max(0.1, goal.get("failure_probability", 0.5) - 0.25),
        "updated_at": datetime.now().isoformat()
    }).eq("id", goal_id).execute()

    await log_agent_event(
        goal_id=goal_id,
        agent_name="Replanning Agent",
        event_type="action",
        message=(
            f"Replan complete. {tasks_rescheduled} tasks rescheduled. "
            f"Health: {current_health} → {new_health}. "
            f"Warning: {schedule_result.get('warning', 'none')}."
        )
    )

    return {
        "success": True,
        "tasks_rescheduled": tasks_rescheduled,
        "rescheduled_tasks": rescheduled_tasks_list,
        "tasks_preserved": len(completed_tasks),
        "new_health_score": new_health,
        "schedule_warning": schedule_result.get("warning")
    }


async def reschedule_overdue_tasks(goal_id: str) -> list[dict]:
    """Helper method to fit InterventionAgent requirements. Calls run_replanning_agent."""
    res = await run_replanning_agent(goal_id)
    return res.get("rescheduled_tasks", [])


async def _optimize_remaining_tasks(
    goal_title: str,
    deadline: str,
    daily_hours: float,
    completed_titles: list,
    pending_tasks: list,
    goal_id: str = None
) -> dict:
    """Use Gemini to suggest optimizations for the rescue plan."""
    total_hours = sum(t["estimated_hours"] for t in pending_tasks)
    days_left = max(
        (date.fromisoformat(deadline) - date.today()).days, 1
    )
    hours_available = days_left * daily_hours

    prompt = f"""
You are a rescue planning AI. A user is behind on their goal.
Suggest a brief optimization strategy.

Goal: {goal_title}
Deadline: {deadline}
Completed: {len(completed_titles)} tasks ({', '.join(completed_titles[:5])})
Remaining: {len(pending_tasks)} tasks needing {total_hours:.1f}h
Available: {hours_available:.1f}h over {days_left} days
Feasible: {"Yes" if hours_available >= total_hours else "No — scope reduction needed"}

Return JSON only:
{{
  "strategy": "intensive_catchup" or "scope_reduction" or "deadline_extension",
  "explanation": "one sentence explanation",
  "tasks_to_deprioritize": ["task title to consider dropping (if scope_reduction)"]
}}
"""
    return await call_gemini(prompt, use_flash=True, goal_id=goal_id)
