# backend/app/services/face_service.py
import insightface
import cv2
import numpy as np
from typing import List, Dict
from app.config import Config
import os, json
from datetime import datetime
import aiohttp
class FaceRecognitionService:
    def __init__(self):
        try:
            # Kiểm tra model đã download chưa
            model_path = os.path.expanduser("~/.insightface/models/buffalo_l")
            
            # Khởi tạo FaceAnalysis (cách đúng của InsightFace)
            from insightface.app import FaceAnalysis
            self.app = FaceAnalysis(name='buffalo_l', root='~/.insightface')
            self.app.prepare(ctx_id=-1)  # -1 cho CPU, 0 cho GPU
            
            print("✅ InsightFace model loaded successfully")
            
            # Lưu trữ danh sách khuôn mặt đã biết
            self.known_faces = {}
            self._load_database()
            self.current_person = None  # Người đang được đếm hiện tại
            self.current_count = 0      # Số lần đếm hiện tại
            self.attendance_log = []
            self._load_attendance()
            self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        except Exception as e:
            print(f"❌ Error loading InsightFace: {e}")
            raise
    async def _send_auth_status(self, status: int):
        """Gửi trạng thái xác thực qua API endpoint có sẵn"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.backend_url}/api/iot/ai_trigger_auth/{status}"
                async with session.post(url) as response:
                    if response.status == 200:
                        print(f"📡 Đã gửi auth status: {status} thành công")
                    else:
                        print(f"❌ Gửi auth status {status} thất bại: {response.status}")
        except Exception as e:
            print(f"❌ Lỗi khi gửi auth status {status}: {e}")

    async def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """Phát hiện tất cả khuôn mặt trong ảnh"""
        # Sử dụng FaceAnalysis thay vì detector riêng
        faces = self.app.get(image)
        
        results = []
        valid_faces = []
        for face in faces:
            confidence = float(face.det_score)
            bbox = face.bbox.astype(int).tolist()
            
            # 🔥 THÊM BỘ LỌC NÀY
            # Lọc theo confidence
            if confidence < 0.7:  # Bỏ qua nếu độ tin cậy < 70%
                continue
            valid_faces.append(face)
            # Lấy bounding box
            bbox = face.bbox.astype(int).tolist()
            
            # Lấy embedding (512 vector)
            embedding = face.embedding
            
            # Nhận diện
            recognized_name, similarity = await self.recognize_face(embedding)
            
            results.append({
                'bbox': bbox,
                'confidence': float(face.det_score),
                'landmarks': face.kps.astype(int).tolist() if face.kps is not None else [],
                'recognized_name': recognized_name,
                'similarity': float(similarity)
            })
        if len(valid_faces) == 1:
            if recognized_name != "unknown":
                print(f"✅ Phát hiện 1 mặt đã đăng ký: {recognized_name} - Bắt đầu xác thực")
                await self._send_auth_status(12)  # Gửi auth = 12
                await self.handle_counting(recognized_name)
            else:
                # Nếu là unknown, reset counter
                print(f"❌ Phát hiện khuôn mặt lạ (unknown) - Xác thực thất bại")
                await self._send_auth_status(14)  # Gửi auth = 14
                await self.reset_counting()
        if len(valid_faces) != 1:
                print(f"⚠️ Phát hiện {len(valid_faces)} khuôn mặt - Xác thực thất bại")
                await self._send_auth_status(14)  # Gửi auth = 14
                await self.reset_counting()
        return results
    
    async def recognize_face(self, embedding: np.ndarray) -> tuple:
        """Nhận diện khuôn mặt"""
        if not self.known_faces:
            return "unknown", 0.0
        
        best_match = "unknown"
        best_sim = Config.REC_THRESHOLD
        
        for name, known_emb in self.known_faces.items():
            # Cosine similarity
            similarity = np.dot(embedding, known_emb) / (
                np.linalg.norm(embedding) * np.linalg.norm(known_emb) + 1e-8
            )
            
            if similarity > best_sim:
                best_sim = similarity
                best_match = name
        
        return best_match, best_sim
    
    async def register_face(self, name: str, image: np.ndarray) -> bool:
        """Đăng ký khuôn mặt mới"""
        if name in self.known_faces:
            return False, f'Tên {name} đã tồn tại!'
        faces = self.app.get(image)
        if len(faces) == 0:
            return False, 'Không tìm thấy khuôn mặt'
        
        # Lấy embedding của khuôn mặt đầu tiên
        embedding = faces[0].embedding
        self.known_faces[name] = embedding
        
        # Lưu vào file (optional)
        self._save_database()
        
        return True, f'Đã đăng ký thành công cho {name}'
    
    async def compare_faces(self, image1: np.ndarray, image2: np.ndarray) -> Dict:
        """So sánh 2 ảnh"""
        faces1 = self.app.get(image1)
        faces2 = self.app.get(image2)
        
        if len(faces1) == 0 or len(faces2) == 0:
            return {'verified': False, 'error': 'Không tìm thấy khuôn mặt'}
        
        emb1 = faces1[0].embedding
        emb2 = faces2[0].embedding
        
        # Cosine similarity
        similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        
        return {
            'verified': similarity > Config.REC_THRESHOLD,
            'similarity': float(similarity),
            'threshold': Config.REC_THRESHOLD
        }
    
    def _save_database(self):
        """Lưu database vào file"""
        import pickle
        with open('face_database.pkl', 'wb') as f:
            pickle.dump(self.known_faces, f)
    
    def _load_database(self):
        """Load database từ file"""
        import pickle
        import os
        if os.path.exists('face_database.pkl'):
            with open('face_database.pkl', 'rb') as f:
                self.known_faces = pickle.load(f)
    def get_all_faces(self) -> Dict:
        """Lấy danh sách tất cả khuôn mặt đã đăng ký"""
        return {
            'count': len(self.known_faces),
            'names': list(self.known_faces.keys())
        }

    def delete_face(self, name: str) -> bool:
        """Xóa khuôn mặt theo tên"""
        if name in self.known_faces:
            del self.known_faces[name]
            self._save_database()
            print(f"✅ Đã xóa khuôn mặt: {name}")
            print(f"📋 Danh sách còn lại: {list(self.known_faces.keys())}")
            return True
        else:
            print(f"❌ Không tìm thấy khuôn mặt: {name}")
            return False
    async def handle_counting(self, name: str):
        """Xử lý logic đếm"""
        # Nếu chưa có ai đang đếm, bắt đầu đếm cho người này
        if self.current_person is None:
            self.current_person = name
            self.current_count = 1
            print(f"🔄 Bắt đầu đếm cho {name}: 1/3")
            return
        
        # Nếu đúng người đang đếm
        if self.current_person == name:
            self.current_count += 1
            print(f"🔄 {name}: {self.current_count}/3")
            
            # Nếu đủ 3 lần
            if self.current_count >= 3:
                print(f"✅ XÁC THỰC THÀNH CÔNG cho {name} sau 3 lần")
                await self._send_auth_status(13)  # Gửi auth = 13 (Thành công)
                await self.save_attendance(name)
                # Reset sau khi điểm danh thành công
                self.current_person = None
                self.current_count = 0
        else:
            # 🔥 NGƯỜI KHÁC XUẤT HIỆN → RESET
            print(f"⚠️ Phát hiện người khác ({name}), reset counter từ {self.current_person}({self.current_count})")
            self.current_person = name
            self.current_count = 1
            print(f"🔄 Bắt đầu đếm mới cho {name}: 1/3")
    
    async def reset_counting(self):
        """Reset counter khi không có mặt hoặc nhiều mặt"""
        if self.current_person is not None:
            print(f"🔄 Reset counter cho {self.current_person} (đang ở {self.current_count})")
            self.current_person = None
            self.current_count = 0
    
    async def save_attendance(self, name: str):
        """Ghi nhận điểm danh vào file JSON"""
        record = {
            'name': name,
            'time': datetime.now().isoformat(),
            'timestamp': datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }
        
        self.attendance_log.append(record)
        self._save_attendance()
        
        print(f"✅ ĐIỂM DANH: {name} lúc {record['timestamp']}")
        print(f"📋 Tổng số lần điểm danh: {len(self.attendance_log)}")
    
    def _save_attendance(self):
        """Lưu lịch sử điểm danh vào file"""
        attendance_path = os.path.join(os.path.dirname(__file__), 'attendance_log.json')
        try:
            with open(attendance_path, 'w', encoding='utf-8') as f:
                json.dump(self.attendance_log, f, indent=2, ensure_ascii=False)
            print(f"✅ Đã lưu điểm danh: {len(self.attendance_log)} bản ghi")
        except Exception as e:
            print(f"❌ Lỗi lưu điểm danh: {e}")
    def _load_attendance(self):
        """Load lịch sử điểm danh từ file"""
        attendance_path = os.path.join(os.path.dirname(__file__), 'attendance_log.json')
        if os.path.exists(attendance_path):
            try:
                with open(attendance_path, 'r', encoding='utf-8') as f:
                    self.attendance_log = json.load(f)
                print(f"✅ Đã load {len(self.attendance_log)} bản ghi điểm danh")
            except Exception as e:
                print(f"❌ Lỗi load điểm danh: {e}")
                self.attendance_log = []
        else:
            self.attendance_log = []
            print("📝 Tạo mới attendance log")

    def get_counting_status(self) -> Dict:
        """Lấy trạng thái đếm hiện tại"""
        return {
            'current_person': self.current_person,
            'current_count': self.current_count,
            'total_attendance': len(self.attendance_log),
            'recent_attendance': self.attendance_log  # 5 bản ghi gần nhất
        }
# Singleton instance
face_service = FaceRecognitionService()
