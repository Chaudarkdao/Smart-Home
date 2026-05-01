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

    # fallback nếu chưa có ESP32
    stats[device] = float(val)

    return {"status": "ok"}


@router.post("/ai_trigger_auth/{auth_val}")
async def ai_trigger_auth(auth_val: str):
    publish("auth", auth_val)
    stats["auth"] = float(auth_val)

    led_mode = 0
    if auth_val == "12":
        led_mode = 1
    elif auth_val == "13":
        led_mode = 2
    elif auth_val == "14":
        led_mode = 3

    if led_mode > 0:
        publish("led", led_mode)
        stats["led"] = float(led_mode)

    return {"auth": auth_val, "led": led_mode}