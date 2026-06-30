import asyncio
import logging
import os
from db.client import supabase
from agents.orchestrator import orchestrate_analysis

logger = logging.getLogger(__name__)

async def start_autonomous_scheduler(interval_seconds: int = 3600):
    """
    Background loop that runs orchestrate_analysis periodically for all active goals.
    This calculates execution health, failure probability, and automatically fires
    outreach reminders (WhatsApp, Pushover, Telegram) if user falls behind schedule.
    """
    # Wait a few seconds for FastAPI startup to fully settle
    await asyncio.sleep(10)
    print("NEXUS Autonomous Scheduler task initialized.", flush=True)
    logger.info("NEXUS Autonomous Scheduler task initialized.")

    while True:
        try:
            print("Autonomous Scheduler: Running periodic checks...", flush=True)
            logger.info("Autonomous Scheduler: Running periodic checks...")
            # Get all active goals
            res = supabase.table("goals").select("id, title").eq("status", "active").execute()
            active_goals = res.data or []
            
            if active_goals:
                for goal in active_goals:
                    goal_id = goal["id"]
                    goal_title = goal["title"]
                    try:
                        print(f"Autonomous Scheduler: Evaluating goal '{goal_title}' ({goal_id})", flush=True)
                        logger.info(f"Autonomous Scheduler: Evaluating goal '{goal_title}' ({goal_id})")
                        # Triggers PTA (Progress) -> FPA (Prediction) -> IA (Intervention/Outreach) if needed
                        await orchestrate_analysis(goal_id)
                    except Exception as e:
                        print(f"Autonomous Scheduler: Failed to analyze goal '{goal_title}': {e}", flush=True)
                        logger.error(f"Autonomous Scheduler: Failed to analyze goal '{goal_title}': {e}")
            else:
                print("Autonomous Scheduler: No active goals found.", flush=True)
                logger.info("Autonomous Scheduler: No active goals found.")

        except Exception as e:
            print(f"Autonomous Scheduler error: {e}", flush=True)
            logger.error(f"Autonomous Scheduler error: {e}")

        # Sleep until next check (defaults to 1 hour)
        await asyncio.sleep(interval_seconds)

