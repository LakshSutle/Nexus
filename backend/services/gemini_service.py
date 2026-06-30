import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Initialize Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))


def _get_mock_response(prompt: str) -> dict:
    prompt_lower = prompt.lower()
    
    # 1. Task Decomposition Agent (check this first or check explicitly to avoid overlaps)
    if "task planning ai" in prompt_lower or ("tasks" in prompt_lower and "critical_path" in prompt_lower and "milestone_index" in prompt_lower):
        return {
            "tasks": [
                {
                    "title": "Study Arrays & Linked Lists",
                    "description": "Review array operations, singly and doubly linked lists, and basic structures.",
                    "milestone_index": 0,
                    "estimated_hours": 3.0,
                    "sequence_order": 1,
                    "dependencies": []
                },
                {
                    "title": "Practice Arrays & Linked Lists Problems",
                    "description": "Implement lists and solve array search questions.",
                    "milestone_index": 0,
                    "estimated_hours": 4.0,
                    "sequence_order": 2,
                    "dependencies": [1]
                },
                {
                    "title": "Study Binary Trees & BSTs",
                    "description": "Review tree structures, node traversal, and BST properties.",
                    "milestone_index": 1,
                    "estimated_hours": 4.0,
                    "sequence_order": 3,
                    "dependencies": [2]
                },
                {
                    "title": "Implement Graph Search Algorithms (BFS/DFS)",
                    "description": "Write code for BFS and DFS graph traversals.",
                    "milestone_index": 1,
                    "estimated_hours": 5.0,
                    "sequence_order": 4,
                    "dependencies": [3]
                },
                {
                    "title": "Practice Sorting & Searching Algorithms",
                    "description": "Implement binary search, quicksort, and mergesort.",
                    "milestone_index": 2,
                    "estimated_hours": 4.0,
                    "sequence_order": 5,
                    "dependencies": [4]
                },
                {
                    "title": "Mock Final Review & Practice Exam",
                    "description": "Perform full comprehensive mock exam questions.",
                    "milestone_index": 2,
                    "estimated_hours": 3.0,
                    "sequence_order": 6,
                    "dependencies": [5]
                }
            ],
            "critical_path_indices": [1, 2, 3, 4, 5, 6]
        }

    # 2. Goal Ingestion Agent
    if "execution planning ai" in prompt_lower or ("topics" in prompt_lower and "milestones" in prompt_lower):
        # Try to extract goal title from prompt
        goal_title = "Data Structures Prep"
        for line in prompt.split("\n"):
            if "Goal Title:" in line:
                goal_title = line.split("Goal Title:")[1].strip()
                break
        return {
            "goal_title": goal_title,
            "total_estimated_hours": 30.0,
            "topics": [
                {"name": "Arrays & Linked Lists", "estimated_hours": 6},
                {"name": "Trees & Graphs", "estimated_hours": 12},
                {"name": "Sorting & Searching", "estimated_hours": 8},
                {"name": "Dynamic Programming", "estimated_hours": 4}
            ],
            "milestones": [
                {"title": "Master Linear Data Structures", "sequence_order": 1, "topics": ["Arrays & Linked Lists"]},
                {"title": "Implement Trees & Graph Algorithms", "sequence_order": 2, "topics": ["Trees & Graphs"]},
                {"title": "Sorting, Searching & Final Review", "sequence_order": 3, "topics": ["Sorting & Searching", "Dynamic Programming"]}
            ]
        }
    
    # 3. Scheduling Agent
    if "suggestion" in prompt_lower and "priority_action" in prompt_lower:
        return {
            "suggestion": "Distribute study blocks across 2-hour daily slots to maintain high retention.",
            "priority_action": "Begin reviewing Linear Data Structures",
            "risk_level": "medium"
        }
        
    # 4. Failure Prediction Agent
    if "risk_factors" in prompt_lower and "recommendation" in prompt_lower:
        return {
            "risk_factors": [
                "Lack of buffer days before the deadline",
                "High density of high-effort tasks in short period",
                "Velocity is slightly below required daily pace"
            ],
            "recommendation": "Focus on main milestone topics first and complete practice questions early."
        }
        
    # 5. Replanning Agent
    if "strategy" in prompt_lower and "tasks_to_deprioritize" in prompt_lower:
        return {
            "strategy": "intensive_catchup",
            "explanation": "Rescheduling overdue tasks evenly to balance cognitive load.",
            "tasks_to_deprioritize": []
        }
        
    # 6. Outreach Agent - Deadline Approaching
    if "time left:" in prompt_lower or "2-minute momentum rule" in prompt_lower:
        # Extract dynamic values if possible, or use standard mock values
        return {
            "message": "🚨 *Are you genuinely okay with letting this slide?* You are 75% close to finishing this goal, but only *12 hours* remain. You've already done the hard work—don't let it go to waste. Open NEXUS now and check off just *one* small task in the next 2 minutes. 🔥"
        }

    # 7. Outreach Agent - Velocity Deficit (Slippage)
    if "slippage:" in prompt_lower or "deeply personalized to this specific goal" in prompt_lower or "task-specific hook" in prompt_lower:
        task_name = "your next task"
        import re
        # Extract the first task after bullet point
        task_match = re.search(r"•\s+([^→\n]+)", prompt)
        if task_match:
            task_name = task_match.group(1).strip()
            
        return {
            "message": f"Your *{task_name}* is waiting. You've already made solid progress — don't let it go to waste. Open NEXUS now and knock it out in 2 minutes. 🔥"
        }
        
    # Default
    return {
        "message": "Processed in mock mode",
        "status": "success"
    }


