from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.voice_service import voice_service
from app.utils.file_handler import save_upload_file
from pydub import AudioSegment
import os
import traceback
import uuid

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/recognize")
async def recognize_voice(file: UploadFile = File(...)):
    """Nhận dạng giọng nói từ file audio"""
    temp_input = None
    temp_wav = None

    try:
        original_name = file.filename or "temp_audio.webm"
        ext = os.path.splitext(original_name)[1].lower() or ".webm"

        uid = str(uuid.uuid4())
        temp_input = f"temp_{uid}{ext}"
        temp_wav = f"temp_{uid}.wav"

        # Lưu file gốc đúng định dạng thật
        temp_input = await save_upload_file(file, temp_input)
        print("Saved audio to:", temp_input)

        # Convert sang wav chuẩn PCM mono 16kHz
        audio = AudioSegment.from_file(temp_input)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(temp_wav, format="wav")
        print("Converted audio to:", temp_wav)

        # Speech to text
        text = await voice_service.transcribe_audio(temp_wav)
        print("Transcribed text:", text)

        # Phân tích command
        result = await voice_service.execute_command(text)
        print("Command result:", result)

        return {
            "success": True,
            "transcribed_text": text,
            "command_result": result
        }

    except Exception as e:
        print("VOICE ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(500, str(e))

    finally:
        for path in [temp_input, temp_wav]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass


@router.get("/commands")
async def list_commands():
    """Lấy danh sách lệnh có sẵn"""
    return await voice_service.list_commands()


@router.post("/execute-text")
async def execute_text_command(text: str):
    """Thực thi lệnh từ text (test)"""
    result = await voice_service.execute_command(text)
    return result