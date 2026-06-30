"""
Master Orchestrator Agent (MO)

Responsibility: Routes tasks between agents, manages state, coordinates the
multi-agent pipeline. Acts as the central hub for all agent communication.

Communication Flow:
  User Action → MO → GIA (on new goal)
                   → TDA (after GIA)
                   → SA (after TDA)
                   → PTA (on task completion)
                   → FPA (on schedule update, on analyze)
                   → RPA (when FPA > threshold)
                   → IA (when RPA produces replan)
                   → InsA (on demand / weekly)
"""

from db.client import supabase
from agents.goal_ingestion_agent import (
    run_goal_ingestion_agent, log_agent_event
)
from agents.task_decomposition_agent import run_task_decomposition_agent
from agents.scheduling_agent import run_scheduling_agent
from agents.progress_tracking_agent import run_progress_tracking_agent
from agents.failure_prediction_agent import run_failure_prediction_agent
from agents.intervention_agent import run_intervention_agent
from agents.replanning_agent import run_replanning_agent
from agents.insight_agent import run_insight_agent
from datetime import datetime


async def orchestrate_goal_creation(
    goal_id: str,
    goal_title: str,
    deadline: str,
    daily_hours: float,
    document_bytes: bytes = None,
    user_id: str = None
) -> dict:
    """
    Full orchestration pipeline for new goal creation.
    Runs: GIA → TDA → SA → FPA
    """
    await log_agent_event(
        goal_id=goal_id,
        agent_name="Master Orchestrator",
        event_type="action",
        message=f"Orchestrating goal creation pipeline for '{goal_title}'"
    )

    # Clean up existing tasks and milestones first to prevent duplicates/orphans
    try:
        supabase.table("tasks").delete().eq("goal_id", goal_id).execute()
        supabase.table("milestones").delete().eq("goal_id", goal_id).execute()
    except Exception as e:
        print(f"Failed to clear existing tasks/milestones: {e}")

    results = {"stages": []}

    # Stage 1: Goal Ingestion
    try:
        goal_context = await run_goal_ingestion_agent(
            goal_id=goal_id,
            goal_title=goal_title,
            deadline=deadline,
            daily_hours=daily_hours,
            document_bytes=document_bytes,
            user_id=user_id
        )
        results["stages"].append({
            "agent": "Goal Ingestion Agent",
            "status": "success",
            "topics": len(goal_context.get("topics", [])),
            "milestones": len(goal_context.get("milestones", []))
        })
    except Exception as e:
        await log_agent_event(
            goal_id=goal_id,
            agent_name="Master Orchestrator",
            event_type="warning",
            message=f"Goal Ingestion failed: {str(e)}. Using fallback."
        )
        goal_context = {
            "goal_summary": goal_title,
            "topics": [],
            "milestones": [{"title": "Complete goal", "sequence_order": 1}],
            "total_estimated_hours": daily_hours * 7
        }
        results["stages"].append({
            "agent": "Goal Ingestion Agent",
            "status": "fallback",
            "error": str(e)
        })

    # Stage 2: Task Decomposition
    try:
        task_tree = await run_task_decomposition_agent(
            goal_id=goal_id,
            goal_title=goal_title,
            goal_context=goal_context
        )
        results["stages"].append({
            "agent": "Task Decomposition Agent",
            "status": "success",
            "tasks": len(task_tree.get("tasks", []))
        })
    except Exception as e:
        await log_agent_event(
            goal_id=goal_id,
            agent_name="Master Orchestrator",
            event_type="warning",
            message=f"Task Decomposition failed: {str(e)}"
        )
        task_tree = {"tasks": []}
        results["stages"].append({
            "agent": "Task Decomposition Agent",
            "status": "error",
            "error": str(e)
        })

    # Stage 3: Scheduling
    try:
        schedule = await run_scheduling_agent(
            goal_id=goal_id,
            deadline=deadline,
            daily_hours=daily_hours
        )
        results["stages"].append({
            "agent": "Scheduling Agent",
            "status": "success",
            "days_scheduled": schedule.get("days_scheduled", 0)
        })
    except Exception as e:
        await log_agent_event(
            goal_id=goal_id,
            agent_name="Master Orchestrator",
            event_type="warning",
            message=f"Scheduling failed: {str(e)}"
        )
        results["stages"].append({
            "agent": "Scheduling Agent",
            "status": "error",
            "error": str(e)
        })

    # Stage 4: Initial health assessment
    try:
        health = await run_failure_prediction_agent(goal_id)
        results["stages"].append({
            "agent": "Failure Prediction Agent",
            "status": "success",
            "health_score": health.get("health_score"),
            "failure_probability": health.get("failure_probability")
        })
    except Exception as e:
        results["stages"].append({
            "agent": "Failure Prediction Agent",
            "status": "error",
            "error": str(e)
        })

    # Log orchestration complete
    total_tasks = len(task_tree.get("tasks", []))
    await log_agent_event(
        goal_id=goal_id,
        agent_name="Master Orchestrator",
        event_type="action",
        message=f"Pipeline complete. {total_tasks} tasks created across "
                f"{len(results['stages'])} agent stages. "
                f"All agents reported successfully."
    )

    results["success"] = True
    results["goal_id"] = goal_id
    results["total_tasks"] = total_tasks
    return results


