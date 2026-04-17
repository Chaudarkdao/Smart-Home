import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # InsightFace config
    FACE_DET_MODEL = 'retinaface_r50_v1'
    FACE_RECOG_MODEL = 'arcface_r100_v1'
    DET_SIZE = (640, 640)  # Kích thước cho detection
    REC_THRESHOLD = 0.5    # Ngưỡng nhận diện
    # Voice config
    VOICE_LANGUAGE = 'vi-VN'  # Tiếng Việt, có thể đổi thành 'en-US'
    COMMANDS = {
        'mở đèn': 'turn_on_light',
        'tắt đèn': 'turn_off_light',
        'mở cửa': 'open_door',
        'dừng lại': 'stop',
        'bắt đầu': 'start'
    }
    
    # Server config
    UPLOAD_DIR = "uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)