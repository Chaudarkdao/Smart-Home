# backend/app/utils/file_handler.py
import os
import shutil
import cv2
import numpy as np
from fastapi import UploadFile
from typing import Optional
import tempfile

async def save_upload_file(upload_file: UploadFile, destination: str = None) -> str:
    """
    Lưu file upload tạm thời
    
    Args:
        upload_file: File từ FastAPI UploadFile
        destination: Đường dẫn đích (nếu None thì tạo file tạm)
    
    Returns:
        Đường dẫn đến file đã lưu
    """
    if destination is None:
        # Tạo file tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            destination = tmp.name
    
    # Lưu file
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return destination

async def read_image(file: UploadFile) -> np.ndarray:
    """
    Đọc file ảnh từ UploadFile thành numpy array
    
    Args:
        file: File từ FastAPI UploadFile
    
    Returns:
        numpy array của ảnh (BGR format)
    """
    # Đọc nội dung file
    contents = await file.read()
    
    # Chuyển thành numpy array
    nparr = np.frombuffer(contents, np.uint8)
    
    # Decode thành ảnh (BGR format)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Không thể đọc file ảnh")
    
    return img

def save_image(image: np.ndarray, path: str) -> bool:
    """
    Lưu ảnh numpy array thành file
    
    Args:
        image: numpy array (BGR format)
        path: Đường dẫn lưu file
    
    Returns:
        True nếu thành công
    """
    try:
        cv2.imwrite(path, image)
        return True
    except Exception as e:
        print(f"Error saving image: {e}")
        return False

def delete_file(file_path: str) -> bool:
    """
    Xóa file
    
    Args:
        file_path: Đường dẫn file cần xóa
    
    Returns:
        True nếu thành công
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False

def ensure_directory(directory: str) -> None:
    """
    Đảm bảo thư mục tồn tại, tạo mới nếu chưa có
    
    Args:
        directory: Đường dẫn thư mục
    """
    os.makedirs(directory, exist_ok=True)