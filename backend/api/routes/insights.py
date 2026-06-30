from fastapi import APIRouter, HTTPException
from db.client import supabase
from agents.insight_agent import run_insight_agent

router = APIRouter()

@router.get("/latest")
async def get_latest_insights(user_id: str):
  try:
    recent = supabase.table("insights")\
      .select("*")\
      .eq("user_id", user_id)\
      .order("created_at", desc=True)\
      .limit(1)\
      .execute().data

    if recent:
      return {
        "insights": recent[0]["content"],
        "generated_at": recent[0]["created_at"],
        "cached": True
      }

    result = await run_insight_agent(user_id)
    return {
      "insights": result,
      "generated_at": None,
      "cached": False
    }
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )

@router.post("/generate")
async def generate_insights(user_id: str):
  try:
    result = await run_insight_agent(user_id)
    return {"insights": result}
  except Exception as e:
    raise HTTPException(
      status_code=500, detail=str(e)
    )

