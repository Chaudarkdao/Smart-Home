# backend/app/services/face_service.py
import os
import pickle
from pathlib import Path
from typing import Dict, List

import numpy as np

from app.config import Config

BASE_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BASE_DIR / "face_database.pkl"


class FaceRecognitionService:
    def __init__(self):
        self.app = None
        self.cv_backend = None
        self.backend = None  # "insightface" | "opencv"
        self.available = False
        self.known_faces: Dict[str, np.ndarray] = {}

        if self._init_insightface():
            self.backend = "insightface"
            self.available = True
            print("InsightFace model loaded successfully")
        elif self._init_opencv():
            self.backend = "opencv"
            self.available = True
            print("[Face] Using OpenCV YuNet + SFace (no insightface package required)")
        else:
            print("[WARN] No face recognition backend available")

        if self.available:
            self._load_database()

    def _init_insightface(self) -> bool:
        try:
            from insightface.app import FaceAnalysis

            self.app = FaceAnalysis(name="buffalo_l", root="~/.insightface")
            self.app.prepare(ctx_id=-1)
            return True
        except Exception as e:
            print(f"[WARN] InsightFace unavailable: {e}")
            return False

    def _init_opencv(self) -> bool:
        try:
            from app.services.face_cv_backend import FaceCvBackend

            self.cv_backend = FaceCvBackend()
            return True
        except Exception as e:
            print("[WARN] OpenCV face backend unavailable:", repr(e))
            return False

    def _extract_faces(self, image: np.ndarray) -> list:
        if self.backend == "insightface" and self.app is not None:
            return self.app.get(image)
        if self.backend == "opencv" and self.cv_backend is not None:
            return self.cv_backend.get_faces(image)
        return []

    def _embedding_from_face(self, face) -> np.ndarray:
        if self.backend == "insightface":
            return face.embedding
        return face["embedding"]

    def _face_meta(self, face) -> dict:
        if self.backend == "insightface":
            bbox = face.bbox.astype(int).tolist()
            conf = float(face.det_score)
            kps = face.kps.astype(int).tolist() if face.kps is not None else []
        else:
            bbox = face["bbox"]
            conf = face["confidence"]
            kps = face.get("landmarks", [])
        return {"bbox": bbox, "confidence": conf, "landmarks": kps}

    async def detect_faces(self, image: np.ndarray) -> List[Dict]:
        if not self.available:
            return []

        results = []
        for face in self._extract_faces(image):
            embedding = self._embedding_from_face(face)
            meta = self._face_meta(face)
            recognized_name, similarity = await self.recognize_face(embedding)
            results.append(
                {
                    **meta,
                    "recognized_name": recognized_name,
                    "similarity": float(similarity),
                }
            )
        return results

    async def recognize_face(self, embedding: np.ndarray) -> tuple:
        if not self.known_faces:
            return "unknown", 0.0

        best_match = "unknown"
        best_sim = Config.REC_THRESHOLD

        for name, known_emb in self.known_faces.items():
            if self.backend == "opencv" and self.cv_backend is not None:
                similarity = self.cv_backend.similarity(embedding, known_emb)
            else:
                similarity = float(
                    np.dot(embedding, known_emb)
                    / (np.linalg.norm(embedding) * np.linalg.norm(known_emb) + 1e-8)
                )

            if similarity > best_sim:
                best_sim = similarity
                best_match = name

        return best_match, best_sim

    async def register_face(self, name: str, image: np.ndarray) -> tuple:
        if not self.available:
            return (
                False,
                "Face recognition is not available. Install backend dependencies and restart the server.",
            )

        faces = self._extract_faces(image)
        if len(faces) == 0:
            return False, "No face detected in image."

        embedding = self._embedding_from_face(faces[0])
        self.known_faces[name] = embedding
        self._save_database()

        return True, f"Registered {name} successfully."

    async def compare_faces(self, image1: np.ndarray, image2: np.ndarray) -> Dict:
        if not self.available:
            return {
                "verified": False,
                "similarity": 0.0,
                "error": "Face recognition is not available",
            }

        faces1 = self._extract_faces(image1)
        faces2 = self._extract_faces(image2)

        if len(faces1) == 0 or len(faces2) == 0:
            return {"verified": False, "error": "Không tìm thấy khuôn mặt"}

        emb1 = self._embedding_from_face(faces1[0])
        emb2 = self._embedding_from_face(faces2[0])

        if self.backend == "opencv" and self.cv_backend is not None:
            similarity = self.cv_backend.similarity(emb1, emb2)
        else:
            similarity = float(
                np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-8)
            )

        return {
            "verified": similarity > Config.REC_THRESHOLD,
            "similarity": float(similarity),
            "threshold": Config.REC_THRESHOLD,
        }

    def get_all_faces(self) -> Dict:
        names = list(self.known_faces.keys())
        return {"count": len(names), "names": names}

    def delete_face(self, name: str) -> bool:
        if name in self.known_faces:
            del self.known_faces[name]
            self._save_database()
            return True
        return False

    def get_counting_status(self) -> Dict:
        """Đặc tả Auto Gate: current_count != 0 thì chỉ quét, không kết luận mở cửa. Chưa tích hợp cảm biến đếm người — mặc định 0."""
        return {"current_count": 0}

    def _save_database(self):
        with open(DB_PATH, "wb") as f:
            pickle.dump(self.known_faces, f)

    def _load_database(self):
        if DB_PATH.exists():
            with open(DB_PATH, "rb") as f:
                self.known_faces = pickle.load(f)


face_service = FaceRecognitionService()
