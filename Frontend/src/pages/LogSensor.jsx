import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getIotChartHistory } from "../services/iotApi";
import "./logsensor.css";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const formatDate = (value) => {
  if (!value) return "--/--/----";

  const str = String(value);

  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;

  return "--/--/----";
};

const formatTime = (value) => {
  if (!value) return "--:--";

  const str = String(value);

  const match = str.match(/(\d{2}:\d{2})(?::\d{2})?/);
  if (match) return match[1];

  return str;
};

export default function LogSensor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getIotChartHistory();
      setLogs(Array.isArray(res?.chart) ? res.chart : []);
    } catch (error) {
      console.error("Fetch sensor logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const sensorLogs = useMemo(() => {
  return [...logs].reverse().map((item, index) => ({
    id: `${item.date}_${item.time}_${index}`,

    date: item.date || "--/--/----",
    time: item.time || "--:--",

    temp: toNumber(item.temp),
    humi: toNumber(item.humi),
    light: toNumber(item.light),
  }));
}, [logs]);

  const latestLog = sensorLogs[0] || {
    temp: 0,
    humi: 0,
    light: 0,
    date: "--/--/----",
    time: "--:--",
  };

  return (
    <div className="log-premium-page">
      <div className="log-premium-shell">
        <header className="log-premium-header">
          <div>
            <p className="log-hi-text">Hi Khang,</p>
            <h1>Welcome to your home</h1>

            <div className="log-top-actions">
              <Link to="/iot" className="log-nav-pill">
                📡 IoT
              </Link>

              <Link to="/logsensor" className="log-nav-pill active">
                📊 Log Sensor
              </Link>
            </div>
          </div>

          <div className="log-header-right">
            <div className="log-status-pill">
              <span>💧 {latestLog.humi}%</span>
              <span>🌡️ {latestLog.temp}°</span>
            </div>

            <div className="log-user-circle">👤</div>
          </div>
        </header>

        <main className="log-premium-grid">
          <section className="log-history-card">
            <div className="log-history-header">
              <div>
                <p className="log-mini-title">SMART HOME</p>
                <h2>Sensor History</h2>
                <p>
                  Dữ liệu log hiển thị trong 3 ngày gần nhất, mỗi điểm cách nhau
                  5 phút.
                </p>
              </div>

              <span className="log-count-pill">
                {loading ? "Loading..." : `${sensorLogs.length} logs`}
              </span>
            </div>

            {sensorLogs.length === 0 ? (
              <div className="log-empty-box">
                Chưa có dữ liệu log. Kiểm tra API /api/iot/chart-history.
              </div>
            ) : (
              <div className="log-table-wrap">
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Temperature</th>
                      <th>Humidity</th>
                      <th>Light</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sensorLogs.map((log, index) => (
                      <tr key={log.id}>
                        <td>{index + 1}</td>
                        <td>{log.date}</td>
                        <td>{log.time}</td>
                        <td>
                          <strong>{log.temp}</strong> °C
                        </td>
                        <td>
                          <strong>{log.humi}</strong> %
                        </td>
                        <td>
                          <strong>{log.light}</strong> %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}