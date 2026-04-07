from fastapi import APIRouter, UploadFile, File, HTTPException
import cv2
import numpy as np
from app.services.face_service import face_service
from app.utils.file_handler import save_upload_file, read_image

router = APIRouter(prefix="/api/face", tags=["face"])

@router.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    """Phát hiện khuôn mặt trong ảnh"""
    try:
        # Đọc file ảnh
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(400, "Invalid image file")
        
        # Detect faces
        results = await face_service.detect_faces(image)
        
        return {
            'success': True,
            'faces': results,
            'count': len(results)
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/compare")
async def compare_faces(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    """So sánh 2 khuôn mặt"""
    try:
        # Đọc ảnh 1
        img1_bytes = await file1.read()
        img1 = cv2.imdecode(np.frombuffer(img1_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        # Đọc ảnh 2
        img2_bytes = await file2.read()
        img2 = cv2.imdecode(np.frombuffer(img2_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        result = await face_service.compare_faces(img1, img2)
        
        return {
            'success': True,
            **result
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/register/{name}")
async def register_face(name: str, file: UploadFile = File(...)):
    """Đăng ký khuôn mặt mới"""
    try:
        image_bytes = await file.read()
        image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        success = await face_service.register_face(name, image)
        
        return {
            'success': success,
            'name': name if success else None,
            'message': f'Đã đăng ký khuôn mặt cho {name}' if success else 'Không tìm thấy khuôn mặt'
        }
    except Exception as e:
        raise HTTPException(500, str(e))