import React, { useState } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';
import './VoiceControl.css';

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const onData = (recordedBlob) => {
    console.log('chunk of real-time data is: ', recordedBlob);
  };

  const onStop = async (recordedBlob) => {
    setLoading(true);
    
    // Gửi file audio lên backend
    const formData = new FormData();
    formData.append('file', recordedBlob.blob, 'audio.wav');
    
    try {
      const response = await axios.post('http://localhost:8000/api/voice/recognize', formData);
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Có lỗi xảy ra' });
    }
    
    setLoading(false);
  };

  return (
    <div className="voice-recorder">
      <h2>Điều khiển bằng giọng nói</h2>
      
      <div className="recorder-container">
        <ReactMic
          record={recording}
          className="sound-wave"
          onStop={onStop}
          onData={onData}
          strokeColor="#000000"
          backgroundColor="#FF4081"
        />
        
        <div className="button-group">
          <button onClick={startRecording} disabled={recording}>
            🎤 Bắt đầu ghi âm
          </button>
          <button onClick={stopRecording} disabled={!recording}>
            ⏹️ Dừng ghi âm
          </button>
        </div>
        
        {loading && <div className="loading">Đang xử lý giọng nói...</div>}
        
        {result && (
          <div className="result">
            <h3>Kết quả:</h3>
            <p><strong>Văn bản:</strong> {result.transcribed_text}</p>
            {result.command_result.success ? (
              <div className="success">
                <p>✅ Lệnh: {result.command_result.command}</p>
                <p>Hành động: {result.command_result.action}</p>
              </div>
            ) : (
              <div className="error">
                <p>❌ {result.command_result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;import React, { useState } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';
import './VoiceControl.css';

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const onData = (recordedBlob) => {
    console.log('chunk of real-time data is: ', recordedBlob);
  };

  const onStop = async (recordedBlob) => {
    setLoading(true);
    
    // Gửi file audio lên backend
    const formData = new FormData();
    formData.append('file', recordedBlob.blob, 'audio.wav');
    
    try {
      const response = await axios.post('http://localhost:8000/api/voice/recognize', formData);
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Có lỗi xảy ra' });
    }
    
    setLoading(false);
  };

  return (
    <div className="voice-recorder">
      <h2>Điều khiển bằng giọng nói</h2>
      
      <div className="recorder-container">
        <ReactMic
          record={recording}
          className="sound-wave"
          onStop={onStop}
          onData={onData}
          strokeColor="#000000"
          backgroundColor="#FF4081"
        />
        
        <div className="button-group">
          <button onClick={startRecording} disabled={recording}>
            🎤 Bắt đầu ghi âm
          </button>
          <button onClick={stopRecording} disabled={!recording}>
            ⏹️ Dừng ghi âm
          </button>
        </div>
        
        {loading && <div className="loading">Đang xử lý giọng nói...</div>}
        
        {result && (
          <div className="result">
            <h3>Kết quả:</h3>
            <p><strong>Văn bản:</strong> {result.transcribed_text}</p>
            {result.command_result.success ? (
              <div className="success">
                <p>✅ Lệnh: {result.command_result.command}</p>
                <p>Hành động: {result.command_result.action}</p>
              </div>
            ) : (
              <div className="error">
                <p>❌ {result.command_result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;