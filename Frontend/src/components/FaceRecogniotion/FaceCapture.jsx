import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { detectFaces } from '../../services/faceApi';
import './FaceRecognition.css';

const FaceCapture = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setDetectionResult(null);
  };

  const detect = async () => {
    if (!capturedImage) return;
    
    setLoading(true);
    // Convert base64 to file
    const blob = await fetch(capturedImage).then(res => res.blob());
    const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
    
    const result = await detectFaces(file);
    setDetectionResult(result);
    setLoading(false);
  };

  return (
    <div className="face-capture">
      <h2>Nhận diện khuôn mặt</h2>
      
      <div className="webcam-container">
        {!capturedImage ? (
          <>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={640}
              height={480}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
            />
            <button onClick={capture}>Chụp ảnh</button>
          </>
        ) : (
          <>
            <img src={capturedImage} alt="Captured" width={640} />
            <div className="button-group">
              <button onClick={() => setCapturedImage(null)}>Chụp lại</button>
              <button onClick={detect} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Nhận diện'}
              </button>
            </div>
          </>
        )}
      </div>

      {detectionResult && (
        <div className="result">
          <h3>Kết quả:</h3>
          <p>Số lượng khuôn mặt: {detectionResult.count}</p>
          {detectionResult.faces.map((face, idx) => (
            <div key={idx} className="face-info">
              <p>Khuôn mặt {idx + 1}:</p>
              <p>Độ tin cậy: {(face.confidence * 100).toFixed(2)}%</p>
              <p>Nhận diện: {face.recognized_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaceCapture;