from dotenv import load_dotenv
load_dotenv(override=True)

import os
from fastapi import FastAPI, Request, Form as FormParam
from fastapi.middleware.cors import CORSMiddleware
from api.routes import goals, tasks, interventions, health, insights, settings

# Phase 2 routes & agents
from agents.syllabus_agent import router as syllabus_router
from services.gemini_streaming_service import router as streaming_router
from services.activity_feed import router as activity_router
from agents.outreach_agent import outreach_agent

app = FastAPI(
    title="NEXUS API",
    description="Autonomous Execution Intelligence API — "
                "Multi-agent system for goal execution, "
                "failure prediction, and proactive intervention.",
    version="2.0.0"
)

import asyncio
from jobs.scheduler import start_autonomous_scheduler

@app.on_event("startup")
async def startup_event():
    # Start autonomous scheduler loop in the background
    asyncio.create_task(start_autonomous_scheduler())

# Allow both local and deployed origins
origins = [
    "http://localhost:3000",
    "https://localhost:3000",
]

# Add deployed frontend URL if set
deployed_url = os.environ.get("FRONTEND_URL")
if deployed_url:
    origins.append(deployed_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    health.router, prefix="/api/health", tags=["health"]
)
app.include_router(
    goals.router, prefix="/api/goals", tags=["goals"]
)
app.include_router(
    tasks.router, prefix="/api/tasks", tags=["tasks"]
)
app.include_router(
    interventions.router, prefix="/api/interventions",
    tags=["interventions"]
)
app.include_router(
    insights.router, prefix="/api/insights", tags=["insights"]
)
app.include_router(
    settings.router, prefix="/api/settings", tags=["settings"]
)

# New Phase 2 routes
app.include_router(syllabus_router)   # POST /api/agents/syllabus/parse
app.include_router(streaming_router)  # GET  /api/agents/stream/{goal_id}
app.include_router(activity_router)   # GET  /api/activity/recent + /api/activity/stream


@app.get("/")
async def root():
    """API health check and info endpoint."""
    return {
        "service": "NEXUS API",
        "version": "1.0.0",
        "status": "healthy",
        "agents": [
            "Master Orchestrator",
            "Goal Ingestion Agent",
            "Task Decomposition Agent",
            "Scheduling Agent",
            "Progress Tracking Agent",
            "Failure Prediction Agent",
            "Replanning Agent",
            "Intervention Agent",
            "Insight Agent"
        ],
        "google_technologies": [
            "Gemini 2.0 Flash",
            "Gemini 1.5 Pro",
            "Google Cloud Run",
            "Google Cloud Build"
        ]
    }


@app.post("/api/webhook/whatsapp")
async def whatsapp_webhook(
    request: Request,
    Body: str = FormParam(default=""),
    From: str = FormParam(default=""),
):
    """
    Twilio sends a POST here when the user replies to a WhatsApp message.
    Parse YES/NO and update Supabase accordingly.
    """
    reply = Body.strip().upper()
    sender = From.replace("whatsapp:", "")

    if reply == "YES":
        # User confirmed the reschedule — mark tasks as rescheduled in DB
        response_msg = (
            "✅ Got it! Your tasks have been rescheduled. "
            "Check NEXUS for the updated plan. You've got this! 💪"
        )
        # TODO: update Supabase task dates here
        # await confirm_reschedule(sender)

    elif reply == "NO":
        response_msg = (
            "No problem! Open NEXUS to pick new times manually. "
            "Your agents are standing by 🤖"
        )
    else:
        response_msg = (
            "Reply *YES* to confirm the reschedule or *NO* to pick times in the app."
        )

    # Respond via Twilio TwiML
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{response_msg}</Message>
</Response>"""

    from fastapi.responses import Response
    return Response(content=twiml, media_type="application/xml")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
