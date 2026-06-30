from fastapi import APIRouter, HTTPException
from datetime import datetime
from db.client import supabase
from agents.orchestrator import orchestrate_task_completion

router = APIRouter()


@router.patch("/{task_id}/complete")
async def complete_task(task_id: str):
    try:
        # Update task status
        result = supabase.table("tasks").update({
            "status": "completed",
            "completed_at": datetime.now().isoformat()
        }).eq("id", task_id).execute()

        task = result.data[0]

        # Trigger orchestrator pipeline: PTA → FPA → (IA if needed)
        orchestration = await orchestrate_task_completion(
            task_id=task_id,
            goal_id=task["goal_id"]
        )

        return {
            "success": True,
            "task": task,
            "health_update": orchestration.get("prediction", {}),
            "intervention_triggered": "intervention" in orchestration
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.patch("/{task_id}/skip")
async def skip_task(task_id: str):
    try:
        result = supabase.table("tasks").update({
            "status": "skipped"
        }).eq("id", task_id).execute()

        return {"success": True}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )
