"""OpenCV YuNet + SFace — works on Windows without compiling insightface."""
from __future__ import annotations

import os
import urllib.request
from pathlib import Path

import cv2
import numpy as np

# OpenCV on Windows cannot load ONNX from paths with non-ASCII characters.
MODEL_DIR = Path.home() / ".smart-home-face-models"
MODELS = {
    "yunet": (
        "face_detection_yunet_2023mar.onnx",
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        200_000,
    ),
    "sface": (
        "face_recognition_sface_2021dec.onnx",
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        30_000_000,
    ),
}


def _ensure_models() -> tuple[Path, Path]:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    paths = []
    for key in ("yunet", "sface"):
        name, url, min_size = MODELS[key]
        dest = MODEL_DIR / name
        if not dest.exists() or dest.stat().st_size < min_size:
            print(f"[FaceCV] Downloading {name}...")
            urllib.request.urlretrieve(url, dest)
        paths.append(dest)
    return paths[0], paths[1]


class FaceCvBackend:
    def __init__(self) -> None:
        det_path, rec_path = _ensure_models()
        self.detector = cv2.FaceDetectorYN.create(str(det_path), "", (320, 320), 0.6, 0.3, 5000)
        self.recognizer = cv2.FaceRecognizerSF.create(str(rec_path), "")
        print("[FaceCV] OpenCV YuNet + SFace ready")

    def _detect(self, image: np.ndarray):
        h, w = image.shape[:2]
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(image)
        if faces is None:
            return []
        return list(faces)

    def get_faces(self, image: np.ndarray) -> list[dict]:
        out = []
        for face in self._detect(image):
            aligned = self.recognizer.alignCrop(image, face)
            feat = self.recognizer.feature(aligned)
            embedding = feat.flatten().astype(np.float32)
            x, y, fw, fh = face[:4].astype(int)
            out.append(
                {
                    "bbox": [int(x), int(y), int(x + fw), int(y + fh)],
                    "confidence": float(face[14]) if len(face) > 14 else 0.9,
                    "embedding": embedding,
                    "landmarks": [],
                }
            )
        return out

    def similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        fa = a if a.ndim == 2 else a.reshape(1, -1)
        fb = b if b.ndim == 2 else b.reshape(1, -1)
        return float(
            self.recognizer.match(fa, fb, cv2.FaceRecognizerSF_FR_COSINE)[0]
        )
