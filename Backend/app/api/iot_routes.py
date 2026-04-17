from fastapi import APIRouter
from app.services.stats_service import stats
from app.services.db_service import get_history
from app.services.mqtt_service import publish

router = APIRouter(prefix="/api/iot", tags=["IoT"])

@router.get("/data")
async def get_data():
    return stats

@router.get("/history")
async def history():
    return get_history()

@router.post("/control/{device}/{val}")
async def control(device: str, val: str):
    publish(device, val)
    return {"status": "ok"}