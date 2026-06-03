import React, { useEffect, useMemo, useRef, useState } from "react";
import AppNav from "../components/Common/AppNav";
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
  getIotChartHistory,
} from "../services/iotApi";

import fanImg from "../assets/smart_fan.png";
import ledImg from "../assets/smart_lamp.png";
import lockImg from "../assets/smart_lock.png";
import weatherImg from "../assets/toppng.com-real-sun-and-clouds-5000x3232.png";

import PremiumHeaderStatus from "../components/PremiumHeaderStatus";
import "./iotpage.css";

const VISIBLE_POINTS = 5;

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const formatLogTime = (value) => {
  if (!value) return "--:--";

  if (typeof value === "string") {
    const match = value.match(/(\d{2}:\d{2})(?::\d{2})?/);
    if (match) return match[1];

    return value;
  }

  return String(value);
};

const normalizeChartHistory = (historyRes) => {
  if (!historyRes?.chart || !Array.isArray(historyRes.chart)) return [];

  return historyRes.chart.map((row, index) => ({
    id: `${row.time}_${index}`,
    time: formatLogTime(row.time),
    temp: toNumber(row.temp),
    humi: toNumber(row.humi),
  }));
};

/** Biểu đồ log temp/humi từ main — kéo ngang xem thêm điểm. */
function SensorChart({ title, data, dataKey, stroke }) {
  const [startIndex, setStartIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef({
    isDown: false,
    startX: 0,
    startIndex: 0,
  });

  useEffect(() => {
    if (data.length <= VISIBLE_POINTS) {
      setStartIndex(0);
      return;
    }
    setStartIndex(data.length - VISIBLE_POINTS);
  }, [data.length]);

  const maxStartIndex = Math.max(0, data.length - VISIBLE_POINTS);

  const visibleData = useMemo(() => {
    return data.slice(startIndex, startIndex + VISIBLE_POINTS);
  }, [data, startIndex]);

  const handleMouseDown = (e) => {
    dragState.current = {
      isDown: true,
      startX: e.clientX,
      startIndex,
    };
    setIsDragging(true);
  };

  const stopDragging = () => {
    dragState.current.isDown = false;
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDown) return;

    const diff = e.clientX - dragState.current.startX;
    const step = Math.round(diff / 45);

    let nextIndex = dragState.current.startIndex - step;
    nextIndex = Math.max(0, Math.min(nextIndex, maxStartIndex));

    setStartIndex(nextIndex);
  };

  return (
    <div className="iot-chart-card">
      <h3 className="iot-card-label">{title}</h3>

      <div
        className="iot-chart-drag-area"
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={handleMouseMove}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <ResponsiveContainer width="100%" height={190}>
          <LineChart
            data={visibleData}
            margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" interval={0} tick={{ fontSize: 11 }} />
            <YAxis width={40} tick={{ fontSize: 11 }} domain={["auto", "auto"]} />

            <Tooltip
              labelFormatter={(label) => `Thời gian: ${label}`}
              formatter={(value, name) => {
                const label = name === "temp" ? "Nhiệt độ" : "Độ ẩm";
                const unit = name === "temp" ? "°C" : "%";
                return [`${value}${unit}`, label];
              }}
            />

            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive
              animationDuration={250}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="iot-chart-hint">
        {data.length > VISIBLE_POINTS ? "Kéo trái để xem thêm dữ liệu." : ""}
      </p>
    </div>
  );
}

