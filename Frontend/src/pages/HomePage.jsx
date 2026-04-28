import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={`dashboard-page ${darkMode ? "voice-dark" : ""}`}>
      
      {/* ===== NAVBAR ===== */}
      <header className="voice-topbar">
        <div>
          <p className="voice-mini-title">SMART HOME</p>
          <h1>Recognition System</h1>
        </div>

        <div className="voice-nav-pills">
          <span className="voice-pill active">🏠 Home</span>

          

          <Link to="/face" className="voice-pill">
            👤 Face
          </Link>

          <Link to="/iot" className="voice-pill">
            📡 IoT
          </Link>

          
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="hero-card">
        <div className="hero-title">
          <span className="hero-icon">🏠</span>
          <h1>Smart Home Dashboard</h1>
        </div>
        <p>Welcome to the Smart Home Voice & Face Recognition System</p>
      </section>

      <section className="system-grid">
        <div className="system-card voice-card">
          <p className="system-label">VOICE SYSTEM</p>
          <h2>🎤 Voice Recognition</h2>
          <p className="system-desc">
            Register voice samples and use advanced voice recognition to
            identify speakers. Save voice profiles and get real-time
            recognition results with confidence scores.
          </p>

          <ul className="feature-list">
            <li>Record and save voice samples</li>
            <li>Real-time voice recognition</li>
            <li>Confidence-based results</li>
          </ul>

          <Link to="/voice" className="system-btn green-btn">
            Get Started →
          </Link>
        </div>

        <div className="system-card face-card">
          <p className="system-label blue-text">FACE SYSTEM</p>
          <h2>👤 Face Recognition</h2>
          <p className="system-desc">
            Capture face images and register them with names. Use computer
            vision to detect and recognize faces with high accuracy and
            detailed confidence metrics.
          </p>

          <ul className="feature-list">
            <li>Capture face images</li>
            <li>Register with names</li>
            <li>Real-time detection</li>
          </ul>

          <Link to="/face" className="system-btn blue-btn">
            Get Started →
          </Link>
        </div>

        {/* 👉 Thêm luôn IoT card cho đồng bộ */}
        <div className="system-card">
          <p className="system-label">IOT SYSTEM</p>
          <h2>📡 IoT Dashboard</h2>
          <p className="system-desc">
            Theo dõi cảm biến và điều khiển đèn, quạt, khóa thông minh.
          </p>

          <Link to="/iot" className="system-btn green-btn">
            Open Dashboard →
          </Link>
        </div>
      </section>

      <section className="stats-card">
        <h3>System Features</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <h2 className="green-text">3</h2>
            <p>Systems</p>
          </div>

          <div className="stat-item">
            <h2 className="blue-text">Real-time</h2>
            <p>Live Detection</p>
          </div>

          <div className="stat-item">
            <h2 className="purple-text">IoT</h2>
            <p>Device Control</p>
          </div>

          <div className="stat-item">
            <h2 className="orange-text">100%</h2>
            <p>Responsive</p>
          </div>
        </div>
      </section>

      <section className="about-card">
        <p>
          <strong>Welcome to Smart Home Recognition System.</strong> This
          application demonstrates modern voice, face recognition and IoT
          control through a responsive web interface.
        </p>
      </section>
    </div>
  );
}