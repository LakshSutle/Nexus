import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db.client import supabase
from agents.orchestrator import (
    orchestrate_goal_creation,
    orchestrate_analysis
)
from agents.goal_ingestion_agent import log_agent_event
from services.gemini_service import call_gemini

logger = logging.getLogger(__name__)
router = APIRouter()


class VoiceParseRequest(BaseModel):
    transcript: str


class CalendarSyncRequest(BaseModel):
    access_token: Optional[str] = None


class SeedDemoRequest(BaseModel):
    user_id: str
    email: str


class GoalCreate(BaseModel):
    title: str
    deadline: str
    daily_hours: float
    user_id: str
    description: Optional[str] = None



@router.post("")
async def create_goal(goal: GoalCreate):
    try:
        result = supabase.table("goals").insert({
            "title": goal.title,
            "deadline": goal.deadline,
            "daily_hours_available": goal.daily_hours,
            "user_id": goal.user_id,
            "description": goal.description,
            "status": "active",
            "failure_probability": 0.0,
            "execution_health_score": 100
        }).execute()

        return {"goal": result.data[0]}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.get("")
async def get_goals(user_id: str):
    try:
        result = supabase.table("goals") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("status", "active") \
            .execute()
        return {"goals": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.get("/{goal_id}")
async def get_goal(goal_id: str):
    try:
        result = supabase.table("goals") \
            .select("*, milestones(*), tasks(*)") \
            .eq("id", goal_id) \
            .single() \
            .execute()
        return {"goal": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/{goal_id}/generate")
async def generate_plan(
    goal_id: str,
    file: Optional[UploadFile] = File(None)
):
    """Generate a full execution plan using the orchestrator pipeline."""
    try:
        # Get goal from DB
        goal_result = supabase.table("goals") \
            .select("*") \
            .eq("id", goal_id) \
            .single() \
            .execute()
        goal = goal_result.data

        # Read file bytes if uploaded
        file_bytes = None
        if file:
            file_bytes = await file.read()

        # Run the full orchestration pipeline
        # GIA → TDA → SA → FPA
        result = await orchestrate_goal_creation(
            goal_id=goal_id,
            goal_title=goal["title"],
            deadline=goal["deadline"],
            daily_hours=goal["daily_hours_available"],
            document_bytes=file_bytes,
            user_id=goal.get("user_id")
        )

        return {
            "success": result.get("success", False),
            "goal_id": goal_id,
            "total_tasks": result.get("total_tasks", 0),
            "stages": result.get("stages", [])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.get("/{goal_id}/agents")
async def get_agent_events(goal_id: str):
    try:
        result = supabase.table("agent_events") \
            .select("*") \
            .eq("goal_id", goal_id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return {"events": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.get("/{goal_id}/focus")
async def get_focus_tasks(goal_id: str):
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        # Get today's tasks + any overdue tasks
        result = supabase.table("tasks") \
            .select("*") \
            .eq("goal_id", goal_id) \
            .lte("scheduled_date", today) \
            .eq("status", "pending") \
            .order("scheduled_date") \
            .limit(5) \
            .execute()
        return {"tasks": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/parse-voice")
async def parse_voice(request: VoiceParseRequest):
    """
    Parse spoken audio transcripts using Gemini 2.0 Flash
    to extract structured goal details.
    """
    prompt = f"""You are a parse assistant for an execution intelligence system.
A user has spoken their goal and study/work constraints. Analyze the transcript and extract:
1. title: A concise, actionable title for the goal (e.g. "Prepare for Data Structures Exam", "Build MVP Launch").
2. days_to_deadline: Estimate the number of days until the deadline mentioned. For example, "in two weeks" is 14, "by next Friday" (if today is Friday, it's 7; else calculate relative, but since you don't know the exact weekday, assume ~7 days). If they mention a date like "July 12" and today is late June (e.g. June 26), calculate days remaining. If no deadline timeframe is specified, default to 7. Return an integer.
3. daily_hours: The number of hours the user can commit daily. If they mention "3 hours a day", output 3.0. If not specified, default to 2.0.
4. description: A summary of the goal context, details, syllabus topics, or PRD parameters mentioned in the speech.

Return ONLY valid JSON matching this schema:
{{
  "title": "...",
  "days_to_deadline": 14,
  "daily_hours": 3.0,
  "description": "..."
}}

Spoken transcript:
"{request.transcript}"
"""
    try:
        result = await call_gemini(prompt, use_flash=True)
        return result
    except Exception as e:
        # Fallback parsing logic if Gemini API is rate-limited (429) or offline
        logger.warning(f"Voice parsing failed ({e}). Using regex fallback logic.")
        
        # Simple heuristics/regex fallback to extract basic fields from transcript
        transcript_lower = request.transcript.lower()
        
        # Extract title (first few words or default)
        title = request.transcript.strip()
        if len(title) > 60:
            title = title[:57] + "..."
            
        # Extract daily hours
        daily_hours = 2.0
        import re
        hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hour|hr)', transcript_lower)
        if hours_match:
            try:
                daily_hours = float(hours_match.group(1))
            except ValueError:
                pass
                
        # Extract days to deadline
        days_to_deadline = 7
        if "week" in transcript_lower:
            weeks_match = re.search(r'(\d+)\s*week', transcript_lower)
            if weeks_match:
                try:
                    days_to_deadline = int(weeks_match.group(1)) * 7
                except ValueError:
                    days_to_deadline = 14
            else:
                days_to_deadline = 14
        elif "day" in transcript_lower:
            days_match = re.search(r'(\d+)\s*day', transcript_lower)
            if days_match:
                try:
                    days_to_deadline = int(days_match.group(1))
                except ValueError:
                    pass

        return {
            "title": title,
            "days_to_deadline": days_to_deadline,
            "daily_hours": daily_hours,
            "description": f"Extracted via backup parser. Transcript: {request.transcript}"
        }


@router.post("/{goal_id}/sync-calendar")
async def sync_calendar(goal_id: str, request: CalendarSyncRequest):
    """
    Sync all pending tasks for a goal with Google Calendar
    using the provided Google access token.
    """
    try:
        from services.calendar_service import sync_goal_tasks_to_calendar
        access_token = request.access_token

        # Get goal owner user_id
        goal_res = supabase.table("goals").select("user_id").eq("id", goal_id).single().execute()
        goal = goal_res.data
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        user_id = goal["user_id"]

        # Check if Google Calendar integration is enabled in settings (kill-switch)
        try:
            settings_check = supabase.table("user_settings").select("google_calendar_enabled").eq("user_id", user_id).execute()
            if not settings_check.data or not settings_check.data[0].get("google_calendar_enabled", False):
                raise HTTPException(
                    status_code=400,
                    detail="Google Calendar sync is currently disabled in Settings."
                )
        except HTTPException:
            raise
        except Exception as ce:
            print(f"Failed to check calendar settings toggle: {ce}")

        if access_token:
            # Save/update access token in user_settings table
            try:
                settings_res = supabase.table("user_settings").select("id").eq("user_id", user_id).execute()
                if settings_res.data:
                    supabase.table("user_settings").update({
                        "google_access_token": access_token,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("user_id", user_id).execute()
                else:
                    supabase.table("user_settings").insert({
                        "user_id": user_id,
                        "google_access_token": access_token
                    }).execute()
            except Exception as se:
                print(f"Failed to save Google access token in settings: {se}")
        else:
            # Try to load saved access token from user_settings table
            try:
                settings_res = supabase.table("user_settings").select("google_access_token").eq("user_id", user_id).single().execute()
                if settings_res.data and settings_res.data.get("google_access_token"):
                    access_token = settings_res.data["google_access_token"]
                else:
                    raise ValueError("No saved access token found")
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail="Google calendar not linked. Please sign in with Google to link your account."
                )

        synced_count = await sync_goal_tasks_to_calendar(access_token, goal_id)
        return {"success": True, "synced_count": synced_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


class CalendarSyncFromRequest(BaseModel):
    access_token: Optional[str] = None
    user_id: str


@router.post("/sync-from-calendar")
async def sync_from_calendar(request: CalendarSyncFromRequest):
    """
    Fetch manual goals (prefixed with NEXUS:) from Google Calendar
    and import them into NEXUS database and orchestrate plans.
    """
    try:
        from services.calendar_service import sync_goals_from_calendar
        access_token = request.access_token
        user_id = request.user_id

        # Check if Google Calendar integration is enabled in settings (kill-switch)
        try:
            settings_check = supabase.table("user_settings").select("google_calendar_enabled").eq("user_id", user_id).execute()
            if not settings_check.data or not settings_check.data[0].get("google_calendar_enabled", False):
                return {"success": False, "imported_count": 0, "reason": "Google Calendar sync is currently disabled in Settings."}
        except Exception as ce:
            print(f"Failed to check calendar settings toggle: {ce}")

        if access_token:
            # Save/update access token in user_settings
            try:
                settings_res = supabase.table("user_settings").select("id").eq("user_id", user_id).execute()
                if settings_res.data:
                    supabase.table("user_settings").update({
                        "google_access_token": access_token,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("user_id", user_id).execute()
                else:
                    supabase.table("user_settings").insert({
                        "user_id": user_id,
                        "google_access_token": access_token
                    }).execute()
            except Exception as se:
                print(f"Failed to save Google access token: {se}")
        else:
            # Load access token
            try:
                settings_res = supabase.table("user_settings").select("google_access_token").eq("user_id", user_id).single().execute()
                if settings_res.data and settings_res.data.get("google_access_token"):
                    access_token = settings_res.data["google_access_token"]
                else:
                    raise ValueError("No saved access token found")
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail="Google calendar not linked. Please sign in with Google."
                )

        imported = await sync_goals_from_calendar(access_token, user_id)
        return {"success": True, "imported_count": len(imported), "imported_goals": imported}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )



@router.post("/seed-demo")
async def seed_demo_endpoint(request: SeedDemoRequest):
    """
    Seed a demo goal ("Pass Data Structures Final Exam") for the specified user.
    """
    try:
        from db.seed_demo import seed_demo_data
        await seed_demo_data(request.user_id, request.email)
        return {"success": True, "message": "Demo data successfully seeded."}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/clear-demo")
async def clear_demo_endpoint(request: SeedDemoRequest):
    """
    Clear only the seeded demo goal and associated cascading data for the specified user.
    """
    try:
        # Delete only the seeded demo goal (title: "Pass Data Structures Final Exam") for this user
        # This will trigger CASCADE delete on milestones, tasks, interventions, agent_events
        supabase.table("goals").delete() \
            .eq("user_id", request.user_id) \
            .eq("title", "Pass Data Structures Final Exam") \
            .execute()
        return {"success": True, "message": "Demo data successfully cleared."}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )




