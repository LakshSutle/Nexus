import httpx
import os
from datetime import datetime
from typing import List, Dict
from db.client import supabase

async def refresh_google_token(user_id: str) -> str:
    """
    Refreshes the Google access token for a user using their stored refresh token.
    Saves the new token to user_settings and returns it.
    """
    # Fetch refresh token from database
    settings_res = supabase.table("user_settings") \
        .select("google_refresh_token") \
        .eq("user_id", user_id) \
        .single() \
        .execute()
    
    settings = settings_res.data
    if not settings or not settings.get("google_refresh_token"):
        raise ValueError("No refresh token found for this user. Please sign in with Google again.")
    
    refresh_token = settings["google_refresh_token"]
    
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("Google OAuth credentials (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET) not configured on the backend server.")

    url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=data)
        if response.status_code != 200:
            raise Exception(f"Failed to refresh Google OAuth token: {response.text}")
        
        token_data = response.json()
        new_access_token = token_data.get("access_token")
        if not new_access_token:
            raise Exception("Google token response did not contain access_token.")
        
        # Save the new access token to the database
        supabase.table("user_settings").update({
            "google_access_token": new_access_token,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("user_id", user_id).execute()
        
        return new_access_token

async def create_calendar_event(
    access_token: str,
    title: str,
    description: str,
    scheduled_date: str,
    estimated_hours: float
) -> Dict:
    """
    Create a single event in the user's primary Google Calendar.
    """
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Format start and end times
    start_time = f"{scheduled_date}T09:00:00"
    
    try:
        hours = int(estimated_hours)
        minutes = int((estimated_hours - hours) * 60)
        end_hour = 9 + hours
        end_minute = minutes
        if end_hour >= 24:
            end_hour = 23
            end_minute = 59
        end_time = f"{scheduled_date}T{end_hour:02d}:{end_minute:02d}:00"
    except Exception:
        # Fallback to +2 hours
        end_time = f"{scheduled_date}T11:00:00"

    event_body = {
        "summary": f"NEXUS: {title}",
        "description": description or f"Task scheduled by NEXUS. Duration: {estimated_hours}h.",
        "start": {
            "dateTime": start_time,
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": end_time,
            "timeZone": "UTC"
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 60},
                {"method": "popup", "minutes": 15}
            ]
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=event_body)
        if response.status_code not in (200, 201):
            raise Exception(f"Google Calendar API returned error: {response.text}")
        return response.json()


async def sync_goal_tasks_to_calendar(access_token: str, goal_id: str) -> int:
    """
    Sync all pending scheduled tasks of a goal to Google Calendar.
    """
    # 1. Fetch the goal
    goal_res = supabase.table("goals").select("*").eq("id", goal_id).single().execute()
    goal = goal_res.data
    if not goal:
        raise ValueError(f"Goal with id {goal_id} not found.")
    user_id = goal["user_id"]

    # 2. Fetch all pending tasks
    tasks_res = supabase.table("tasks").select("*").eq("goal_id", goal_id).eq("status", "pending").execute()
    tasks = tasks_res.data
    
    synced_count = 0
    token = access_token
    refreshed = False

    for task in tasks:
        if not task.get("scheduled_date"):
            continue
            
        try:
            await create_calendar_event(
                access_token=token,
                title=task["title"],
                description=task.get("description", ""),
                scheduled_date=task["scheduled_date"],
                estimated_hours=task.get("estimated_hours") or 2.0
            )
            synced_count += 1
        except Exception as e:
            # Check if error is due to expired token (usually returns 401 Unauthorized)
            error_str = str(e)
            if "401" in error_str and not refreshed:
                print(f"Token expired. Attempting to refresh Google token for user {user_id}...")
                try:
                    token = await refresh_google_token(user_id)
                    refreshed = True
                    # Retry once with the new token
                    await create_calendar_event(
                        access_token=token,
                        title=task["title"],
                        description=task.get("description", ""),
                        scheduled_date=task["scheduled_date"],
                        estimated_hours=task.get("estimated_hours") or 2.0
                    )
                    synced_count += 1
                except Exception as refresh_err:
                    print(f"Failed to refresh Google token or retry event creation: {refresh_err}")
                    raise Exception("Google access token expired and could not be refreshed. Please sign in with Google again.") from refresh_err
            else:
                print(f"Failed to sync task {task['id']} to Google Calendar: {error_str}")
                
    return synced_count


async def sync_goals_from_calendar(access_token: str, user_id: str) -> List[Dict]:
    """
    Fetch events from Google Calendar and import them as goals in NEXUS.
    Events prefixed with 'NEXUS:' have their prefix stripped.
    Very short events (< 30 min) are skipped as they are likely meetings, not goals.
    Already-imported goals (matching title + user) are not duplicated.
    """
    from datetime import timedelta
    from agents.orchestrator import orchestrate_goal_creation

    time_min = (datetime.utcnow() - timedelta(days=7)).isoformat() + "Z"
    time_max = (datetime.utcnow() + timedelta(days=90)).isoformat() + "Z"
    
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    params = {
        "timeMin": time_min,
        "timeMax": time_max,
        "singleEvents": "true",
        "orderBy": "startTime"
    }

    imported_goals = []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
        if response.status_code == 401:
            print(f"Token expired. Attempting to refresh Google token for user {user_id}...")
            try:
                new_token = await refresh_google_token(user_id)
                headers["Authorization"] = f"Bearer {new_token}"
                response = await client.get(url, headers=headers, params=params)
            except Exception as refresh_err:
                print(f"Failed to refresh Google token: {refresh_err}")
                raise Exception("Google access token expired and could not be refreshed. Please sign in with Google again.") from refresh_err

        if response.status_code != 200:
            raise Exception(f"Google Calendar API returned error: {response.text}")
        
        events = response.json().get("items", [])
        
        for event in events:
            summary = event.get("summary", "").strip()
            if not summary:
                continue

            # Strip NEXUS: prefix if present (backward compat)
            if summary.lower().startswith("nexus:"):
                title = summary[6:].strip()
            else:
                title = summary

            if not title:
                continue

            # --- Filter out very short events (< 30 min) ---
            start_info = event.get("start", {})
            end_info = event.get("end", {})
            start_dt_str = start_info.get("dateTime")
            end_dt_str = end_info.get("dateTime")

            if start_dt_str and end_dt_str:
                try:
                    # Parse ISO datetimes (handle timezone offset)
                    start_dt = datetime.fromisoformat(start_dt_str.replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(end_dt_str.replace("Z", "+00:00"))
                    duration_minutes = (end_dt - start_dt).total_seconds() / 60
                    if duration_minutes < 30:
                        continue  # Skip short meetings / calls
                except Exception:
                    pass  # If parsing fails, don't skip

            # --- Skip cancelled events ---
            if event.get("status") == "cancelled":
                continue
            
            # Extract deadline date
            date_str = start_info.get("dateTime", start_info.get("date", ""))
            if not date_str:
                continue
            deadline = date_str.split("T")[0]
            
            # Check if goal already exists for this user (avoid duplicates)
            existing = supabase.table("goals").select("id") \
                .eq("user_id", user_id) \
                .eq("title", title) \
                .execute()
                
            if existing.data:
                continue

            # Estimate daily hours from event duration
            daily_hours = 2.0
            if start_dt_str and end_dt_str:
                try:
                    start_dt = datetime.fromisoformat(start_dt_str.replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(end_dt_str.replace("Z", "+00:00"))
                    event_hours = (end_dt - start_dt).total_seconds() / 3600
                    if event_hours >= 1.0:
                        daily_hours = min(round(event_hours, 1), 8.0)
                except Exception:
                    pass

            # Create goal in database
            goal_result = supabase.table("goals").insert({
                "user_id": user_id,
                "title": title,
                "description": event.get("description", "Imported from Google Calendar"),
                "deadline": deadline,
                "daily_hours_available": daily_hours,
                "status": "active",
                "failure_probability": 0.0,
                "execution_health_score": 100
            }).execute()
            
            if not goal_result.data:
                continue
                
            new_goal = goal_result.data[0]
            imported_goals.append(new_goal)
            
            # Run the agent orchestration pipeline to generate tasks/milestones
            try:
                await orchestrate_goal_creation(
                    goal_id=new_goal["id"],
                    goal_title=new_goal["title"],
                    deadline=new_goal["deadline"],
                    daily_hours=new_goal["daily_hours_available"],
                    document_bytes=None,
                    user_id=user_id
                )
            except Exception as oe:
                print(f"Failed to orchestrate imported goal {new_goal['id']}: {str(oe)}")
                
    return imported_goals


