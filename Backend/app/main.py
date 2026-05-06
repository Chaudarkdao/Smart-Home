from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import face_routes, voice_routes

app = FastAPI(
    title="Face & Voice Control API",
    description="API nhận diện khuôn mặt và điều khiển bằng giọng nói",
    version="1.0.0"
)

# CORS cho React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký routes
app.include_router(face_routes.router)
app.include_router(voice_routes.router)

@app.get("/")
async def root():
    return {
        "message": "Face & Voice Control API",
        "endpoints": {
            "face": "/api/face/detect, /api/face/compare, /api/face/register/{name}",
            "voice": "/api/voice/recognize, /api/voice/commands"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)