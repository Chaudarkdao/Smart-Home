from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.voice_service import voice_service
from app.utils.file_handler import save_upload_file

router = APIRouter(prefix="/api/voice", tags=["voice"])

@router.post("/recognize")
async def recognize_voice(file: UploadFile = File(...)):
    """Nhận dạng giọng nói từ file audio"""
    try:
        # Lưu file tạm
        temp_path = await save_upload_file(file, "temp_audio.wav")
        
        # Transcribe
        text = await voice_service.transcribe_audio(temp_path)
        
        # Execute command
        result = await voice_service.execute_command(text)
        
        return {
            'success': True,
            'transcribed_text': text,
            'command_result': result
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/commands")
async def list_commands():
    """Lấy danh sách lệnh có sẵn"""
    return await voice_service.list_commands()

@router.post("/execute-text")
async def execute_text_command(text: str):
    """Thực thi lệnh từ text (test)"""
    result = await voice_service.execute_command(text)
    return result