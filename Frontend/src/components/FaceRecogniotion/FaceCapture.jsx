import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { detectFaces, registerFace } from '../../services/faceApi';
import './FaceRecognition.css';

const FaceCapture = ({ isDarkMode = true }) => {
  const webcamRef = useRef(null);
  const [faceName, setFaceName] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError('Unable to capture an image from the camera.');
      return;
    }

    setCapturedImage(imageSrc);
    setDetectionResult(null);
    setStatusMessage('Image captured. Enter a name and save to register this face.');
    setError('');
  };

  const detect = async () => {
    if (!capturedImage) {
      setError('Please capture an image before detecting.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('Running face recognition...');

    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      const result = await detectFaces(file);
      setDetectionResult(result);
      setStatusMessage('Recognition complete.');
    } catch (err) {
      setError(err.message || 'Face detection failed.');
      setDetectionResult(null);
    } finally {
      setLoading(false);
    }
  };

  const saveFace = async () => {
    if (!capturedImage) {
      setError('Capture an image first before saving the face.');
      return;
    }

    if (!faceName.trim()) {
      setError('Please enter a name for the face.');
      return;
    }

    setSaving(true);
    setError('');
    setStatusMessage('Saving face registration...');

    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      await registerFace(faceName.trim(), file);
      setStatusMessage(`Registered face: ${faceName.trim()}`);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to save face registration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={`rounded-[28px] border p-6 ${isDarkMode ? 'border-white/10 bg-slate-950/80' : 'border-slate-200/60 bg-white'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-sm uppercase tracking-[0.24em] ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>Face Registration</p>
            <h3 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Save a face with a name</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <input
              value={faceName}
              onChange={(evt) => setFaceName(evt.target.value)}
              placeholder="Enter face name"
              className={`rounded-3xl border px-4 py-3 text-base outline-none transition ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 focus:border-sky-400'}`}
            />
            <button
              type="button"
              onClick={saveFace}
              disabled={saving}
              className={`rounded-3xl px-6 py-3 text-sm font-semibold transition ${isDarkMode ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-sky-500 text-white hover:bg-sky-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving...' : '💾 Save Face'}
            </button>
          </div>
        </div>
        {statusMessage && <p className={`mt-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{statusMessage}</p>}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex flex-col items-center space-y-4">
        {!capturedImage ? (
          <div className="space-y-4">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={640}
              height={480}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: 'user',
              }}
              className={`rounded-lg border-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}
            />
            <button
              onClick={capture}
              className="rounded-lg bg-blue-500 px-6 py-3 text-white transition hover:bg-blue-600"
            >
              📷 Capture
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={capturedImage}
              alt="Captured"
              width={640}
              className={`rounded-lg border-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}
            />
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setDetectionResult(null);
                  setError('');
                  setStatusMessage('');
                }}
                className={`rounded-lg px-6 py-3 transition ${isDarkMode ? 'bg-slate-600 text-white hover:bg-slate-700' : 'bg-slate-300 text-slate-700 hover:bg-slate-400'}`}
              >
                🔄 Retake
              </button>
              <button
                onClick={detect}
                disabled={loading}
                className="rounded-lg bg-green-500 px-6 py-3 text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '⏳ Processing...' : '🔍 Detect'}
              </button>
            </div>
          </div>
        )}
      </div>

      {detectionResult && (
        <div className={`rounded-lg border p-6 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Results:</h3>
          <p className={`mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Faces detected: {detectionResult.count}</p>
          <div className="mt-4 space-y-3">
            {detectionResult.faces.map((face, idx) => (
              <div key={idx} className={`rounded-lg border p-4 ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Face {idx + 1}:</p>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Confidence: <span className="text-green-500 font-semibold">{(face.confidence * 100).toFixed(2)}%</span>
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Recognized: <span className="text-blue-500 font-semibold">{face.recognized_name}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
