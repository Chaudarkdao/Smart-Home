import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detecting, setDetecting] = useState(false);
  const [currentFace, setCurrentFace] = useState(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const [detectedFaces, setDetectedFaces] = useState([]);

  // Tự động nhận diện mỗi 2 giây
  useEffect(() => {
    let intervalId;
    
    if (!registerMode) {
      intervalId = setInterval(() => {
        detectFaceAutomatically();
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [registerMode]);

  // Vẽ khung box lên canvas
  // Vẽ khung box lên canvas
// Vẽ khung box lên canvas
const drawFaceBox = (faces) => {
  const canvas = canvasRef.current;
  const video = webcamRef.current?.video;
  
  if (!canvas || !video) return;
  
  // 🔥 QUAN TRỌNG: Lấy kích thước THỰC từ video
  const videoWidth = video.videoWidth;    // 640
  const videoHeight = video.videoHeight;  // 480
 
  // 🔥 Set canvas ĐÚNG bằng kích thước thực của video
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  
  // 🔥 Set style để canvas đè lên video đúng vị trí
  canvas.style.width = `${video.clientWidth}px`;
  canvas.style.height = `${video.clientHeight}px`;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  faces.forEach(face => {
    if (face.bbox && face.bbox.length === 4) {
      let [x1, y1, x2, y2] = face.bbox;
      
      // 🔥 VẼ TRỰC TIẾP với tọa độ gốc (không scale)
      const width = x2 - x1;
      const height = y2 - y1;
      
      const isKnown = face.recognized_name !== 'unknown';
      ctx.strokeStyle = isKnown ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);
      
      ctx.fillStyle = isKnown ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(x1, y1 - 30, width, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      const displayName = face.recognized_name !== 'unknown' ? face.recognized_name : 'Unknown';
      const percentage = face.similarity ? (face.similarity * 100).toFixed(1) : '0';
      ctx.fillText(`${displayName} (${percentage}%)`, x1 + 5, y1 - 10);
    }
  });
};

  // Hàm tự động nhận diện
  const detectFaceAutomatically = async () => {
    if (!webcamRef.current || detecting) return;
    
    setDetecting(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');
      
      const response = await axios.post('http://localhost:8000/api/face/detect', formData);
      const result = response.data;
      
      if (result.faces && result.faces.length > 0) {
        setDetectedFaces(result.faces);
        drawFaceBox(result.faces);
        
        const face = result.faces[0];
        if (face.recognized_name && face.recognized_name !== 'unknown') {
          setCurrentFace({
            name: face.recognized_name,
            confidence: face.confidence,
            similarity: face.similarity
          });
          setMessage(`✅ Nhận diện: ${face.recognized_name} (${(face.similarity * 100).toFixed(1)}%)`);
        } else {
          setCurrentFace(null);
          setMessage('❌ Người lạ - Chưa đăng ký');
        }
      } else {
        setDetectedFaces([]);
        drawFaceBox([]);
        setCurrentFace(null);
        setMessage('😕 Không thấy khuôn mặt');
      }
    } catch (error) {
      console.error('Detection error:', error);
      setMessage('⚠️ Lỗi kết nối đến server');
    }
    
    setDetecting(false);
  };

  // Đăng ký khuôn mặt mới
  const registerNewFace = async () => {
    if (!newName.trim()) {
      setMessage('⚠️ Vui lòng nhập tên');
      return;
    }
    
    if (!webcamRef.current) return;
    
    setDetecting(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');
      
      const response = await axios.post(`http://localhost:8000/api/face/register/${newName}`, formData);
      
      if (response.data.success) {
        setMessage(`✅ Đăng ký thành công cho ${newName}`);
        setNewName('');
        setRegisterMode(false);
      } else {
        setMessage(`❌ Đăng ký thất bại: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Register error:', error);
      setMessage('❌ Lỗi khi đăng ký');
    }
    
    setDetecting(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Cột trái: Camera (1/4 màn hình) */}
        <div style={{ 
          flex: '1',
          minWidth: '300px',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>
            📹 Camera
          </h3>
          <div style={{ position: 'relative' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              height="auto"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
              style={{ borderRadius: '10px' }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '10px',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* Cột phải: Thông tin (3/4 màn hình) */}
        <div style={{ 
          flex: '3',
          minWidth: '400px',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
            🏠 Smart Home - Face Recognition
          </h2>
          
          {/* Thông báo */}
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {message || '🎥 Đang theo dõi...'}
          </div>
          
          {/* Thông tin khuôn mặt được nhận diện */}
          {currentFace && (
            <div style={{
              backgroundColor: '#e8f5e9',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '2px solid #4caf50'
            }}>
              <h3 style={{ color: '#2e7d32', marginBottom: '15px' }}>
                ✅ ĐÃ NHẬN DIỆN
              </h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                👤 {currentFace.name}
              </div>
              <div style={{ fontSize: '18px', color: '#666' }}>
                Độ chính xác: <strong style={{ color: '#4caf50' }}>
                  {(currentFace.similarity * 100).toFixed(1)}%
                </strong>
              </div>
            </div>
          )}
          
          {/* Danh sách tất cả khuôn mặt trong khung hình */}
          {detectedFaces.length > 1 && (
            <div style={{
              backgroundColor: '#f3e5f5',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <h4>📊 Có {detectedFaces.length} khuôn mặt trong khung hình:</h4>
              {detectedFaces.map((face, idx) => (
                <div key={idx} style={{ margin: '10px 0', padding: '5px', borderBottom: '1px solid #ddd' }}>
                  {face.recognized_name !== 'unknown' ? (
                    <span style={{ color: '#4caf50' }}>✅ {face.recognized_name}</span>
                  ) : (
                    <span style={{ color: '#f44336' }}>❌ Người lạ</span>
                  )}
                  {' - '}
                  Độ tin cậy: {(face.confidence * 100).toFixed(1)}%
                  {face.similarity && ` - Nhận diện: ${(face.similarity * 100).toFixed(1)}%`}
                </div>
              ))}
            </div>
          )}
          
          {/* Controls */}
          {!registerMode ? (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setRegisterMode(true)}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  margin: '5px'
                }}
              >
                📝 Đăng ký người mới
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <input
                type="text"
                placeholder="Nhập tên người dùng (ví dụ: Châu)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  marginRight: '10px',
                  width: '250px'
                }}
              />
              <button
                onClick={registerNewFace}
                disabled={detecting}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  margin: '5px'
                }}
              >
                💾 Lưu khuôn mặt
              </button>
              <button
                onClick={() => {
                  setRegisterMode(false);
                  setNewName('');
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  margin: '5px'
                }}
              >
                ❌ Hủy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;