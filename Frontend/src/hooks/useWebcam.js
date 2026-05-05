import { useRef, useCallback } from 'react';

export const useWebcam = () => {
  const webcamRef = useRef(null);

  const captureImageFile = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return null;

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      return new File([blob], 'frame.jpg', { type: 'image/jpeg' });
    } catch (error) {
      console.error("Lỗi khi chuyển đổi ảnh:", error);
      return null;
    }
  }, []);

  return { webcamRef, captureImageFile };
};