export default function IotPage() {
  const [isLoading, setIsLoading] = useState(false);

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

  const [chartHistory, setChartHistory] = useState({ chart: [] });

  const fetchRealtimeData = async () => {
    try {
      const dataRes = await getIotData();

      setIotData((prev) => ({
        ...prev,
        ...dataRes,
        pir: dataRes.pir ?? dataRes.dist ?? prev.pir ?? 0,
      }));
    } catch (error) {
      console.error("Realtime IoT error:", error);
    }
  };

  const fetchChartHistory = async () => {
    try {
      const historyRes = await getIotChartHistory();
      setChartHistory(historyRes || { chart: [] });
    } catch (error) {
      console.error("Chart history error:", error);
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchRealtimeData(), fetchChartHistory()]);
  };

  useEffect(() => {
    fetchRealtimeData();
    fetchChartHistory();

    const realtimeInterval = setInterval(fetchRealtimeData, 3000);
    const chartInterval = setInterval(fetchChartHistory, 30000);

    return () => {
      clearInterval(realtimeInterval);
      clearInterval(chartInterval);
    };
  }, []);

  const chartData = useMemo(() => {
    return normalizeChartHistory(chartHistory)
      .filter((row) => {
        const [h] = row.time.split(":").map(Number);
        return h >= 0 && h <= 23;
      })
      .slice(-288)
      .map((row) => ({
        time: row.time,
        temp: Number(row.temp),
        humi: Number(row.humi),
      }));
  }, [chartHistory]);

  const handleControl = async (device, value) => {
    try {
      setIsLoading(true);

      await controlDevice(device, value);

      setIotData((prev) => ({
        ...prev,
        [device]: value,
      }));

      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Control failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fanLevel = Math.max(0, Number(iotData.fan) - 4);
  const doorUnlocked = Number(iotData.servo) === 9;

  const todayText = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const authVal = Number(iotData.auth ?? 10);

  const securityText =
    authVal === 11
      ? "MOTION DETECTED"
      : authVal === 12
      ? "VERIFYING FACE"
      : authVal === 13
      ? "AUTH SUCCESS"
      : authVal === 14
      ? "AUTH FAILED"
      : "NO MOTION";

  const handleLedSlider = (e) => {
    handleControl("led", Number(e.target.value));
  };

  const handleFanSlider = (e) => {
    handleControl("fan", Number(e.target.value) + 4);
  };

  return (
    <div className="iot-premium-page">
      <div className="iot-premium-shell">
        <header className="iot-premium-header">
          <div>
            <p className="iot-hi-text">Hi Khang,</p>
            <h1>Welcome to your home</h1>

            <AppNav active="iot" />
          </div>

          <PremiumHeaderStatus humi={iotData.humi} temp={iotData.temp} />
        </header>

        <main className="iot-premium-grid">
          <section className="iot-left-panel">
            <div className="iot-chart-row">
              <SensorChart
                title="TEMPERATURE LOG"
                data={chartData}
                dataKey="temp"
                stroke="#f97316"
              />

              <SensorChart
                title="HUMIDITY LOG"
                data={chartData}
                dataKey="humi"
                stroke="#3b82f6"
              />
            </div>

            <div className="iot-device-row">
              <div className="iot-device-card">
                <div className="iot-device-img-wrap">
                  <img src={ledImg} alt="Smart Lamp" />
                </div>

                <div className="iot-device-title">
                  <h3>Smart Lamp</h3>
                  <p>RGB Light</p>
                </div>

                <div className="mode-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={Number(iotData.led)}
                    disabled={isLoading}
                    onChange={handleLedSlider}
                    className="mode-slider"
                    data-value={Number(iotData.led)}
                  />

                  <div className="mode-slider-track">
                    <div
                      className="mode-slider-thumb"
                      style={{ left: `${2 + Number(iotData.led) * 47}px` }}
                    />
                  </div>

                  <div className="mode-labels mode-labels-led">
  <span>Off</span>
  <span>White</span>
  <span>Green</span>
  <span>Red</span>
</div>
                </div>
              </div>

              <div className="iot-device-card">
                <div className="iot-device-img-wrap">
                  <img
                    src={fanImg}
                    alt="Smart Fan"
                    className={fanLevel > 0 ? "iot-fan-spin" : ""}
                  />
                </div>

                <div className="iot-device-title">
                  <h3>Smart Fan</h3>
                  <p>PWM Control</p>
                </div>

                <div className="mode-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={fanLevel}
                    disabled={isLoading}
                    onChange={handleFanSlider}
                    className="mode-slider"
                    data-value={fanLevel}
                  />

                  <div className="mode-slider-track">
                    <div
                      className="mode-slider-thumb"
                      style={{ left: `${2 + fanLevel * 47}px` }}
                    />
                  </div>

                  <div className="mode-labels">
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                  </div>
                </div>
              </div>

              <div className="iot-device-card">
                <div className="iot-device-img-wrap">
                  <img src={lockImg} alt="Smart Lock" />
                </div>

                <div className="iot-device-title">
                  <h3>Smart Lock</h3>
                  <p>Servo Toggle</p>
                </div>

                <label className={`iot-lock-switch ${doorUnlocked ? "is-on" : ""}`}>
  <input
    type="checkbox"
    checked={doorUnlocked}
    disabled={isLoading}
    onChange={(e) =>
      handleControl("servo", e.target.checked ? 9 : 8)
    }
  />

  <span className="iot-lock-track">
    <span className="iot-lock-thumb" />
  </span>
</label>
              </div>
            </div>
          </section>

          <aside className="iot-weather-card">
            <div className="iot-weather-img">
              <img src={weatherImg} alt="Weather" />
            </div>

            <div className="iot-weather-content">
              <p className="iot-weather-date">{todayText}</p>
              <h2>{iotData.temp}°</h2>
              <p>Indoor temperature</p>
            </div>

            <div className="iot-weather-footer">
              <div>
                <p>Security Status</p>
                <h3 className={`status-${authVal}`}>{securityText}</h3>
              </div>

              <div>
                <p>Ambient Light</p>
                <h3>
                  {iotData.light} <span>%</span>
                </h3>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}