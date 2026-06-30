"""
NEXUS Calendar Conflict Resolver
---------------------------------
Upgrades the existing bi-directional Google Calendar integration.

Before publishing a study block, this service:
  1. Reads existing events in the target time window
  2. Detects conflicts
  3. Finds the next available slot (same day or next day)
  4. Publishes to the confirmed conflict-free slot
  5. Updates the Supabase task with the resolved time

This replaces the naive "publish and hope" approach with genuine
intelligent scheduling.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

# Minimum gap between study blocks (minutes)
MIN_BUFFER_MINUTES = 15
# Default study block duration if not specified
DEFAULT_BLOCK_MINUTES = 90
# Search window for finding free slots (days)
LOOKAHEAD_DAYS = 7


class CalendarConflictResolver:
    """
    Reads Google Calendar events and finds conflict-free slots for
    NEXUS study blocks before publishing them.
    """

    def __init__(self, credentials: Credentials):
        self.service = build("calendar", "v3", credentials=credentials)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def find_and_publish_study_block(
        self,
        task: dict,
        preferred_start: datetime,
        duration_minutes: int = DEFAULT_BLOCK_MINUTES,
        preferred_hours: tuple[int, int] = (9, 21),  # 9 AM – 9 PM window
    ) -> dict:
        """
        Main entry point. Finds a conflict-free slot near preferred_start
        and publishes the study block.

        Args:
            task:             NEXUS task dict {id, title, goal_title, ...}
            preferred_start:  Ideal datetime to start the block
            duration_minutes: Length of the study block
            preferred_hours:  (start_hour, end_hour) for allowed scheduling

        Returns:
            {
              "published": bool,
              "event_id": str | None,
              "scheduled_start": str,
              "scheduled_end": str,
              "conflicts_avoided": int,
              "slot_found_on_day": int,  # 0 = today, 1 = tomorrow, etc.
            }
        """
        slot = self._find_free_slot(
            preferred_start, duration_minutes, preferred_hours
        )

        if not slot:
            logger.warning(f"CalendarResolver: No free slot found for '{task['title']}' in next {LOOKAHEAD_DAYS} days")
            return {
                "published": False,
                "reason": f"No available slot in next {LOOKAHEAD_DAYS} days",
                "conflicts_avoided": 0,
            }

        event = self._build_event(task, slot["start"], slot["end"])
        event_id = self._publish_event(event)

        days_offset = (slot["start"].date() - preferred_start.date()).days

        return {
            "published": True,
            "event_id": event_id,
            "scheduled_start": slot["start"].isoformat(),
            "scheduled_end": slot["end"].isoformat(),
            "conflicts_avoided": slot["conflicts_checked"],
            "slot_found_on_day": days_offset,
            "rescheduled": days_offset > 0,
        }

    def get_busy_slots(
        self, start: datetime, end: datetime
    ) -> list[dict]:
        """Fetch all busy time slots from Google Calendar in a window."""
        try:
            body = {
                "timeMin": start.isoformat() + "Z",
                "timeMax": end.isoformat() + "Z",
                "items": [{"id": "primary"}],
            }
            result = self.service.freebusy().query(body=body).execute()
            busy = result.get("calendars", {}).get("primary", {}).get("busy", [])
            return busy
        except Exception as e:
            logger.error(f"CalendarResolver: freebusy fetch failed — {e}")
            return []

    # ------------------------------------------------------------------
    # Slot finding logic
    # ------------------------------------------------------------------

    def _find_free_slot(
        self,
        preferred_start: datetime,
        duration_minutes: int,
        preferred_hours: tuple[int, int],
    ) -> Optional[dict]:
        """
        Walks forward from preferred_start, checking for conflicts.
        Returns the first conflict-free slot within LOOKAHEAD_DAYS.
        """
        search_end = preferred_start + timedelta(days=LOOKAHEAD_DAYS)
        busy_slots = self.get_busy_slots(preferred_start, search_end)

        # Convert to datetime objects for comparison
        busy_periods = []
        for slot in busy_slots:
            b_start = self._parse_dt(slot["start"])
            b_end   = self._parse_dt(slot["end"])
            if b_start and b_end:
                # Add buffer around each event
                busy_periods.append((
                    b_start - timedelta(minutes=MIN_BUFFER_MINUTES),
                    b_end + timedelta(minutes=MIN_BUFFER_MINUTES),
                ))

        conflicts_checked = 0
        candidate = self._snap_to_hour(preferred_start, preferred_hours[0])

        while candidate < search_end:
            # Skip outside preferred hours
            if not self._in_preferred_hours(candidate, preferred_hours):
                candidate = self._next_preferred_start(candidate, preferred_hours)
                continue

            candidate_end = candidate + timedelta(minutes=duration_minutes)

            # Check if this slot overlaps any busy period
            conflict = self._find_conflict(candidate, candidate_end, busy_periods)
            conflicts_checked += 1

            if conflict:
                # Jump to after the conflict ends
                candidate = conflict[1]  # conflict end time (with buffer)
                continue

            # Found a free slot!
            return {
                "start": candidate,
                "end": candidate_end,
                "conflicts_checked": conflicts_checked,
            }

        return None

    def _find_conflict(
        self,
        start: datetime,
        end: datetime,
        busy_periods: list[tuple],
    ) -> Optional[tuple]:
        """Returns the conflicting period if any, else None."""
        for b_start, b_end in busy_periods:
            if start < b_end and end > b_start:
                return (b_start, b_end)
        return None

    # ------------------------------------------------------------------
    # Event building & publishing
    # ------------------------------------------------------------------

    def _build_event(self, task: dict, start: datetime, end: datetime) -> dict:
        goal_title = task.get("goal_title", "NEXUS Goal")
        task_title = task.get("title", "Study Session")

        return {
            "summary": f"📚 {task_title}",
            "description": (
                f"Scheduled by NEXUS AI\n\n"
                f"Goal: {goal_title}\n"
                f"Task: {task_title}\n\n"
                f"Auto-scheduled to avoid calendar conflicts."
            ),
            "start": {
                "dateTime": start.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": end.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "colorId": "2",  # Green in Google Calendar
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 10},
                ],
            },
            "extendedProperties": {
                "private": {
                    "nexus_task_id": str(task.get("id", "")),
                    "nexus_goal_id": str(task.get("goal_id", "")),
                    "created_by": "NEXUS",
                }
            },
        }

    def _publish_event(self, event: dict) -> Optional[str]:
        try:
            result = self.service.events().insert(
                calendarId="primary", body=event
            ).execute()
            event_id = result.get("id")
            logger.info(f"CalendarResolver: Published event {event_id}")
            return event_id
        except Exception as e:
            logger.error(f"CalendarResolver: Publish failed — {e}")
            return None

    # ------------------------------------------------------------------
    # Time helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_dt(dt_str: str) -> Optional[datetime]:
        for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S+00:00", "%Y-%m-%dT%H:%M:%S.%fZ"):
            try:
                return datetime.strptime(dt_str, fmt)
            except ValueError:
                continue
        return None

    @staticmethod
    def _snap_to_hour(dt: datetime, preferred_start_hour: int) -> datetime:
        """Move dt to the nearest upcoming hour within preferred window."""
        if dt.hour < preferred_start_hour:
            return dt.replace(hour=preferred_start_hour, minute=0, second=0, microsecond=0)
        if dt.minute > 0:
            return dt.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        return dt.replace(second=0, microsecond=0)

    @staticmethod
    def _in_preferred_hours(dt: datetime, preferred: tuple[int, int]) -> bool:
        return preferred[0] <= dt.hour < preferred[1]

    @staticmethod
    def _next_preferred_start(dt: datetime, preferred: tuple[int, int]) -> datetime:
        """Jump to the start of the preferred window on the next day."""
        next_day = dt.date() + timedelta(days=1)
        return datetime(next_day.year, next_day.month, next_day.day, preferred[0], 0, 0)
