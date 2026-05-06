# backend/app/services/face_service.py
import numpy as np
from typing import List, Dict
from app.config import Config
import os

class FaceRecognitionService:
    def __init__(self):
        self.app = None
        self.available = False
        self.known_faces = {}
        try:
            # Khởi tạo FaceAnalysis (cách đúng của InsightFace)
            from insightface.app import FaceAnalysis
            self.app = FaceAnalysis(name='buffalo_l', root='~/.insightface')
            self.app.prepare(ctx_id=-1)  # -1 cho CPU, 0 cho GPU
            self.available = True
            print("InsightFace model loaded successfully")
            self._load_database()
        except Exception as e:
            print(f"[WARN] InsightFace unavailable, fallback mode active: {e}")
    
    async def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """Phát hiện tất cả khuôn mặt trong ảnh"""
        if not self.available or self.app is None:
            return []

        # Sử dụng FaceAnalysis thay vì detector riêng
        faces = self.app.get(image)
        
        results = []
        for face in faces:
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
        if not self.available or self.app is None:
            return False

        faces = self.app.get(image)
        if len(faces) == 0:
            return False
        
        # Lấy embedding của khuôn mặt đầu tiên
        embedding = faces[0].embedding
        self.known_faces[name] = embedding
        
        # Lưu vào file (optional)
        self._save_database()
        
        return True
    
    async def compare_faces(self, image1: np.ndarray, image2: np.ndarray) -> Dict:
        """So sánh 2 ảnh"""
        if not self.available or self.app is None:
            return {
                'verified': False,
                'similarity': 0.0,
                'error': 'InsightFace is not available in current environment'
            }

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

# Singleton instance
face_service = FaceRecognitionService()