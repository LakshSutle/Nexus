"""
Progress Tracking Agent (PTA)

Responsibility: Monitors task completion events and updates execution state.
Runs on a lightweight compute loop (deterministic calculation, not full LLM).

Inputs: Task completion events, timestamps, current schedule
Outputs: Velocity metrics, execution snapshots, completion projections
"""

from db.client import supabase
from agents.goal_ingestion_agent import log_agent_event
from datetime import date, datetime, timedelta


async def run_progress_tracking_agent(goal_id: str) -> dict:
    """
    Calculate current progress metrics for a goal.
    Updates execution_snapshots table for historical tracking.
    """
    # Get goal data
    goal = supabase.table("goals") \
        .select("*") \
        .eq("id", goal_id) \
        .single().execute().data

    # Get all tasks
    tasks = supabase.table("tasks") \
        .select("*") \
        .eq("goal_id", goal_id) \
        .execute().data

    total = len(tasks)
    completed = [t for t in tasks if t["status"] == "completed"]
    pending = [t for t in tasks if t["status"] == "pending"]
    skipped = [t for t in tasks if t["status"] == "skipped"]
    remaining = len(pending)

    if total == 0:
        return {
            "total_tasks": 0,
            "completed": 0,
            "remaining": 0,
            "velocity_actual": 0,
            "velocity_required": 0,
            "on_track": True,
            "projected_completion": None
        }

    # Calculate velocity
    deadline = date.fromisoformat(goal["deadline"])
    today = date.today()
    created = date.fromisoformat(goal["created_at"][:10])

    days_elapsed = max((today - created).days, 1)
    days_remaining = max((deadline - today).days, 1)

    velocity_actual = len(completed) / days_elapsed
    velocity_required = remaining / days_remaining if days_remaining > 0 else 999

    # Calculate projected completion date
    if velocity_actual > 0:
        days_to_complete = remaining / velocity_actual
        projected_completion = today + timedelta(days=int(days_to_complete))
    else:
        projected_completion = None

    # Determine if on track
    on_track = velocity_actual >= velocity_required * 0.8 if velocity_required > 0 else True

    # Calculate completion percentage
    completion_pct = round(len(completed) / total * 100, 1) if total > 0 else 0

    # Hours tracking
    hours_completed = sum(t.get("estimated_hours", 0) for t in completed)
    hours_remaining = sum(t.get("estimated_hours", 0) for t in pending)

    # Save execution snapshot for historical tracking
    try:
        snapshot_today = supabase.table("execution_snapshots") \
            .select("id") \
            .eq("goal_id", goal_id) \
            .eq("snapshot_date", today.isoformat()) \
            .execute().data

        snapshot_data = {
            "goal_id": goal_id,
            "snapshot_date": today.isoformat(),
            "tasks_completed": len(completed),
            "tasks_remaining": remaining,
            "velocity_actual": round(velocity_actual, 3),
            "velocity_required": round(velocity_required, 3),
            "failure_probability": goal.get("failure_probability", 0),
            "health_score": goal.get("execution_health_score", 100)
        }

        if snapshot_today:
            supabase.table("execution_snapshots") \
                .update(snapshot_data) \
                .eq("id", snapshot_today[0]["id"]) \
                .execute()
        else:
            supabase.table("execution_snapshots") \
                .insert(snapshot_data) \
                .execute()
    except Exception as e:
        print(f"Failed to save snapshot: {e}")

    # Log progress update
    pace_status = "on track" if on_track else "behind schedule"
    projected_str = (
        projected_completion.strftime("%b %d")
        if projected_completion else "unknown"
    )
    deadline_str = deadline.strftime("%b %d")

    await log_agent_event(
        goal_id=goal_id,
        agent_name="Progress Tracking Agent",
        event_type="analysis",
        message=(
            f"Progress: {len(completed)}/{total} tasks ({completion_pct}%). "
            f"Velocity: {velocity_actual:.2f}/day "
            f"(required: {velocity_required:.2f}/day). "
            f"Status: {pace_status}. "
            f"Projected finish: {projected_str} "
            f"(deadline: {deadline_str})."
        )
    )

    return {
        "total_tasks": total,
        "completed": len(completed),
        "remaining": remaining,
        "skipped": len(skipped),
        "completion_pct": completion_pct,
        "velocity_actual": round(velocity_actual, 3),
        "velocity_required": round(velocity_required, 3),
        "on_track": on_track,
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "hours_completed": hours_completed,
        "hours_remaining": hours_remaining,
        "projected_completion": (
            projected_completion.isoformat()
            if projected_completion else None
        )
    }
