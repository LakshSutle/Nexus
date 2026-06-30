from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

def build_schedule(
  tasks: List[Dict],
  start_date: str,
  deadline: str, 
  daily_hours: float
) -> Dict:

  # Parse dates
  start = datetime.strptime(start_date, "%Y-%m-%d")
  end = datetime.strptime(deadline, "%Y-%m-%d")
  
  # Calculate total days available
  total_days = (end - start).days + 1  # Include both start and end
  
  # Calculate total hours needed
  total_hours_needed = sum(task.get("estimated_hours", 0) for task in tasks)
  
  # Calculate total hours available
  total_hours_available = total_days * daily_hours
  
  # Check if schedule is feasible
  warning = None
  if total_hours_needed > total_hours_available:
    warning = f"tight schedule: {total_hours_needed}h needed vs {total_hours_available}h available"
  
  # Attach original index to track tasks correctly after sorting
  for idx, task in enumerate(tasks):
    task["_original_idx"] = idx

  # Sort tasks by estimated hours (heaviest first)
  sorted_tasks = sorted(tasks, key=lambda x: x.get("estimated_hours", 0), reverse=True)
  
  # Initialize schedule
  schedule = {}
  daily_load = {}
  current_date = start
  task_index = 0
  
  # Distribute tasks across days
  while current_date <= end and task_index < len(sorted_tasks):
    date_str = current_date.strftime("%Y-%m-%d")
    schedule[date_str] = []
    daily_load[date_str] = 0
    
    # If this is the last available day, dump all remaining tasks here
    if current_date == end:
      while task_index < len(sorted_tasks):
        task = sorted_tasks[task_index]
        schedule[date_str].append(task["_original_idx"])
        daily_load[date_str] += task.get("estimated_hours", 0)
        task_index += 1
      break

    # Fill day with tasks until daily hours limit
    while task_index < len(sorted_tasks):
      task = sorted_tasks[task_index]
      task_hours = task.get("estimated_hours", 0)
      
      if daily_load[date_str] == 0 or daily_load[date_str] + task_hours <= daily_hours:
        schedule[date_str].append(task["_original_idx"])
        daily_load[date_str] += task_hours
        task_index += 1
      else:
        break
    
    current_date += timedelta(days=1)
  
  # Add buffer: reserve 20% of days empty (only if we have enough days)
  buffer_days = []
  total_scheduled_days = len(schedule)
  if total_scheduled_days > 2:
    buffer_count = max(1, int(total_scheduled_days * 0.2))
    
    # Select days with lowest load as buffer days
    sorted_days_by_load = sorted(daily_load.items(), key=lambda x: x[1])
    for date_str, load in sorted_days_by_load[:buffer_count]:
      if date_str in schedule and len(schedule[date_str]) > 0:
        found_next_day = False
        next_date = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)
        while next_date <= end:
          next_date_str = next_date.strftime("%Y-%m-%d")
          if next_date_str in schedule:
            found_next_day = True
            # Move tasks
            task_indices_to_move = schedule[date_str]
            for task_idx in task_indices_to_move:
              schedule[next_date_str].append(task_idx)
              daily_load[next_date_str] += tasks[task_idx].get("estimated_hours", 0)
            schedule[date_str] = []
            daily_load[date_str] = 0
            buffer_days.append(date_str)
            break
          next_date += timedelta(days=1)
  
  return {
    "schedule": schedule,
    "buffer_days": buffer_days,
    "warning": warning,
    "daily_load": daily_load,
    "total_hours_needed": total_hours_needed,
    "total_hours_available": total_hours_available
  }
