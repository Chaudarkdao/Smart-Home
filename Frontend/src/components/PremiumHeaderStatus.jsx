import React from "react";

export default function PremiumHeaderStatus({ humi = 0, temp = 0 }) {
  const todayText = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="iot-header-right">
      <div className="iot-header-panel">
        <div className="iot-header-panel-top">
          <span className="iot-live-dot" aria-hidden="true" />
          <span className="iot-live-label">Live</span>
          <span className="iot-header-date">{todayText}</span>
        </div>
        <div className="iot-status-pill iot-status-pill--compact">
          <span className="iot-metric">
            <small>Humidity</small>
            <strong>💧 {humi}%</strong>
          </span>
          <span className="iot-metric-sep" aria-hidden="true" />
          <span className="iot-metric">
            <small>Temp</small>
            <strong>🌡️ {temp}°</strong>
          </span>
        </div>
      </div>
      <div className="iot-user-circle" title="Profile">
        👤
      </div>
    </div>
  );
}