async def call_gemini(
    prompt: str,
    file_bytes: bytes = None,
    use_flash: bool = False,
    api_key: str = None,
    user_id: str = None,
    goal_id: str = None
) -> dict:
    """
    Call Gemini API with optional file upload.
    Uses Gemini 2.0 Flash for fast operations (insights, risk analysis).
    Uses Gemini 1.5 Pro for document-heavy operations (syllabus parsing).
    Returns parsed JSON response, or falls back to mock responses if API fails.
    """
    # If API key is not provided, try to resolve it from the database settings
    if not api_key:
        resolved_user_id = user_id
        if not resolved_user_id and goal_id:
            try:
                from db.client import supabase
                res = supabase.table("goals").select("user_id").eq("id", goal_id).single().execute()
                if res.data:
                    resolved_user_id = res.data.get("user_id")
            except Exception as e:
                print(f"Error fetching user_id from goal_id in call_gemini: {e}")

        if resolved_user_id:
            try:
                from db.client import supabase
                res = supabase.table("user_settings").select("gemini_api_key").eq("user_id", resolved_user_id).execute()
                if res.data and len(res.data) > 0:
                    db_key = res.data[0].get("gemini_api_key")
                    if db_key and db_key.strip():
                        api_key = db_key.strip()
            except Exception as e:
                print(f"Error fetching user gemini api key in call_gemini: {e}")

    # Use user-specific API key if resolved/provided, otherwise default to env var
    active_api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
    
    mock_mode = os.environ.get("MOCK_GEMINI", "false").lower() in ("true", "1", "yes")

    # Also detect placeholder keys
    is_placeholder = not active_api_key or active_api_key.startswith("your") or "api_key" in active_api_key.lower()

    if mock_mode or is_placeholder:
        return _get_mock_response(prompt)

    # Configure Gemini with the active key
    genai.configure(api_key=active_api_key)

    # Use gemini-2.0-flash for all tasks as it supports multimodality and is GA/active
    model_name = "gemini-2.0-flash"

    model = genai.GenerativeModel(model_name)

    generation_config = genai.GenerationConfig(
        temperature=0.7,
        response_mime_type="application/json"
    )

    try:
        if file_bytes:
            file_part = {
                "mime_type": "application/pdf",
                "data": file_bytes
            }
            response = model.generate_content(
                [file_part, prompt],
                generation_config=generation_config
            )
        else:
            response = model.generate_content(
                prompt,
                generation_config=generation_config
            )

        # Parse JSON response
        result_text = response.text
        try:
            return json.loads(result_text)
        except json.JSONDecodeError:
            # Try to extract JSON from response if it's wrapped
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError(
                    f"Failed to parse JSON from Gemini response: {result_text[:200]}"
                )
    except Exception as e:
        print(f"Gemini API Error occurred: {str(e)}. Falling back to MOCK mode response.")
        return _get_mock_response(prompt)
