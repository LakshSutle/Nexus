"""
NEXUS Outreach Agent
--------------------
Proactively contacts the user via WhatsApp (Twilio) when the Intervention
Agent flags a velocity deficit. This is the agent that makes NEXUS feel
genuinely autonomous — it reaches out WITHOUT the user opening the app.

ENV vars required (add to .env):
  TWILIO_ACCOUNT_SID   = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN    = your_auth_token
  TWILIO_WHATSAPP_FROM = whatsapp:+14155238886   # Twilio sandbox number
  TWILIO_WHATSAPP_TO   = whatsapp:+91XXXXXXXXXX  # User's number
"""

import os
import logging
from datetime import datetime
from typing import Optional
from services.gemini_service import call_gemini

try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

logger = logging.getLogger(__name__)


class OutreachAgent:
    """
    Autonomous outreach agent. Fires WhatsApp messages when risk thresholds
    are breached. Tracks sent messages to avoid spamming (1 alert per goal
    per 6-hour window).
    """

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv(
            "TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886"
        )
        self.to_number = os.getenv("TWILIO_WHATSAPP_TO")
        self.pushover_user_key = os.getenv("PUSHOVER_USER_KEY")

        if self.from_number:
            self.from_number = self.from_number.replace(" ", "")
        if self.to_number:
            self.to_number = self.to_number.replace(" ", "")

        # In-memory cooldown tracker: {goal_id: last_alert_timestamp}
        self._alert_cooldowns: dict[str, datetime] = {}
        self._cooldown_hours = 6

        self.mock_mode = os.getenv("MOCK_TWILIO", "false").lower() in ("true", "1", "yes")
        
        # Check if credentials are placeholder/default template values
        is_placeholder = (
            not self.account_sid or 
            self.account_sid.startswith("ACxxxx") or 
            self.auth_token == "your-twilio-auth-token" or
            "your_auth_token" in (self.auth_token or "") or
            "your_twilio" in (self.auth_token or "")
        )
        
        if is_placeholder or self.mock_mode:
            self.mock_mode = True
            logger.info("OutreachAgent: Running in MOCK mode (No Twilio charges or real Pushover notifications).")
            self.twilio_enabled = False
            self.enabled = True
        else:
            self.twilio_enabled = False
            if TWILIO_AVAILABLE and all([self.account_sid, self.auth_token, self.to_number]):
                try:
                    self.client = Client(self.account_sid, self.auth_token)
                    self.twilio_enabled = True
                except Exception as e:
                    logger.error(f"OutreachAgent: Twilio client initialization failed: {e}")
            
            self.enabled = self.twilio_enabled or bool(self.pushover_user_key)
            if not self.enabled:
                logger.warning(
                    "OutreachAgent: Neither Twilio nor Pushover credentials are fully configured in .env."
                )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def notify_velocity_deficit(
        self,
        goal_id: str,
        goal_title: str,
        days_behind: float,
        rescheduled_tasks: list[dict],
        deadline: str,
        progress_pct: float = 0.0,
        ignore_cooldown: bool = False,
        to_number_override: str | None = None,
        pushover_key_override: str | None = None,
        telegram_key_override: str | None = None,
        user_id_override: str | None = None,
    ) -> dict:
        """
        Called by InterventionAgent when velocity drops below threshold.
        """
        if not self.enabled:
            return {"sent": False, "reason": "No notification channels configured"}

        if not ignore_cooldown and self._is_on_cooldown(goal_id):
            return {"sent": False, "reason": "Cooldown active — already alerted recently"}

        message_body = await self._build_deficit_message(
            goal_title, days_behind, rescheduled_tasks, deadline, progress_pct, goal_id=goal_id
        )

        return await self._send(
            goal_id=goal_id,
            body=message_body,
            title=f"NEXUS Rescue Plan: {goal_title}",
            to_number_override=to_number_override,
            pushover_key_override=pushover_key_override,
            telegram_key_override=telegram_key_override,
            user_id_override=user_id_override
        )

    async def notify_goal_completed(
        self, goal_id: str, goal_title: str,
        to_number_override: str | None = None,
        pushover_key_override: str | None = None,
        telegram_key_override: str | None = None,
        user_id_override: str | None = None
    ) -> dict:
        """Celebratory message when a goal reaches 100% completion."""
        if not self.enabled:
            return {"sent": False, "reason": "No notification channels configured"}

        prompt = f"""
You are a world-class behavioral psychologist who specializes in habit reinforcement and intrinsic motivation.
Generate unique celebratory messages tailored for the three channels (WhatsApp, Pushover, and Telegram) for someone who just completed: "{goal_title}".

Channel-specific styles to follow:
- whatsapp: Short, deeply personal celebration. Use 2-3 sentences max. Use bold (*text*) for emphasis. Frame them as "the kind of person who finishes what they start". Sound like a close friend.
- pushover: Extremely brief smartwatch notification message (max 100 characters). High impact, celebratory, one-liner.
- telegram: Actionable bot message. Medium length, warm, conversational, 1-2 sentences.

Rules:
- Make sure each message is unique and tailored to the respective style.
- Use 1-2 emojis max.

Return ONLY a JSON object with this exact schema (no markdown, no backticks):
{{
  "whatsapp": "generated text for whatsapp",
  "pushover": "generated text for pushover smartwatch push",
  "telegram": "generated text for telegram bot"
}}
"""
        try:
            res = await call_gemini(prompt, use_flash=True, goal_id=goal_id)
            if isinstance(res, dict) and "whatsapp" in res and "pushover" in res and "telegram" in res:
                body = res
            else:
                raise ValueError("Invalid format")
        except Exception as e:
            logger.error(f"OutreachAgent: Gemini celebration generation failed ({e})")
            body = {
                "whatsapp": (
                    f"You actually did it. *{goal_title}* — done. 🔥\n\n"
                    f"Most people talk about goals. You finished yours. That's not luck, that's who you are.\n\n"
                    f"Your NEXUS agents are ready when you are. What's next?"
                ),
                "pushover": f"Goal Completed: {goal_title}! You finished what you started. 🎉",
                "telegram": f"Congratulations! You completed your goal: *{goal_title}* 🎉. Let's build on this momentum!"
            }

        return await self._send(
            goal_id=goal_id,
            body=body,
            title=f"Goal Completed: {goal_title} 🎉",
            to_number_override=to_number_override,
            pushover_key_override=pushover_key_override,
            telegram_key_override=telegram_key_override,
            user_id_override=user_id_override
        )

    async def notify_deadline_approaching(
        self, goal_id: str, goal_title: str, hours_remaining: int, completion_pct: float,
        to_number_override: str | None = None,
        pushover_key_override: str | None = None,
        telegram_key_override: str | None = None,
        user_id_override: str | None = None
    ) -> dict:
        """Final warning when deadline is <24h away and goal isn't done."""
        if not self.enabled:
            return {"sent": False, "reason": "No notification channels configured"}

        if self._is_on_cooldown(goal_id):
            return {"sent": False, "reason": "Cooldown active"}

        status = "on track ✅" if completion_pct >= 80 else "at risk ⚠️"
        
        prompt = f"""
You are an elite high-performance behavioral coach who specializes in breaking chronic procrastination and activating immediate action.
Generate unique motivational reminder notifications for the three channels (WhatsApp, Pushover, and Telegram) to make the user act on their goal.

Goal: "{goal_title}"
Time Left: {hours_remaining} hours
Progress: {completion_pct:.0f}%
Status: {status}

Channel-specific styles to follow:
- whatsapp: Direct, arresting opening sentence. Leverage loss aversion & hyper-low-friction triggers (2-minute rule, e.g. check off one subtask). 2-3 sentences max. Use bold (*text*) for emphasis.
- pushover: Extremely brief smartwatch notification message (max 100 characters) showing urgency and progress. Urgent, action-oriented, one-liner.
- telegram: Dynamic bot notification. Actionable, encouraging tone. 1-2 sentences.

Rules:
- Make sure each message is unique and tailored to the respective style.
- Use 1-2 emojis max.

Return ONLY a JSON object with this exact schema (no markdown, no backticks):
{{
  "whatsapp": "generated text for whatsapp",
  "pushover": "generated text for pushover smartwatch push",
  "telegram": "generated text for telegram bot"
}}
"""
        try:
            res = await call_gemini(prompt, use_flash=True, goal_id=goal_id)
            if isinstance(res, dict) and "whatsapp" in res and "pushover" in res and "telegram" in res:
                body = res
            else:
                raise ValueError("Invalid format")
        except Exception as e:
            logger.error(f"OutreachAgent: Gemini deadline generation failed ({e})")
            body = {
                "whatsapp": (
                    f"🚨 *Stop scrolling.* You are {completion_pct:.0f}% close to finishing *{goal_title}*, but only *{hours_remaining} hours* remain before it slips away.\n\n"
                    f"Don't waste the effort you've already put in. Open NEXUS right now and complete just *one* small task in the next 2 minutes. Momentum is everything. 🔥"
                ),
                "pushover": f"🚨 {hours_remaining}h left for {goal_title}! You're {completion_pct:.0f}% there. Complete 1 task now!",
                "telegram": f"⏰ Only *{hours_remaining} hours* left for *{goal_title}* ({completion_pct:.0f}% done). Open NEXUS now and complete one easy task. You've got this! 🔥"
            }

        return await self._send(
            goal_id=goal_id,
            body=body,
            title=f"Urgent: {goal_title} Deadline",
            to_number_override=to_number_override,
            pushover_key_override=pushover_key_override,
            telegram_key_override=telegram_key_override,
            user_id_override=user_id_override
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _build_deficit_message(
        self,
        goal_title: str,
        days_behind: float,
        rescheduled_tasks: list[dict],
        deadline: str,
        progress_pct: float = 0.0,
        goal_id: str = None,
    ) -> dict:
        days_str = f"{days_behind:.1f}" if days_behind % 1 != 0 else str(int(days_behind))

        # Build specific task list with names and dates
        task_lines = ""
        shown = rescheduled_tasks[:4]
        for t in shown:
            task_lines += f"  • {t.get('title', 'Task')} → {t.get('new_date', 'soon')}\n"
        if len(rescheduled_tasks) > 4:
            task_lines += f"  • ...and {len(rescheduled_tasks) - 4} more\n"

        prompt = f"""
You are an elite behavioral psychologist and high-performance coach. Write unique motivational alerts tailored for WhatsApp, Pushover, and Telegram to help the user rescue their slipping goal.

Context:
- Goal: "{goal_title}"
- Slippage: {days_str} days behind schedule
- Progress: {progress_pct:.0f}% complete
- Deadline: {deadline}
- Next upcoming tasks the user must do:
{task_lines.strip()}

Channel-specific styles to follow:
- whatsapp: Deeply personalized, mentions at least one specific task by name (e.g. "{shown[0].get('title', 'next task') if shown else 'task'}"). Uses task-specific hook, progress anchoring, and a 2-minute micro-win. 3-4 sentences max. Use bold (*text*) for emphasis.
- pushover: Extremely brief smartwatch notification message (max 100 characters). Urgent, task-oriented (can say e.g., "Rescue {goal_title}: Start {shown[0].get('title', 'next task') if shown else 'next task'}!"), one-liner.
- telegram: Dynamic, direct bot message referencing the upcoming task and the slippage. Actionable and encouraging, 1-2 sentences.

Rules:
- Make sure each message is unique and tailored to the respective style.
- Use 1-2 emojis max.

Return ONLY a JSON object with this exact schema (no markdown, no backticks):
{{
  "whatsapp": "generated text for whatsapp",
  "pushover": "generated text for pushover smartwatch push",
  "telegram": "generated text for telegram bot"
}}
"""
        try:
            res = await call_gemini(prompt, use_flash=True, goal_id=goal_id)
            if isinstance(res, dict) and "whatsapp" in res and "pushover" in res and "telegram" in res:
                return res
        except Exception as e:
            logger.error(f"OutreachAgent: Gemini motivational content generation failed ({e}). Using fallback template.")

        # Fallback: still references specific tasks
        first_task = shown[0].get("title", "your next task") if shown else "your next task"
        first_date = shown[0].get("new_date", "soon") if shown else "soon"
        
        return {
            "whatsapp": (
                f"Your *{first_task}* is due *{first_date}* and you're *{days_str} days behind* on *{goal_title}*. ⚡\n\n"
                f"You've already done {progress_pct:.0f}% — don't let that effort go to waste. "
                f"Open NEXUS right now and knock out *{first_task}* in one sitting. Your deadline is {deadline}.\n\n"
                f"Here's your rescue plan:\n"
                f"{task_lines}"
            ),
            "pushover": f"⚡ {days_str} days behind on {goal_title}! Start {first_task} now.",
            "telegram": f"⚡ You are *{days_str} days behind* on *{goal_title}*. Your next task *{first_task}* is waiting. Let's do it! 🚀"
        }

    async def _send(
        self,
        goal_id: str,
        body: str | dict,
        title: str = "NEXUS Alert",
        to_number_override: str | None = None,
        pushover_key_override: str | None = None,
        telegram_key_override: str | None = None,
        user_id_override: str | None = None
    ) -> dict:
        whatsapp_enabled = True
        pushover_enabled = True
        target_number = to_number_override or self.to_number
        pushover_user = pushover_key_override or self.pushover_user_key
        telegram_chat_id = telegram_key_override
        telegram_enabled = True

        # Unpack unique messages per channel if provided as a dict
        if isinstance(body, dict):
            whatsapp_body = body.get("whatsapp") or body.get("default") or str(body)
            pushover_body = body.get("pushover") or body.get("default") or str(body)
            telegram_body = body.get("telegram") or body.get("default") or str(body)
        else:
            whatsapp_body = body
            pushover_body = body
            telegram_body = body

        # Resolve user settings if possible
        user_id = user_id_override
        if not user_id and goal_id and goal_id != "test-goal-id":
            try:
                from db.client import supabase
                goal_res = supabase.table("goals").select("user_id").eq("id", goal_id).single().execute()
                if goal_res.data:
                    user_id = goal_res.data.get("user_id")
            except Exception as e:
                logger.error(f"OutreachAgent: Failed to fetch goal owner: {e}")

        if user_id:
            try:
                from db.client import supabase
                settings_res = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
                if settings_res.data and len(settings_res.data) > 0:
                    setts = settings_res.data[0]
                    whatsapp_enabled = setts.get("whatsapp_enabled", True)
                    pushover_enabled = setts.get("pushover_enabled", True)
                    telegram_enabled = setts.get("telegram_enabled", True)
                    if setts.get("whatsapp_number") and not to_number_override:
                        target_number = setts["whatsapp_number"]
                    if setts.get("pushover_user_key") and not pushover_key_override:
                        pushover_user = setts["pushover_user_key"]
                    if setts.get("telegram_chat_id") and not telegram_key_override:
                        telegram_chat_id = setts["telegram_chat_id"]
            except Exception as e:
                logger.error(f"OutreachAgent: Settings lookup failed: {e}")

        # Ensure whatsapp number format
        if target_number and not target_number.startswith("whatsapp:"):
            target_number = f"whatsapp:{target_number}"

        results = {}

        # 1. Dispatch WhatsApp
        if whatsapp_enabled and target_number and (self.twilio_enabled or self.mock_mode):
            whatsapp_res = self._send_whatsapp(goal_id, whatsapp_body, target_number)
            results["whatsapp"] = whatsapp_res
        else:
            results["whatsapp"] = {"sent": False, "reason": "disabled_or_missing_config"}

        # 2. Dispatch Pushover
        if pushover_enabled and pushover_user:
            pushover_res = await self._send_pushover(title, pushover_body, pushover_user)
            results["pushover"] = pushover_res
        else:
            results["pushover"] = {"sent": False, "reason": "disabled_or_missing_config"}

        # 3. Dispatch Telegram
        if telegram_enabled and telegram_chat_id:
            telegram_res = await self._send_telegram(title, telegram_body, telegram_chat_id)
            results["telegram"] = telegram_res
        else:
            results["telegram"] = {"sent": False, "reason": "disabled_or_missing_config"}

        # Cooldown management
        sent_any = any(res.get("sent") for res in results.values())
        if sent_any:
            self._set_cooldown(goal_id)

        # Primary return data
        primary_res = results.get("whatsapp") if whatsapp_enabled else results.get("pushover")
        if not primary_res or not primary_res.get("sent"):
            # Find any successful channel
            for ch_res in results.values():
                if ch_res.get("sent"):
                    primary_res = ch_res
                    break
        if not primary_res:
            primary_res = {"sent": False, "reason": "no_active_channels"}

        return {
            "sent": sent_any,
            "message_sid": primary_res.get("message_sid"),
            "reason": primary_res.get("reason"),
            "channels": results
        }

    def _send_whatsapp(self, goal_id: str, body: str, target_number: str) -> dict:
        if self.mock_mode:
            logger.info(
                f"\n===================================================="
                f"\n📱 MOCK WHATSAPP MESSAGE SENT (Zero Cost)"
                f"\nTo: {target_number or 'Unconfigured Number'}"
                f"\nFrom: {self.from_number}"
                f"\nBody:\n{body}"
                f"\n====================================================\n"
            )
            return {
                "sent": True,
                "message_sid": f"mock_sid_{int(datetime.utcnow().timestamp())}",
                "reason": "mock_send_success"
            }

        try:
            msg = self.client.messages.create(
                body=body,
                from_=self.from_number,
                to=target_number,
            )
            logger.info(f"OutreachAgent: WhatsApp sent. SID={msg.sid} goal={goal_id}")
            return {"sent": True, "message_sid": msg.sid, "reason": "ok"}
        except TwilioRestException as e:
            logger.error(f"OutreachAgent: Twilio error — {e}")
            return {"sent": False, "message_sid": None, "reason": str(e)}
        except Exception as e:
            logger.error(f"OutreachAgent: Unexpected twilio send error — {e}")
            return {"sent": False, "message_sid": None, "reason": str(e)}

    async def _send_pushover(self, title: str, body: str, user_key: str) -> dict:
        import httpx
        app_token = os.getenv("PUSHOVER_APP_TOKEN", "az3vpx5x3dcrswgmyvpxh1i7szn42b")
        if not user_key or not app_token:
            return {"sent": False, "reason": "missing_credentials"}

        if self.mock_mode:
            logger.info(
                f"\n===================================================="
                f"\n📱 MOCK PUSHOVER MESSAGE SENT"
                f"\nTo User Key: {user_key}"
                f"\nTitle: {title}"
                f"\nBody:\n{body}"
                f"\n====================================================\n"
            )
            return {
                "sent": True,
                "message_sid": f"mock_push_sid_{int(datetime.utcnow().timestamp())}",
                "reason": "mock_send_success"
            }

        # Convert simple markdown *bold* to <b>bold</b> for HTML presentation in Pushover
        import re
        formatted_message = re.sub(r'\*([^*]+)\*', r'<b>\1</b>', body)
        formatted_message = formatted_message.replace("\n", "<br/>")

        url = "https://api.pushover.net/1/messages.json"
        data = {
            "token": app_token,
            "user": user_key,
            "message": formatted_message,
            "title": title,
            "html": 1,
            "priority": 0
        }

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, data=data)
                if res.status_code == 200:
                    logger.info("OutreachAgent: Pushover notification sent.")
                    return {
                        "sent": True,
                        "message_sid": f"push_sid_{int(datetime.utcnow().timestamp())}",
                        "reason": "ok"
                    }
                else:
                    logger.error(f"OutreachAgent: Pushover error — {res.text}")
                    return {"sent": False, "reason": res.text}
        except Exception as e:
            logger.error(f"OutreachAgent: Pushover send exception — {e}")
            return {"sent": False, "reason": str(e)}

    async def _send_telegram(self, title: str, body: str, chat_id: str) -> dict:
        import httpx
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        if not chat_id or not bot_token:
            return {"sent": False, "reason": "missing_credentials"}

        if self.mock_mode:
            logger.info(
                f"\n===================================================="
                f"\n📱 MOCK TELEGRAM MESSAGE SENT"
                f"\nTo Chat ID: {chat_id}"
                f"\nTitle: {title}"
                f"\nBody:\n{body}"
                f"\n====================================================\n"
            )
            return {
                "sent": True,
                "message_sid": f"mock_tg_sid_{int(datetime.utcnow().timestamp())}",
                "reason": "mock_send_success"
            }

        # Telegram supports MarkdownV2 but standard Markdown with *bold* works well
        formatted = f"*{title}*\n\n{body}"

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": formatted,
            "parse_mode": "Markdown"
        }

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload)
                data = res.json()
                if data.get("ok"):
                    msg_id = data.get("result", {}).get("message_id", "")
                    logger.info(f"OutreachAgent: Telegram message sent. msg_id={msg_id}")
                    return {
                        "sent": True,
                        "message_sid": f"tg_mid_{msg_id}",
                        "reason": "ok"
                    }
                else:
                    logger.error(f"OutreachAgent: Telegram error — {data}")
                    return {"sent": False, "reason": data.get("description", str(data))}
        except Exception as e:
            logger.error(f"OutreachAgent: Telegram send exception — {e}")
            return {"sent": False, "reason": str(e)}

    def _is_on_cooldown(self, goal_id: str) -> bool:
        last = self._alert_cooldowns.get(goal_id)
        if not last:
            return False
        delta = (datetime.utcnow() - last).total_seconds() / 3600
        return delta < self._cooldown_hours

    def _set_cooldown(self, goal_id: str):
        self._alert_cooldowns[goal_id] = datetime.utcnow()


# Singleton — import this everywhere
outreach_agent = OutreachAgent()
