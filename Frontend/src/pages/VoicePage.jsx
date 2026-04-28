import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { executeTextCommand, getCommands, recognizeVoice } from "../services/voiceApi";

export default function VoicePage() {
  const [commands, setCommands] = useState([]);
  const [result, setResult] = useState(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
const [darkMode] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const audioMimeTypeRef = useRef("audio/webm");

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const res = await getCommands();
        setCommands(res.commands || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách command:", error);
      }
    };

    fetchCommands();
  }, []);

  const handleStartRecording = async () => {
  if (isRecording || isSending) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioChunksRef.current = [];

    let mimeType = "";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
      mimeType = "audio/ogg;codecs=opus";
    }

    const mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    audioMimeTypeRef.current = mimeType || mediaRecorder.mimeType || "audio/webm";
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalMime = audioMimeTypeRef.current || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
      audioBlobRef.current = audioBlob;

      const previewUrl = URL.createObjectURL(audioBlob);
      setAudioPreview(previewUrl);
      setIsRecording(false);

      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);
    setResult(null);
  } catch (error) {
    console.error(error);
    alert("Không thể dùng microphone");
  }
};

  const handleStopRecording = () => {
  if (!mediaRecorderRef.current || !isRecording) return;

  mediaRecorderRef.current.stop();
};

  const handleClearRecording = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }

    audioChunksRef.current = [];
    audioBlobRef.current = null;
    setAudioPreview("");
    setResult(null);
  };

  const buildRecordedFile = () => {
    if (!audioBlobRef.current) return null;

    const mime = audioBlobRef.current.type || audioMimeTypeRef.current || "audio/webm";

    let extension = "webm";
    if (mime.includes("ogg")) extension = "ogg";
    if (mime.includes("mp4")) extension = "mp4";

    return new File([audioBlobRef.current], `voice_sample.${extension}`, {
      type: mime,
    });
  };

  const handleAnalyzeVoice = async () => {
    const file = buildRecordedFile();

    if (!file) {
      alert("Bạn chưa ghi âm");
      return;
    }

    try {
      setIsSending(true);

      const res = await recognizeVoice(file);
      setResult({
        type: "audio",
        ...res,
      });
    } catch (error) {
      console.error("Upload audio error:", error);
      alert("Xử lý giọng nói thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickCommand = async (text) => {
    try {
      setIsSending(true);
      const res = await executeTextCommand(text);
      setResult({
        type: "text",
        command_result: res,
      });
    } catch (error) {
      console.error(error);
      alert("Test command thất bại");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`voice-ui-page ${darkMode ? "voice-dark" : ""}`}>
      <div className="voice-shell">
        <header className="voice-topbar">
          <div>
            <p className="voice-mini-title">SMART HOME</p>
            <h1>Voice Control</h1>
          </div>

          <div className="voice-nav-pills">
  <Link to="/" className="voice-pill">
    🏠 Home
  </Link>

  <span className="voice-pill active">🎤 Voice</span>

  <Link to="/face" className="voice-pill">
    👤 Face
  </Link>

  <Link to="/iot" className="voice-pill">
    📡 IoT
  </Link>

  
</div>
        </header>

        <section className="voice-banner">
          <h3>🎤 Điều khiển bằng giọng nói</h3>
          <p>Nhấn ghi âm, nói lệnh, rồi xử lý để nhận kết quả.</p>
        </section>

        <section className="voice-main-grid">
          <div className="voice-left-card">
            <p className="section-label">VOICE INPUT</p>
            <h2>Ghi âm lệnh</h2>

            <div className="record-console compact-console">
              <div className="record-actions compact-actions">
                <button
  className={`record-btn ${isRecording ? "recording" : ""}`}
  onMouseDown={handleStartRecording}
  onMouseUp={handleStopRecording}
  onMouseLeave={handleStopRecording}
  onTouchStart={handleStartRecording}
  onTouchEnd={handleStopRecording}
  disabled={isSending}
>
  {isRecording ? "🔴 Recording..." : "🎙 Hold to Record"}
</button>
                
                <button
                  className="clear-btn"
                  onClick={handleClearRecording}
                  disabled={isRecording || isSending}
                >
                  🗑 Clear
                </button>
                <button
                  className="analyze-btn"
                  onClick={handleAnalyzeVoice}
                  disabled={isSending || !audioBlobRef.current}
                >
                  ✨ Analyze
                </button>
              </div>

              <div className="preview-only-box">
                <h4>Audio preview</h4>
                {audioPreview ? (
                  <audio controls src={audioPreview} className="audio-preview" />
                ) : (
                  <p>Chưa có bản ghi âm.</p>
                )}
              </div>
            </div>
          </div>

          <div className="voice-right-card">
            <div className="result-header simple-header">
              <div>
                <p className="section-label blue">RESULT</p>
                <h2>Kết quả</h2>
              </div>
            </div>

            <div className="result-body">
              {!result ? (
                <div className="result-placeholder">
                  Chưa có kết quả.
                </div>
              ) : (
                <div className="result-card pretty-result-card">
                  <div className="result-status-line">
                    <span
                      className={`result-status-badge ${
                        result.command_result?.success ? "success" : "failed"
                      }`}
                    >
                      {result.command_result?.success
                        ? "Đã nhận lệnh"
                        : "Không nhận ra lệnh"}
                    </span>
                  </div>

                  {result.command_result?.command ? (
                    <>
                      <div className="result-info-block">
                        <p className="result-label">Detected command</p>
                        <div className="command-highlight">
                          {result.command_result.command}
                        </div>
                      </div>

                      {result.command_result?.action && (
                        <div className="result-info-block">
                          <p className="result-label">Mapped action</p>
                          <div className="action-chip">
                            {result.command_result.action}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="error-box">
                      {result.command_result?.error || "Không tìm thấy lệnh phù hợp"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="quick-command-box">
              <h4>Quick command test</h4>
              <div className="quick-command-list">
                {commands.length > 0 ? (
                  commands.map((item, index) => (
                    <button
                      key={index}
                      className="quick-chip"
                      onClick={() => handleQuickCommand(item.voice)}
                      disabled={isSending}
                    >
                      {item.voice}
                    </button>
                  ))
                ) : (
                  <p>Không tải được danh sách lệnh.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}