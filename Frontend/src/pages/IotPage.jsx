import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  controlDevice,
  getIotData,
  getIotHistory,
  triggerAiAuth,
} from "../services/iotApi";

export default function IotPage() {
  const [isLoading, setIsLoading] = useState(false);

  const [iotData, setIotData] = useState({
    temp: 0,
    humi: 0,
    light: 0,
    pir: 0,
    led: 0,
    fan: 0,
    servo: 0,
  });

  const [history, setHistory] = useState({
    temp: [],
    humi: [],
  });

  const fetchAll = async () => {
    try {
      const [dataRes, historyRes] = await Promise.all([
        getIotData(),
        getIotHistory(),
      ]);

      setIotData((prev) => ({
        ...prev,
        ...dataRes,
        pir: dataRes.pir ?? dataRes.dist ?? 0,
      }));

      setHistory(historyRes);
    } catch (error) {
      console.error("IoT error:", error);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleControl = async (device, value) => {
    try {
      setIsLoading(true);
      await controlDevice(device, value);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Điều khiển thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiAuth = async (authVal) => {
    try {
      setIsLoading(true);
      await triggerAiAuth(authVal);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Trigger AI Auth thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const tempWarning = Number(iotData.temp) > 40;

  const tempChartData = useMemo(() => {
    return (history.temp || []).map((v, i) => ({
      name: `${i + 1}`,
      value: v,
    }));
  }, [history.temp]);

  const humiChartData = useMemo(() => {
    return (history.humi || []).map((v, i) => ({
      name: `${i + 1}`,
      value: v,
    }));
  }, [history.humi]);

  const todayText = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="iot-dashboard-page">
      <div className="iot-dashboard-shell">
        <header className="iot-dashboard-header">
          <div>
            <p className="iot-dashboard-mini">SMART HOME</p>
            <h1>IoT Dashboard</h1>
          </div>

          <div className="iot-top-actions">
            <Link to="/" className="iot-nav-pill">🏠 Home</Link>
            <Link to="/face" className="iot-nav-pill">👤 Face</Link>
            <span className="iot-nav-pill active">📡 IoT</span>
          </div>
        </header>

        {tempWarning && (
          <div className="iot-alert danger">
            ⚠️ Nhiệt độ quá cao ({iotData.temp}°C)
          </div>
        )}

        <p className="iot-welcome-text">Hi user,</p>
        <h2 className="iot-welcome-heading">Welcome to your home</h2>

        <div className="iot-main-layout">
          <div className="iot-left-column">
            <div className="iot-chart-grid">
              <div className="iot-chart-card">
                <p className="iot-card-label">TEMPERATURE LOG</p>

                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={tempChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="value" stroke="#4ade80" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="iot-chart-card">
                <p className="iot-card-label">HUMIDITY LOG</p>

                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={humiChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="value" stroke="#60a5fa" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="iot-device-grid">
              <div className="iot-device-card">
                <h3>💡 Lamp</h3>
                <button
                  disabled={isLoading}
                  className={`iot-toggle ${iotData.led ? "active" : ""}`}
                  onClick={() => handleControl("led", iotData.led ? 0 : 1)}
                />
              </div>

              <div className="iot-device-card">
                <h3>🌀 Fan</h3>
                <button
                  disabled={isLoading}
                  className={`iot-toggle ${iotData.fan ? "active" : ""}`}
                  onClick={() => handleControl("fan", iotData.fan ? 0 : 1)}
                />
              </div>

              <div className="iot-device-card">
                <h3>🔐 Door</h3>
                <button
                  disabled={isLoading}
                  className={`iot-toggle ${Number(iotData.servo) > 45 ? "active" : ""}`}
                  onClick={() =>
                    handleControl("servo", Number(iotData.servo) > 45 ? 0 : 90)
                  }
                />
              </div>
            </div>

            
          </div>

          <div className="iot-right-column">
            <div className="iot-weather-card">
              <div className="iot-weather-icon">🌤️</div>
              <p>{todayText}</p>
              <h1>{iotData.temp}°</h1>
              <p>Indoor temperature</p>
            </div>

            <div className="iot-quick-stats">
              <div className="iot-quick-card">
                <p>Temp</p>
                <h3>{iotData.temp}°C</h3>
              </div>

              <div className="iot-quick-card">
                <p>Humi</p>
                <h3>{iotData.humi}%</h3>
              </div>

              <div className="iot-quick-card">
                <p>Light</p>
                <h3>{iotData.light}</h3>
              </div>

              <div className="iot-quick-card">
                <p>PIR</p>
                <h3>{Number(iotData.pir) ? "Có chuyển động" : "Không có"}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}