from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import face_routes, voice_routes, iot_routes
from app.services.mqtt_service import init_mqtt
from app.services.db_service import init_db

app = FastAPI(
    title="Face & Voice Control API",
    description="API nhận diện khuôn mặt và điều khiển bằng giọng nói",
    version="1.0.0"
)

# CORS cho React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký routes
app.include_router(face_routes.router)
app.include_router(voice_routes.router)
app.include_router(iot_routes.router)
@app.on_event("startup")
async def startup():
    init_mqtt()
    init_db()

@app.get("/")
async def root():
    return {
        "message": "Face & Voice Control API",
        "endpoints": {
            "face": "/api/face/detect, /api/face/compare, /api/face/register/{name}",
            "voice": "/api/voice/recognize, /api/voice/commands",
            "iot": "/api/iot/data, /api/iot/history, /api/iot/control/{device}/{val}, /api/iot/ai_trigger_auth/{auth_val}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)