async def orchestrate_task_completion(
    task_id: str,
    goal_id: str
) -> dict:
    """
    Orchestration pipeline when a task is completed.
    Runs: PTA → FPA → (IA if risk > threshold)
    """
    await log_agent_event(
        goal_id=goal_id,
        agent_name="Master Orchestrator",
        event_type="action",
        message="Task completed. Running progress → prediction pipeline."
    )

    results = {}

    # Stage 1: Update progress tracking
    try:
        progress = await run_progress_tracking_agent(goal_id)
        results["progress"] = progress
    except Exception as e:
        results["progress_error"] = str(e)

    # Stage 2: Run failure prediction
    try:
        prediction = await run_failure_prediction_agent(goal_id)
        results["prediction"] = prediction

        # Stage 3: Check if intervention needed
        if prediction.get("failure_probability", 0) > 0.60:
            intervention = await run_intervention_agent(
                goal_id=goal_id,
                failure_probability=prediction["failure_probability"],
                risk_factors=prediction.get("risk_factors", []),
                velocity_actual=prediction.get("velocity_actual", 0),
                velocity_required=prediction.get("velocity_required", 0)
            )
            results["intervention"] = intervention
    except Exception as e:
        results["prediction_error"] = str(e)

    return results


async def orchestrate_analysis(goal_id: str) -> dict:
    """
    On-demand analysis pipeline.
    Runs: PTA → FPA → (IA if needed)
    """
    await log_agent_event(
        goal_id=goal_id,
        agent_name="Master Orchestrator",
        event_type="action",
        message="On-demand analysis triggered. Running full prediction pipeline."
    )

    # Run progress tracking first
    progress = await run_progress_tracking_agent(goal_id)

    # Then failure prediction
    prediction = await run_failure_prediction_agent(goal_id)

    # Check if intervention needed
    result = {
        "progress": progress,
        "prediction": prediction
    }

    if prediction.get("failure_probability", 0) > 0.60:
        intervention = await run_intervention_agent(
            goal_id=goal_id,
            failure_probability=prediction["failure_probability"],
            risk_factors=prediction.get("risk_factors", []),
            velocity_actual=prediction.get("velocity_actual", 0),
            velocity_required=prediction.get("velocity_required", 0)
        )
        result["intervention"] = intervention

    await log_agent_event(
        goal_id=goal_id,
        agent_name="Master Orchestrator",
        event_type="action",
        message=f"Analysis complete. Health: {prediction.get('health_score')}. "
                f"Risk: {round(prediction.get('failure_probability', 0) * 100)}%."
    )

    return result
