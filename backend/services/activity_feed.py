"""
NEXUS Agent Activity Feed
--------------------------
Stores and retrieves a chronological log of every agent action across
all goals. Powers the right-sidebar Activity Feed on the dashboard.

Each action is stored in Supabase `agent_activity` table and also
emitted via SSE for real-time updates without polling.
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, AsyncGenerator

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from db.client import supabase as default_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/activity", tags=["Activity Feed"])

# In-memory queue for SSE broadcast (per user)
_activity_queues: dict[str, asyncio.Queue] = {}

# Agent display metadata
AGENT_META = {
    "orchestrator":         {"icon": "🔵", "color": "#6366f1"},
    "master_orchestrator":   {"icon": "🔵", "color": "#6366f1"},
    "scheduling":           {"icon": "🟠", "color": "#f97316"},
    "progress_tracking":    {"icon": "🟢", "color": "#22c55e"},
    "intervention":         {"icon": "🔴", "color": "#ef4444"},
    "replanning":           {"icon": "🟣", "color": "#a855f7"},
    "outreach":             {"icon": "📱", "color": "#06b6d4"},
    "syllabus":             {"icon": "📷", "color": "#eab308"},
    "resource_curation":    {"icon": "📚", "color": "#14b8a6"},
    "calendar":             {"icon": "📅", "color": "#3b82f6"},
    "goal_ingestion":       {"icon": "📥", "color": "#3b82f6"},
    "task_decomposition":   {"icon": "📝", "color": "#6366f1"},
    "failure_prediction":   {"icon": "🔮", "color": "#ef4444"},
    "insight":              {"icon": "💡", "color": "#eab308"},
}

def get_agent_meta(agent_name: str) -> dict:
    normalized = agent_name.lower().replace(" agent", "").replace(" ", "_")
    return AGENT_META.get(normalized, AGENT_META.get(agent_name.lower(), {"icon": "⚙️", "color": "#6b7280"}))


# ── Log an activity (called by all agents) ───────────────────────────────────

async def log_activity(
    user_id: str,
    agent_name: str,
    action_type: str,
    message: str,
    goal_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    supabase=None,
):
    """
    Universal activity logger. Call this from every agent to record actions.
    """
    if not supabase:
        supabase = default_supabase

    entry = {
        "id":          f"{agent_name}-{datetime.utcnow().timestamp()}",
        "user_id":     user_id,
        "goal_id":     goal_id,
        "agent_name":  agent_name,
        "action_type": action_type,
        "message":     message,
        "metadata":    metadata or {},
        "created_at":  datetime.utcnow().isoformat(),
        "agent_meta":  get_agent_meta(agent_name),
    }

    # Persist to Supabase
    if supabase:
        try:
            supabase.table("agent_activity").insert({
                "user_id":     user_id,
                "goal_id":     goal_id,
                "agent_name":  agent_name,
                "action_type": action_type,
                "message":     message,
                "metadata":    metadata or {},
            }).execute()
        except Exception as e:
            logger.error(f"ActivityFeed: Supabase insert failed — {e}")
            # Fallback: persist as an event in the existing agent_events table
            try:
                if goal_id:
                    supabase.table("agent_events").insert({
                        "goal_id": goal_id,
                        "agent_name": agent_name,
                        "event_type": action_type,
                        "message": message,
                        "data": metadata or {},
                    }).execute()
            except Exception as e2:
                logger.error(f"ActivityFeed: Fallback insert failed — {e2}")

    # Broadcast to SSE subscribers
    queue = _activity_queues.get(user_id)
    if queue:
        try:
            queue.put_nowait(entry)
        except asyncio.QueueFull:
            pass  # Drop if queue is full

    logger.info(f"[{agent_name.upper()}] {message}")
    return entry


# ── REST endpoint: fetch recent activity ─────────────────────────────────────

@router.get("/recent")
async def get_recent_activity(
    user_id: str = Query(...),
    limit: int = Query(default=50, le=100),
    hours: int = Query(default=24),
):
    """
    Fetch recent agent activity for the dashboard feed.
    Returns newest first.
    """
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    supabase = default_supabase

    if not supabase:
        return {"activities": _get_demo_activities()}

    try:
        result = (
            supabase.table("agent_activity")
            .select("*")
            .eq("user_id", user_id)
            .gte("created_at", since)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        activities = result.data or []

        # Enrich with display metadata
        for a in activities:
            a["agent_meta"] = get_agent_meta(a.get("agent_name", ""))

        return {"activities": activities}

    except Exception as e:
        logger.error(f"ActivityFeed: fetch failed — {e}")
        # Try to fall back to agent_events table before going to static demo data
        try:
            goals_res = supabase.table("goals").select("id").eq("user_id", user_id).execute()
            goal_ids = [g["id"] for g in (goals_res.data or [])]
            if goal_ids:
                events_res = (
                    supabase.table("agent_events")
                    .select("*")
                    .in_("goal_id", goal_ids)
                    .gte("created_at", since)
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                activities = []
                for ev in (events_res.data or []):
                    activities.append({
                        "id": ev.get("id"),
                        "user_id": user_id,
                        "goal_id": ev.get("goal_id"),
                        "agent_name": ev.get("agent_name"),
                        "action_type": ev.get("event_type"),
                        "message": ev.get("message"),
                        "metadata": ev.get("data") or {},
                        "created_at": ev.get("created_at"),
                        "agent_meta": get_agent_meta(ev.get("agent_name", ""))
                    })
                return {"activities": activities}
        except Exception as fallback_err:
            logger.error(f"ActivityFeed: Fallback to agent_events failed — {fallback_err}")
            
        # Fall back to demo activities if table doesn't exist yet
        return {"activities": _get_demo_activities(), "warning": "Using demo data. Table may not exist."}


# ── SSE endpoint: live activity stream ───────────────────────────────────────

@router.get("/stream")
async def stream_activity(user_id: str = Query(...)):
    """
    SSE endpoint. Frontend connects once and receives all agent activity
    in real time without polling.
    """
    # Create a queue for this user
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _activity_queues[user_id] = queue

    async def event_gen() -> AsyncGenerator[str, None]:
        try:
            # Send recent history on connect
            yield f"event: connected\ndata: {json.dumps({'status': 'ok', 'user_id': user_id})}\n\n"

            while True:
                try:
                    entry = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"event: activity\ndata: {json.dumps(entry)}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            # Cleanup on disconnect
            _activity_queues.pop(user_id, None)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Demo data (for seeder / judges with no real activity) ───────────────────

def _get_demo_activities() -> list[dict]:
    now = datetime.utcnow()
    return [
        {
            "id": "demo-1",
            "agent_name": "orchestrator",
            "action_type": "pipeline_start",
            "message": 'Decomposed "OS Exam Prep" into 6 milestones',
            "created_at": (now - timedelta(minutes=2)).isoformat(),
            "agent_meta": AGENT_META["orchestrator"],
        },
        {
            "id": "demo-2",
            "agent_name": "scheduling",
            "action_type": "plan_created",
            "message": "Built 14-day plan (42 tasks, 3h/day)",
            "created_at": (now - timedelta(minutes=2)).isoformat(),
            "agent_meta": AGENT_META["scheduling"],
        },
        {
            "id": "demo-3",
            "agent_name": "calendar",
            "action_type": "events_published",
            "message": "Published 3 study blocks to Google Calendar",
            "created_at": (now - timedelta(minutes=1)).isoformat(),
            "agent_meta": AGENT_META["calendar"],
        },
        {
            "id": "demo-4",
            "agent_name": "progress_tracking",
            "action_type": "velocity_check",
            "message": "Velocity: 2.1 tasks/day vs 3.0 required",
            "created_at": (now - timedelta(seconds=45)).isoformat(),
            "agent_meta": AGENT_META["progress_tracking"],
        },
        {
            "id": "demo-5",
            "agent_name": "intervention",
            "action_type": "risk_flagged",
            "message": 'CRITICAL: "Memory Management" at 23% velocity deficit',
            "created_at": (now - timedelta(seconds=30)).isoformat(),
            "agent_meta": AGENT_META["intervention"],
        },
        {
            "id": "demo-6",
            "agent_name": "outreach",
            "action_type": "whatsapp_sent",
            "message": "WhatsApp alert dispatched — awaiting user reply",
            "created_at": (now - timedelta(seconds=10)).isoformat(),
            "agent_meta": AGENT_META["outreach"],
        },
    ]
