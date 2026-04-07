import speech_recognition as sr
from typing import Dict, Any
from app.config import Config

class VoiceControlService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.commands = Config.COMMANDS
        
    async def transcribe_audio(self, audio_file_path: str) -> str:
        """Chuyển đổi file audio thành text"""
        with sr.AudioFile(audio_file_path) as source:
            audio = self.recognizer.record(source)
            
        try:
            # Sử dụng Google Speech Recognition
            text = self.recognizer.recognize_google(
                audio, 
                language=Config.VOICE_LANGUAGE,
                show_all=False
            )
            return text
        except sr.UnknownValueError:
            return "Không thể nhận dạng giọng nói"
        except sr.RequestError as e:
            return f"Lỗi dịch vụ: {e}"
    
    async def execute_command(self, text: str) -> Dict[str, Any]:
        """Phân tích và thực thi lệnh từ text"""
        text_lower = text.lower()
        
        # Tìm lệnh phù hợp
        for command_word, command_action in self.commands.items():
            if command_word in text_lower:
                # Thực thi lệnh (ở đây chỉ trả về action, thực tế có thể gọi hardware API)
                return {
                    'success': True,
                    'command': command_word,
                    'action': command_action,
                    'original_text': text
                }
        
        return {
            'success': False,
            'error': 'Không tìm thấy lệnh phù hợp',
            'original_text': text
        }
    
    async def list_commands(self) -> Dict:
        """Trả về danh sách các lệnh có sẵn"""
        return {
            'commands': [
                {'voice': voice, 'action': action} 
                for voice, action in self.commands.items()
            ]
        }

voice_service = VoiceControlService()