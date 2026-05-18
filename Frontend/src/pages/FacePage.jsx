import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  registerFace,
  getFaceStatus,
  listFaces,
  deleteFaceByName,
} from "../services/faceApi";
import SensorFaceGate from "../components/FaceRecogniotion/SensorFaceGate";
import PremiumHeaderStatus from "../components/PremiumHeaderStatus";
import { getIotData } from "../services/iotApi";
import "./iotpage.css";
import "./facepage.css";

export default function FacePage() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [registerName, setRegisterName] = useState("");
  const [registerFile, setRegisterFile] = useState(null);
  const [registerPreview, setRegisterPreview] = useState("");
  const [registerResult, setRegisterResult] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [recentAttendance, setRecentAttendance] = useState([]);
  const [knownNames, setKnownNames] = useState([]);

  const [iotData, setIotData] = useState({
    temp: 0,
    humi: 0,
    light: 0,
    pir: 0,
    led: 0,
    fan: 4,
    servo: 8,
    auth: 10,
  });

  const revokePreview = (url) => {
    if (url) URL.revokeObjectURL(url);
  };

  const openCamera = async () => {
    try {
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
      alert("Unable to open camera");
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

        revokePreview(registerPreview);
        setRegisterFile(file);
        setRegisterPreview(previewUrl);
        setRegisterResult(null);

        closeCamera();
      },
      "image/jpeg",
      0.95
    );
  };

  useEffect(() => {
    return () => {
      revokePreview(registerPreview);
      closeCamera();
    };
  }, []);

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const dataRes = await getIotData();
        setIotData((prev) => ({
          ...prev,
          ...dataRes,
          pir: dataRes.pir ?? dataRes.dist ?? prev.pir ?? 0,
        }));
      } catch (e) {
        console.error("Face page IoT poll:", e);
      }
    };
    fetchRealtime();
    const id = window.setInterval(fetchRealtime, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [listRes, statusRes] = await Promise.all([listFaces(), getFaceStatus()]);
        if (Array.isArray(listRes?.names)) setKnownNames(listRes.names);
        const recent = statusRes?.data?.recent_attendance;
        if (Array.isArray(recent)) setRecentAttendance(recent.slice(-20).reverse());
      } catch (e) {
        console.error("Face meta load:", e);
      }
    };
    loadMeta();
    const id = window.setInterval(loadMeta, 5000);
    return () => clearInterval(id);
  }, []);

  const handleDeleteFace = async (name) => {
    if (!window.confirm(`Delete face "${name}"?`)) return;
    try {
      setIsLoading(true);
      await deleteFaceByName(name);
      const listRes = await listFaces();
      setKnownNames(Array.isArray(listRes?.names) ? listRes.names : []);
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRegister = (e) => {
    const file = e.target.files?.[0] || null;
    revokePreview(registerPreview);
    setRegisterFile(file);
    setRegisterPreview(file ? URL.createObjectURL(file) : "");
    setRegisterResult(null);
  };

  const handleRegister = async () => {
    const name = registerName.trim();

    if (!name) {
      alert("Please enter a name");
      return;
    }

    if (!registerFile) {
      alert("Please choose a photo or capture from camera");
      return;
    }

    try {
      setIsLoading(true);

      const res = await registerFace(name, registerFile);

      setRegisterResult({
        success: true,
        name: res?.name || name,
        message: res?.message || "Registered successfully",
        ...res,
      });

      try {
        const listRes = await listFaces();
        setKnownNames(Array.isArray(listRes?.names) ? listRes.names : []);
      } catch {
        /* ignore */
      }

      alert("Face registered successfully");
    } catch (error) {
      console.error("Register face error:", error);

      setRegisterResult({
        success: false,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Registration failed",
      });

      alert("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const clearRegister = () => {
    revokePreview(registerPreview);
    setRegisterName("");
    setRegisterFile(null);
    setRegisterPreview("");
    setRegisterResult(null);
  };

  const renderRegisterResult = () => {
    const ok = !!registerResult?.success;

    return (
      <div className="face-result-inner">
        {ok ? (
          <>
            <div className="face-result-status">
              <span className="face-badge success">Registered</span>
            </div>
            <div className="face-result-info">
              <p className="face-result-label">Registered name</p>
              <div className="face-highlight">{registerResult.name}</div>
            </div>
          </>
        ) : (
          <div className="face-error-msg">
            {registerResult?.message || "Unable to register face."}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="iot-premium-page">
      <div className="iot-premium-shell">
        <header className="iot-premium-header">
          <div>
            <p className="iot-hi-text">Hi Khang,</p>
            <h1>Welcome to your home</h1>
            <div className="iot-top-actions">
              <Link to="/iot" className="iot-nav-pill">
                📡 IoT
              </Link>
              <Link to="/logsensor" className="iot-nav-pill">
                📊 Log Sensor
              </Link>
              <Link to="/face" className="iot-nav-pill active">
                👤 Face
              </Link>
            </div>
          </div>

          <PremiumHeaderStatus humi={iotData.humi} temp={iotData.temp} />
        </header>

        <main className="iot-premium-grid">
          <div className="iot-left-panel face-left-panel">
            <SensorFaceGate />
          </div>

          <div className="face-right-panel">
            <section className="face-tools-card face-glass-card">
              <p className="iot-card-label">REGISTER</p>
              <h2 className="face-tools-heading">New Face</h2>

              <div className="face-section-head">
                <h4>Photo &amp; name</h4>
                <div className="face-tool-actions">
                  <button
                    type="button"
                    className="face-btn face-btn-secondary"
                    onClick={openCamera}
                    disabled={isLoading}
                  >
                    📷 Camera
                  </button>
                  <button
                    type="button"
                    className={`face-btn face-btn-primary face-btn-save ${
                      registerName.trim() && registerFile && !isLoading ? "ready" : ""
                    }`}
                    onClick={handleRegister}
                    disabled={isLoading || !registerName.trim() || !registerFile}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="face-btn face-btn-muted"
                    onClick={clearRegister}
                    disabled={isLoading}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <input
                className="face-input-text"
                type="text"
                placeholder="Enter name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />

              <input
                className="face-input-file"
                type="file"
                accept="image/*"
                onChange={handleSelectRegister}
              />

              {registerPreview && (
                <div className="face-preview-wrap">
                  <img
                    src={registerPreview}
                    alt="register preview"
                    className="face-preview-img"
                  />
                </div>
              )}

            </section>

            <aside className="face-result-aside face-glass-card">
            <div className="face-result-header">
              <p className="iot-card-label">RESULT</p>
              <h2>Registration Result</h2>
            </div>

            <div className="face-result-body">
              {!registerResult ? (
                <div className="face-result-placeholder">No result yet.</div>
              ) : (
                renderRegisterResult()
              )}
            </div>
            </aside>
          </div>
        </main>

        <div
          className="face-meta-section"
          aria-label="Attendance history and registered faces"
        >
          <section className="face-glass-card">
            <h3 className="face-meta-card-title">Entry History</h3>
            {recentAttendance.length === 0 ? (
              <div className="face-meta-empty premium-empty-state">
                <p className="premium-empty-title">No entries yet</p>
                <p className="premium-empty-hint">
                  When someone is recognized at the door, their visit will show up here.
                </p>
              </div>
            ) : (
              <table className="face-attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((row, i) => (
                    <tr key={`${row.time || ""}_${i}`}>
                      <td>{row.name || "—"}</td>
                      <td>{row.timestamp || row.time || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section className="face-glass-card">
            <h3 className="face-meta-card-title">Registered Faces</h3>
            {knownNames.length === 0 ? (
              <p className="face-meta-empty">No faces registered.</p>
            ) : (
              <div className="face-name-list">
                {knownNames.map((n) => (
                  <span key={n} className="face-name-chip">
                    {n}
                    <button
                      type="button"
                      onClick={() => handleDeleteFace(n)}
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {cameraOpen && (
        <div className="face-camera-modal">
          <div className="face-camera-dialog">
            <h3>Capture Registration Photo</h3>

            <video ref={videoRef} autoPlay playsInline muted className="face-camera-video" />

            <div className="face-camera-actions">
              <button
                type="button"
                className="face-btn face-btn-primary"
                onClick={captureFromCamera}
              >
                📸 Capture
              </button>
              <button type="button" className="face-btn face-btn-muted" onClick={closeCamera}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
