import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { compareFaces, detectFaces, registerFace } from "../services/faceApi";

export default function FacePage() {
  const [darkMode, setDarkMode] = useState(true);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState("detect");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [detectFile, setDetectFile] = useState(null);
  const [detectPreview, setDetectPreview] = useState("");
  const [detectResult, setDetectResult] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerFile, setRegisterFile] = useState(null);
  const [registerPreview, setRegisterPreview] = useState("");
  const [registerResult, setRegisterResult] = useState(null);

  const [compareFile1, setCompareFile1] = useState(null);
  const [compareFile2, setCompareFile2] = useState(null);
  const [comparePreview1, setComparePreview1] = useState("");
  const [comparePreview2, setComparePreview2] = useState("");
  const [compareResult, setCompareResult] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const detectCanvasRef = useRef(null);
  const detectImageRef = useRef(null);

  const mainResult = useMemo(() => {
    if (compareResult) return { type: "compare" };
    if (registerResult) return { type: "register" };
    if (detectResult) return { type: "detect" };
    return null;
  }, [detectResult, registerResult, compareResult]);

  const revokePreview = (url) => {
    if (url) URL.revokeObjectURL(url);
  };

  const openCamera = async (target = "detect") => {
    try {
      setCameraTarget(target);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Không thể mở camera");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const previewUrl = URL.createObjectURL(file);

        if (cameraTarget === "detect") {
          revokePreview(detectPreview);
          setDetectFile(file);
          setDetectPreview(previewUrl);
          setDetectResult(null);
          setAnnotatedImage("");
        }

        if (cameraTarget === "register") {
          revokePreview(registerPreview);
          setRegisterFile(file);
          setRegisterPreview(previewUrl);
          setRegisterResult(null);
        }

        if (cameraTarget === "compare1") {
          revokePreview(comparePreview1);
          setCompareFile1(file);
          setComparePreview1(previewUrl);
          setCompareResult(null);
        }

        if (cameraTarget === "compare2") {
          revokePreview(comparePreview2);
          setCompareFile2(file);
          setComparePreview2(previewUrl);
          setCompareResult(null);
        }

        closeCamera();
      },
      "image/jpeg",
      0.95
    );
  };

  const drawDetections = (saveAnnotated = false) => {
    const canvas = detectCanvasRef.current;
    const img = detectImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayedWidth = img.clientWidth || 0;
    const displayedHeight = img.clientHeight || 0;
    if (!displayedWidth || !displayedHeight) return;

    canvas.width = displayedWidth;
    canvas.height = displayedHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detectResult?.faces?.length) {
      if (saveAnnotated) setAnnotatedImage("");
      return;
    }

    const naturalWidth = img.naturalWidth || displayedWidth;
    const naturalHeight = img.naturalHeight || displayedHeight;
    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;

    detectResult.faces.forEach((face, index) => {
      if (!face.bbox || face.bbox.length < 4) return;

      const [x1, y1, x2, y2] = face.bbox;
      const bx = x1 * scaleX;
      const by = y1 * scaleY;
      const bw = (x2 - x1) * scaleX;
      const bh = (y2 - y1) * scaleY;

      const recognized =
        face.recognized_name && face.recognized_name !== "unknown"
          ? face.recognized_name
          : null;

      const label = recognized || `Face ${index + 1}`;
      const conf = Number(face.confidence || 0).toFixed(2);
      const text = `${label} (${conf})`;

      const strokeColor = recognized ? "#22c55e" : "#22d3ee";
      const fillColor = recognized
        ? "rgba(34, 197, 94, 0.12)"
        : "rgba(34, 211, 238, 0.12)";

      ctx.lineWidth = 3;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillRect(bx, by, bw, bh);

      ctx.font = "bold 14px Arial";
      const textWidth = ctx.measureText(text).width;
      const labelHeight = 28;
      const labelX = bx;
      const labelY = by > 34 ? by - 34 : by + 6;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(labelX, labelY, textWidth + 18, labelHeight);
      ctx.fillStyle = "#08111f";
      ctx.fillText(text, labelX + 9, labelY + 19);
    });

    if (saveAnnotated) {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = img.naturalWidth || displayedWidth;
      exportCanvas.height = img.naturalHeight || displayedHeight;

      const exportCtx = exportCanvas.getContext("2d");
      if (!exportCtx) return;

      exportCtx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);

      detectResult.faces.forEach((face, index) => {
        if (!face.bbox || face.bbox.length < 4) return;

        const [x1, y1, x2, y2] = face.bbox;
        const bw = x2 - x1;
        const bh = y2 - y1;

        const recognized =
          face.recognized_name && face.recognized_name !== "unknown"
            ? face.recognized_name
            : null;

        const label = recognized || `Face ${index + 1}`;
        const conf = Number(face.confidence || 0).toFixed(2);
        const text = `${label} (${conf})`;

        const strokeColor = recognized ? "#22c55e" : "#22d3ee";
        const fillColor = recognized
          ? "rgba(34, 197, 94, 0.12)"
          : "rgba(34, 211, 238, 0.12)";

        exportCtx.lineWidth = 4;
        exportCtx.strokeStyle = strokeColor;
        exportCtx.fillStyle = fillColor;
        exportCtx.strokeRect(x1, y1, bw, bh);
        exportCtx.fillRect(x1, y1, bw, bh);

        exportCtx.font = "bold 20px Arial";
        const textWidth = exportCtx.measureText(text).width;
        const labelHeight = 34;
        const labelX = x1;
        const labelY = y1 > 40 ? y1 - 40 : y1 + 8;

        exportCtx.fillStyle = strokeColor;
        exportCtx.fillRect(labelX, labelY, textWidth + 22, labelHeight);
        exportCtx.fillStyle = "#08111f";
        exportCtx.fillText(text, labelX + 11, labelY + 23);
      });

      setAnnotatedImage(exportCanvas.toDataURL("image/png"));
    }
  };

  useEffect(() => {
    drawDetections(true);
  }, [detectResult, detectPreview]);

  useEffect(() => {
    return () => {
      revokePreview(detectPreview);
      revokePreview(registerPreview);
      revokePreview(comparePreview1);
      revokePreview(comparePreview2);
      closeCamera();
    };
  }, []);

  const handleSelectDetect = (e) => {
    const file = e.target.files?.[0] || null;
    revokePreview(detectPreview);
    setDetectFile(file);
    setDetectPreview(file ? URL.createObjectURL(file) : "");
    setDetectResult(null);
    setAnnotatedImage("");
  };

  const handleSelectRegister = (e) => {
    const file = e.target.files?.[0] || null;
    revokePreview(registerPreview);
    setRegisterFile(file);
    setRegisterPreview(file ? URL.createObjectURL(file) : "");
    setRegisterResult(null);
  };

  const handleSelectCompare1 = (e) => {
    const file = e.target.files?.[0] || null;
    revokePreview(comparePreview1);
    setCompareFile1(file);
    setComparePreview1(file ? URL.createObjectURL(file) : "");
    setCompareResult(null);
  };

  const handleSelectCompare2 = (e) => {
    const file = e.target.files?.[0] || null;
    revokePreview(comparePreview2);
    setCompareFile2(file);
    setComparePreview2(file ? URL.createObjectURL(file) : "");
    setCompareResult(null);
  };

  const handleDetect = async () => {
    if (!detectFile) {
      alert("Chọn ảnh hoặc chụp bằng camera trước");
      return;
    }

    try {
      setIsLoading(true);
      const res = await detectFaces(detectFile);
      setDetectResult(res);
      setRegisterResult(null);
      setCompareResult(null);
    } catch (error) {
      console.error(error);
      alert("Detect thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
  const name = registerName.trim();

  if (!name) {
    alert("Vui lòng nhập tên người dùng");
    return;
  }

  if (!registerFile) {
    alert("Vui lòng chọn ảnh hoặc chụp bằng camera");
    return;
  }

  try {
    setIsLoading(true);

    const res = await registerFace(name, registerFile);

    setRegisterResult({
      success: true,
      name: res?.name || name,
      message: res?.message || "Đăng ký thành công",
      ...res,
    });

    setDetectResult(null);
    setCompareResult(null);

    alert("Đăng ký khuôn mặt thành công");
  } catch (error) {
    console.error("Register face error:", error);

    setRegisterResult({
      success: false,
      message:
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Đăng ký thất bại",
    });

    alert("Đăng ký thất bại");
  } finally {
    setIsLoading(false);
  }
};

  const handleCompare = async () => {
    if (!compareFile1 || !compareFile2) {
      alert("Chọn hoặc chụp đủ 2 ảnh");
      return;
    }

    try {
      setIsLoading(true);
      const res = await compareFaces(compareFile1, compareFile2);
      setCompareResult(res);
      setDetectResult(null);
      setRegisterResult(null);
    } catch (error) {
      console.error(error);
      alert("So sánh thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const clearDetect = () => {
    revokePreview(detectPreview);
    setDetectFile(null);
    setDetectPreview("");
    setDetectResult(null);
    setAnnotatedImage("");
  };

  const clearRegister = () => {
    revokePreview(registerPreview);
    setRegisterName("");
    setRegisterFile(null);
    setRegisterPreview("");
    setRegisterResult(null);
  };

  const clearCompare = () => {
    revokePreview(comparePreview1);
    revokePreview(comparePreview2);
    setCompareFile1(null);
    setCompareFile2(null);
    setComparePreview1("");
    setComparePreview2("");
    setCompareResult(null);
  };

  const renderDetectResult = () => {
    const faces = detectResult?.faces || [];
    const firstFace = faces[0];

    return (
      <div className="result-card pretty-result-card">
        {faces.length > 0 ? (
          <>
            {annotatedImage && (
              <div className="result-info-block">
                <p className="result-label">Kết quả nhận diện</p>
                <div className="annotated-result-wrap">
                  <img
                    src={annotatedImage}
                    alt="annotated detection"
                    className="annotated-result-img"
                  />
                </div>
              </div>
            )}

            {firstFace?.recognized_name &&
              firstFace.recognized_name !== "unknown" && (
                <div className="result-info-block">
                  <p className="result-label">Tên nhận diện</p>
                  <div className="command-highlight">
                    {firstFace.recognized_name}
                  </div>
                </div>
              )}
          </>
        ) : (
          <div className="error-box">Không tìm thấy khuôn mặt.</div>
        )}
      </div>
    );
  };

  const renderRegisterResult = () => {
    const ok = !!registerResult?.success;

    return (
      <div className="result-card pretty-result-card">
        {ok ? (
          <>
            <div className="result-status-line">
              <span className="result-status-badge success">
                Đăng ký thành công
              </span>
            </div>
            <div className="result-info-block">
              <p className="result-label">Tên đã đăng ký</p>
              <div className="command-highlight">{registerResult.name}</div>
            </div>
          </>
        ) : (
          <div className="error-box">
            {registerResult?.message || "Không thể đăng ký khuôn mặt."}
          </div>
        )}
      </div>
    );
  };

  const renderCompareResult = () => {
    const ok = !!compareResult?.verified;

    return (
      <div className="result-card pretty-result-card">
        {compareResult?.error ? (
          <div className="error-box">{compareResult.error}</div>
        ) : (
          <>
            <div className="result-status-line">
              <span
                className={`result-status-badge ${ok ? "success" : "failed"}`}
              >
                {ok ? "Cùng một người" : "Không trùng khớp"}
              </span>
            </div>

            <div className="result-info-block">
              <p className="result-label">Kết quả so sánh</p>
              <div className="command-highlight">
                {ok ? "MATCH" : "NO MATCH"}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`voice-ui-page ${darkMode ? "voice-dark" : ""}`}>
      <div className="voice-shell">
        <header className="voice-topbar">
          <div>
            <p className="voice-mini-title">SMART HOME</p>
            <h1>Face Control</h1>
          </div>

          <div className="voice-nav-pills">
            <Link to="/" className="voice-pill">
              🏠 Home
            </Link>
            
            <span className="voice-pill active">👤 Face</span>
            <Link to="/iot" className="voice-pill">
              📡 IoT
            </Link>
          </div>
        </header>

        <section className="voice-banner">
          <h3>👤 Nhận diện khuôn mặt</h3>
          <p>Chọn ảnh hoặc dùng camera để phát hiện, đăng ký hoặc so sánh.</p>
        </section>

        <section className="voice-main-grid face-main-grid">
          <div className="voice-left-card">
            <p className="section-label">FACE INPUT</p>
            <h2>Nhận diện khuôn mặt</h2>

            <div className="face-section-box">
              <div className="face-section-head">
                <h4>Detect face</h4>
                <div className="record-actions">
                  <button
                    className="camera-btn"
                    onClick={() => openCamera("detect")}
                    disabled={isLoading}
                  >
                    📷 Camera
                  </button>
                  <button
                    className="record-btn"
                    onClick={handleDetect}
                    disabled={isLoading || !detectFile}
                  >
                    Detect
                  </button>
                  <button
                    className="clear-btn"
                    onClick={clearDetect}
                    disabled={isLoading}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <input
                className="pretty-file-input"
                type="file"
                accept="image/*"
                onChange={handleSelectDetect}
              />

              {detectPreview && (
                <div className="single-preview-wrap detect-preview-wrap">
                  <img
                    ref={detectImageRef}
                    src={detectPreview}
                    alt="detect preview"
                    className="face-preview-img"
                    onLoad={() => drawDetections(true)}
                  />
                  <canvas ref={detectCanvasRef} className="detect-canvas" />
                </div>
              )}
            </div>

            <div className="face-section-box">
              <div className="face-section-head">
                <h4>Register face</h4>
                <div className="record-actions">
                  <button
                    className="camera-btn"
                    onClick={() => openCamera("register")}
                    disabled={isLoading}
                  >
                    📷 Camera
                  </button>
                 <button
  className={`save-btn ${
    registerName.trim() && registerFile && !isLoading ? "ready" : ""
  }`}
  onClick={handleRegister}
  disabled={isLoading || !registerName.trim() || !registerFile}
>
  {isLoading ? "Saving..." : "Save"}
</button>
                  <button
                    className="clear-btn"
                    onClick={clearRegister}
                    disabled={isLoading}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <input
                className="pretty-text-input"
                type="text"
                placeholder="Nhập tên người dùng"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />

              <input
                className="pretty-file-input"
                type="file"
                accept="image/*"
                onChange={handleSelectRegister}
              />

              {registerPreview && (
                <div className="single-preview-wrap">
                  <img
                    src={registerPreview}
                    alt="register preview"
                    className="face-preview-img"
                  />
                </div>
              )}
            </div>

            <div className="face-section-box">
              <div className="face-section-head">
                <h4>Compare 2 faces</h4>
                <div className="record-actions">
                  <button
                    className="record-btn"
                    onClick={handleCompare}
                    disabled={isLoading || !compareFile1 || !compareFile2}
                  >
                    Compare
                  </button>
                  <button
                    className="clear-btn"
                    onClick={clearCompare}
                    disabled={isLoading}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="compare-camera-actions">
                <button
                  className="camera-btn"
                  onClick={() => openCamera("compare1")}
                  disabled={isLoading}
                >
                  📷 Face 1
                </button>
                <button
                  className="camera-btn"
                  onClick={() => openCamera("compare2")}
                  disabled={isLoading}
                >
                  📷 Face 2
                </button>
              </div>

              <div className="compare-upload-grid">
                <div>
                  <input
                    className="pretty-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleSelectCompare1}
                  />
                  {comparePreview1 && (
                    <div className="single-preview-wrap">
                      <img
                        src={comparePreview1}
                        alt="compare 1"
                        className="face-preview-img"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <input
                    className="pretty-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleSelectCompare2}
                  />
                  {comparePreview2 && (
                    <div className="single-preview-wrap">
                      <img
                        src={comparePreview2}
                        alt="compare 2"
                        className="face-preview-img"
                      />
                    </div>
                  )}
                </div>
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
              {!mainResult ? (
                <div className="result-placeholder">Chưa có kết quả.</div>
              ) : mainResult.type === "detect" ? (
                renderDetectResult()
              ) : mainResult.type === "register" ? (
                renderRegisterResult()
              ) : (
                renderCompareResult()
              )}
            </div>
          </div>
        </section>
      </div>

      {cameraOpen && (
        <div className="camera-modal">
          <div className="camera-box">
            <h3>Camera Capture</h3>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video"
            />

            <div className="camera-actions">
              <button className="record-btn" onClick={captureFromCamera}>
                📸 Capture
              </button>
              <button className="clear-btn" onClick={closeCamera}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}