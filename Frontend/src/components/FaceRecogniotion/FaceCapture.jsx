// src/components/FaceRecogniotion/FaceCapture.jsx
import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { detectFaces, registerFace } from '../../services/faceApi';
import { useWebcam } from '../../hooks/useWebcam';
import './FaceRecognition.css'; // Giữ nguyên file CSS của bạn

const FaceCapture = ({ isDarkMode = true }) => {
  const { webcamRef, captureImageFile } = useWebcam();
  
  // States cho đăng ký khuôn mặt
  const [faceName, setFaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [regStatus, setRegStatus] = useState('');

  // States cho nhận diện liên tục
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [isTracking, setIsTracking] = useState(true);
  
  // Khóa tránh gọi API chồng chéo
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let intervalId;

    const trackFace = async () => {
      if (!isTracking || isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      try {
        const file = await captureImageFile();
        if (file) {
          const result = await detectFaces(file);
          if (result && result.faces) {
            setDetectedFaces(result.faces);
          }
        }
      } catch (err) {
        console.error('Lỗi nhận diện:', err); 
      } finally {
        isProcessingRef.current = false;
      }
    };

    if (isTracking) {
      intervalId = setInterval(trackFace, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isTracking, captureImageFile]);

  const handleSaveFace = async () => {
    if (!faceName.trim()) return;
    setSaving(true);
    setRegStatus('Đang lưu...');
    try {
      const file = await captureImageFile();
      if (file) {
        await registerFace(faceName.trim(), file);
        setRegStatus(`Đã lưu thành viên: ${faceName.trim()}`);
        setFaceName('');
      } else {
        setRegStatus('Không thể chụp ảnh.');
      }
    } catch (err) {
      setRegStatus('Lỗi khi lưu.');
    } finally {
      setSaving(false);
      setTimeout(() => setRegStatus(''), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* KHU VỰC CAMERA CHÍNH */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Live Tracking
          </h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isTracking ? 'animate-ping bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex h-3 w-3 rounded-full ${isTracking ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isTracking ? 'System Active' : 'Paused'}
            </span>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border-2 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-slate-100'} aspect-video w-full shadow-lg`}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            className="h-full w-full object-cover"
          />
          
          {/* Overlay UI: Lưới ngắm và hiệu ứng quét */}
          {isTracking && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
              {/* Box nhận diện (mô phỏng) */}
              <div className="h-2/3 w-1/2 rounded-xl border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] relative">
                 {/* Bốn góc của box */}
                 <div className="absolute -left-[1px] -top-[1px] h-4 w-4 border-l-2 border-t-2 border-emerald-400"></div>
                 <div className="absolute -right-[1px] -top-[1px] h-4 w-4 border-r-2 border-t-2 border-emerald-400"></div>
                 <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-emerald-400"></div>
                 <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-emerald-400"></div>
              </div>
              
              {/* Thanh quét dọc (Scan line) */}
              <div className="absolute left-0 top-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2.8s_ease-in-out_infinite]"></div>
            </div>
          )}

          {/* Floating Result (Kết quả nổi) */}
          {detectedFaces.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              {detectedFaces.map((face, idx) => {
                const name = (face?.recognized_name || '').trim();
                const isUnknown = name.length === 0 || name.toLowerCase() === 'unknown';
                const confidence = Number(face?.confidence || 0);
                return (
                <div key={idx} className="flex items-center gap-3 rounded-full bg-slate-900/80 px-5 py-2 backdrop-blur-md border border-white/10 shadow-xl">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {!isUnknown ? name : 'Người lạ'}
                    </p>
                    <p className="text-xs text-emerald-300">
                      Độ tin cậy: {(confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* KHU VỰC THÊM THÀNH VIÊN (Sidebar) */}
      <div className={`w-full lg:w-80 flex flex-col space-y-6 rounded-[28px] border p-6 ${isDarkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200/60 bg-white/50'} backdrop-blur-sm h-fit`}>
        <div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Thêm Thành Viên
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Hướng mặt vào camera và nhập tên.
          </p>
        </div>

        <div className="space-y-4">
          <input
            value={faceName}
            onChange={(evt) => setFaceName(evt.target.value)}
            placeholder="Tên thành viên..."
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-sky-400'}`}
          />
          <button
            onClick={handleSaveFace}
            disabled={saving || !faceName.trim()}
            className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold transition ${isDarkMode ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-sky-500 text-white hover:bg-sky-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? 'Đang lưu...' : 'Lưu Khuôn Mặt'}
          </button>
          
          {regStatus && (
            <p className="text-sm font-medium text-emerald-400 text-center animate-fade-in">{regStatus}</p>
          )}
        </div>

        {/* Nút tạm dừng/Tiếp tục tracking */}
        <button 
          onClick={() => setIsTracking(!isTracking)}
          className={`w-full rounded-2xl border border-dashed px-6 py-3 text-sm font-semibold transition ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          {isTracking ? 'Tạm dừng Camera' : 'Tiếp tục Camera'}
        </button>
      </div>
    </div>
  );
};

export default FaceCapture;