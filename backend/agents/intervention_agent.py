"""
NEXUS Intervention Agent
------------------------
Evaluates risk metrics for every active goal. When velocity deficit
exceeds the threshold, it:
  1. Logs the failure event to Supabase
  2. Calls the ReplanningAgent to auto-reschedule tasks
  3. Fires the OutreachAgent → WhatsApp message to the user

This is the agent that makes NEXUS autonomous — it acts without
the user opening the app.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from .outreach_agent import outreach_agent

logger = logging.getLogger(__name__)

# Risk thresholds
CRITICAL_VELOCITY_DEFICIT = 0.4   # actual < 40% of required → critical
WARNING_VELOCITY_DEFICIT  = 0.65  # actual < 65% of required → warning
DEADLINE_ALERT_HOURS      = 24    # fire deadline alert when < 24h remain


class InterventionAgent:
    """
    Monitors all active goals and intervenes when metrics deteriorate.
    Called by the Orchestrator on each pipeline run.
    """

    def __init__(self, supabase_client=None, replanning_agent=None):
        self.db = supabase_client
        self.replanning_agent = replanning_agent

    # ------------------------------------------------------------------
    # Main entry point (called by orchestrator)
    # ------------------------------------------------------------------

    async def evaluate_all_goals(self, user_id: str) -> list[dict]:
        """
        Fetch all active goals for the user, evaluate risk, intervene
        where necessary. Returns a list of intervention reports.
        """
        goals = await self._fetch_active_goals(user_id)
        reports = []

        for goal in goals:
            report = await self._evaluate_goal(goal)
            reports.append(report)

        return reports

    async def evaluate_goal(self, goal: dict) -> dict:
        """Evaluate a single goal. Can be called directly by the orchestrator."""
        return await self._evaluate_goal(goal)

    # ------------------------------------------------------------------
    # Core evaluation logic
    # ------------------------------------------------------------------

    async def _evaluate_goal(self, goal: dict) -> dict:
        goal_id    = goal["id"]
        goal_title = goal["title"]
        deadline   = goal.get("deadline", "")

        metrics = self._compute_metrics(goal)
        risk_level = self._classify_risk(metrics)

        report = {
            "goal_id":    goal_id,
            "goal_title": goal_title,
            "risk_level": risk_level,
            "metrics":    metrics,
            "actions":    [],
            "timestamp":  datetime.utcnow().isoformat(),
        }

        # ── Critical deficit → replan + WhatsApp ──────────────────────
        if risk_level == "critical":
            logger.warning(f"InterventionAgent: CRITICAL risk on goal '{goal_title}'")

            rescheduled = []
            if self.replanning_agent:
                try:
                    rescheduled = await self.replanning_agent.reschedule_overdue_tasks(goal_id)
                    report["actions"].append(f"Rescheduled {len(rescheduled)} tasks")
                except Exception as e:
                    logger.error(f"InterventionAgent: Replanning failed — {e}")

            # Fire WhatsApp outreach
            outreach_result = await outreach_agent.notify_velocity_deficit(
                goal_id=goal_id,
                goal_title=goal_title,
                days_behind=metrics["days_behind"],
                rescheduled_tasks=rescheduled,
                deadline=deadline,
                progress_pct=metrics["completion_pct"],
            )
            report["actions"].append(
                f"WhatsApp alert {'sent ✓' if outreach_result['sent'] else 'skipped: ' + outreach_result['reason']}"
            )
            report["outreach"] = outreach_result

        # ── Deadline approaching (<24h) ───────────────────────────────
        elif risk_level == "deadline_imminent":
            hours_left = metrics.get("hours_to_deadline", 0)
            completion = metrics.get("completion_pct", 0)

            outreach_result = await outreach_agent.notify_deadline_approaching(
                goal_id=goal_id,
                goal_title=goal_title,
                hours_remaining=int(hours_left),
                completion_pct=completion,
            )
            report["actions"].append(
                f"Deadline alert {'sent ✓' if outreach_result['sent'] else 'skipped'}"
            )
            report["outreach"] = outreach_result

        # ── Goal completed ────────────────────────────────────────────
        elif risk_level == "completed":
            await outreach_agent.notify_goal_completed(goal_id, goal_title)
            report["actions"].append("Completion celebration sent")

        return report

    # ------------------------------------------------------------------
    # Metrics calculation
    # ------------------------------------------------------------------

    def _compute_metrics(self, goal: dict) -> dict:
        # Check if tasks are pre-loaded or count is directly accessible
        tasks = goal.get("tasks", [])
        total_tasks = len(tasks) if isinstance(tasks, list) else 0
        completed_tasks = len([t for t in tasks if t.get("status") == "completed"]) if isinstance(tasks, list) else 0

        # If count property was requested instead of full task list
        if total_tasks == 0 and "tasks" in goal and isinstance(goal["tasks"], list) and len(goal["tasks"]) > 0:
            if "count" in goal["tasks"][0]:
                total_tasks = goal["tasks"][0]["count"]

        # Fallback to direct count queries from Supabase if counts are 0
        if total_tasks == 0:
            try:
                from db.client import supabase
                res = supabase.table("tasks").select("id, status").eq("goal_id", goal["id"]).execute()
                all_tasks = res.data or []
                total_tasks = len(all_tasks)
                completed_tasks = len([t for t in all_tasks if t.get("status") == "completed"])
            except Exception as e:
                logger.error(f"InterventionAgent: Failed to count tasks from DB — {e}")

        deadline_str    = goal.get("deadline")
        start_date_str  = goal.get("created_at")

        if total_tasks == 0:
            return {"completion_pct": 0, "days_behind": 0, "velocity_ratio": 1.0}

        completion_pct = (completed_tasks / total_tasks) * 100

        # Parse dates
        now = datetime.utcnow()
        deadline = self._parse_date(deadline_str) or (now + timedelta(days=7))
        start    = self._parse_date(start_date_str) or now

        total_days    = max((deadline - start).days, 1)
        elapsed_days  = max((now - start).days, 1)
        days_to_go    = max((deadline - now).days, 0)
        hours_to_go   = max((deadline - now).total_seconds() / 3600, 0)

        # Expected completion at this point in time
        expected_pct  = min((elapsed_days / total_days) * 100, 100)

        # Velocity ratio: 1.0 = exactly on track, <1.0 = behind
        velocity_ratio = (completion_pct / expected_pct) if expected_pct > 0 else 1.0

        # How many days behind schedule
        if velocity_ratio < 1.0 and total_days > 0:
            days_behind = (1 - velocity_ratio) * elapsed_days
        else:
            days_behind = 0.0

        # Required tasks/day from today to hit deadline
        remaining_tasks   = total_tasks - completed_tasks
        required_velocity = remaining_tasks / max(days_to_go, 1)

        # Actual velocity (tasks/day over elapsed days)
        actual_velocity = completed_tasks / max(elapsed_days, 1)

        return {
            "completion_pct":    round(completion_pct, 1),
            "expected_pct":      round(expected_pct, 1),
            "velocity_ratio":    round(velocity_ratio, 3),
            "days_behind":       round(days_behind, 1),
            "days_to_deadline":  days_to_go,
            "hours_to_deadline": hours_to_go,
            "required_velocity": round(required_velocity, 2),
            "actual_velocity":   round(actual_velocity, 2),
        }

    def _classify_risk(self, metrics: dict) -> str:
        pct   = metrics.get("completion_pct", 0)
        ratio = metrics.get("velocity_ratio", 1.0)
        hours = metrics.get("hours_to_deadline", 999)

        if pct >= 100:
            return "completed"
        if hours <= DEADLINE_ALERT_HOURS and pct < 95:
            return "deadline_imminent"
        if ratio < CRITICAL_VELOCITY_DEFICIT:
            return "critical"
        if ratio < WARNING_VELOCITY_DEFICIT:
            return "warning"
        return "healthy"

    # ------------------------------------------------------------------
    # DB helpers
    # ------------------------------------------------------------------

    async def _fetch_active_goals(self, user_id: str) -> list[dict]:
        if not self.db:
            logger.warning("InterventionAgent: No Supabase client — returning empty goals")
            return []
        try:
            result = (
                self.db.table("goals")
                .select("*, tasks(*)")
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"InterventionAgent: DB fetch failed — {e}")
            return []

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        if not date_str:
            return None
        # Strip timezone info for naive datetime comparison
        # Supabase returns dates like "2026-06-28T12:39:19.135405+00:00"
        clean = date_str.replace("+00:00", "").replace("Z", "")
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(clean, fmt)
            except ValueError:
                continue
        return None


# ── Compatibility Wrapper for Orchestrator ───────────────────────────────

async def run_intervention_agent(
    goal_id: str,
    failure_probability: float,
    risk_factors: list = None,
    velocity_actual: float = 0,
    velocity_required: float = 0
) -> dict:
    """
    Main entry point for orchestrator pipelines.
    Maintains compatibility with orchestrator imports and updates DB tables.
    """
    from db.client import supabase
    import agents.replanning_agent as replanning_module

    agent = InterventionAgent(supabase_client=supabase, replanning_agent=replanning_module)

    try:
        # Fetch goal
        goal_res = supabase.table("goals").select("*").eq("id", goal_id).single().execute()
        goal = goal_res.data
        if not goal:
            return {"action": "skipped", "reason": f"Goal {goal_id} not found"}

        # Evaluate
        report = await agent.evaluate_goal(goal)
        risk_level = report["risk_level"]

        # Insert intervention record into db to match frontend expectations
        if risk_level in ("warning", "critical", "deadline_imminent"):
            severity_label = "🟡 WARNING"
            itype = "warning"
            if risk_level == "critical":
                severity_label = "🔴 EMERGENCY"
                itype = "emergency"
            elif risk_level == "deadline_imminent":
                severity_label = "🟠 CRITICAL"
                itype = "critical"

            rec = f"Intervention triggered. {', '.join(report['actions']) or 'Review study pace.'}"

            # Create intervention record
            supabase.table("interventions").insert({
                "goal_id": goal_id,
                "intervention_type": itype,
                "failure_probability": failure_probability,
                "message": f"You are at risk of missing '{goal['title']}'. Current risk level: {risk_level}.",
                "proposed_plan": {
                    "risk_factors": risk_factors or [],
                    "recommendation": rec,
                    "severity": severity_label,
                    "velocity_gap": {
                        "actual": round(velocity_actual, 2),
                        "required": round(velocity_required, 2),
                    }
                },
                "status": "pending"
            }).execute()

            return {
                "action": "created",
                "type": itype,
                "actions_taken": report["actions"]
            }

        return {
            "action": "evaluated",
            "type": "none",
            "risk_level": risk_level
        }

    except Exception as e:
        logger.error(f"run_intervention_agent compatibility wrapper failed — {e}")
        return {"action": "error", "error": str(e)}
