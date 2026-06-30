"""
NEXUS Settings API
------------------
Per-user notification settings stored in Supabase `user_settings` table.

Required Supabase table (create via SQL Editor):
  CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    whatsapp_number TEXT DEFAULT '',
    notification_email TEXT DEFAULT '',
    whatsapp_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can read own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Service role full access" ON user_settings FOR ALL USING (true);
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.client import supabase
from datetime import datetime

router = APIRouter()


class NotificationSettings(BaseModel):
    whatsapp_number: Optional[str] = ""
    notification_email: Optional[str] = ""
    whatsapp_enabled: Optional[bool] = True
    email_enabled: Optional[bool] = True
    pushover_user_key: Optional[str] = ""
    pushover_enabled: Optional[bool] = True
    telegram_chat_id: Optional[str] = ""
    telegram_enabled: Optional[bool] = True
    gemini_api_key: Optional[str] = ""
    google_calendar_enabled: Optional[bool] = False


@router.get("")
async def get_settings(user_id: str):
    """Get notification settings for a user."""
    try:
        result = supabase.table("user_settings") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        if result.data and len(result.data) > 0:
            return {"settings": result.data[0]}

        # Return defaults if no settings exist yet
        return {
            "settings": {
                "whatsapp_number": "",
                "notification_email": "",
                "whatsapp_enabled": True,
                "email_enabled": True,
                "pushover_user_key": "",
                "pushover_enabled": True,
                "telegram_chat_id": "",
                "telegram_enabled": True,
                "gemini_api_key": "",
                "google_calendar_enabled": False,
            }
        }
    except Exception as e:
        # If the table doesn't exist yet, return defaults instead of crashing
        err_str = str(e)
        if "PGRST205" in err_str or "user_settings" in err_str:
            return {
                "settings": {
                    "whatsapp_number": "",
                    "notification_email": "",
                    "whatsapp_enabled": True,
                    "email_enabled": True,
                    "pushover_user_key": "",
                    "pushover_enabled": True,
                    "telegram_chat_id": "",
                    "telegram_enabled": True,
                    "gemini_api_key": "",
                    "google_calendar_enabled": False,
                },
                "warning": "user_settings table not found — run the migration SQL in Supabase."
            }
        raise HTTPException(status_code=500, detail=err_str)


@router.put("")
async def update_settings(user_id: str, settings: NotificationSettings):
    """Create or update notification settings for a user."""
    try:
        data = {
            "user_id": user_id,
            "whatsapp_number": (settings.whatsapp_number or "").strip(),
            "notification_email": (settings.notification_email or "").strip(),
            "whatsapp_enabled": settings.whatsapp_enabled,
            "email_enabled": settings.email_enabled,
            "pushover_user_key": (settings.pushover_user_key or "").strip(),
            "pushover_enabled": settings.pushover_enabled,
            "telegram_chat_id": (settings.telegram_chat_id or "").strip(),
            "telegram_enabled": settings.telegram_enabled,
            "gemini_api_key": (settings.gemini_api_key or "").strip(),
            "google_calendar_enabled": settings.google_calendar_enabled,
            "updated_at": datetime.now().isoformat(),
        }

        # Upsert — insert if new, update if exists
        result = supabase.table("user_settings") \
            .upsert(data, on_conflict="user_id") \
            .execute()

        # Also update the outreach agent's to_number in real-time
        if settings.whatsapp_number:
            from agents.outreach_agent import outreach_agent
            clean_number = settings.whatsapp_number.strip()
            if not clean_number.startswith("whatsapp:"):
                clean_number = f"whatsapp:{clean_number}"
            outreach_agent.to_number = clean_number

        return {"success": True, "settings": result.data[0] if result.data else data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
