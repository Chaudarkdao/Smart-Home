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


@router.post("/ai_trigger_auth/{auth_val}")
async def ai_trigger_auth(auth_val: str):
    """
    API endpoint to trigger AI authentication. The auth val can be one of the following:
    - 10: Yolobit detected no motion, maintain current access state
    - 11: Yolobit detected motion, print hello and look at the camera in lcd, backend will prepare for scanning face
    - 12: Backend start AI face recognition, push auth = 12 to cloud for yolobit print verify process in lcd and turn on the light (white) - LED mode 1
    - 13: Backend authentication success, push auth = 13 to cloud for yolobit print success in lcd and turn on the light (green) - LED mode 2 (servo open in 10s, and then return to 10 or 11 based on motion)
    - 14: Backend authentication failed, push auth = 14 to cloud for yolobit print failed in lcd and turn on the light (red) - LED mode 3 (print failed in 10s, and then return to 10 or 11 based on motion)
    """
    publish("auth", auth_val)
    print(f"AI Triggered Auth: {auth_val}")
    return {"status": "AI auth triggered", "auth": auth_val}