import React, { useEffect, useMemo, useState } from "react";
import AppNav from "../components/Common/AppNav";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
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

const AXIS_COLOR = "#0f172a";
const TEMP_LINE_COLOR = "#dc2626";
const CHART_X_LABEL_TICKS = [0.5, 6.5, 12.5, 18.5, 23.5];
const TEMP_Y_DOMAIN = [0, 50];
const TEMP_Y_TICKS = [0, 10, 20, 30, 40, 50];

const AXIS_TICK = {
  fontSize: 11,
  fill: AXIS_COLOR,
  fontWeight: 700,
};

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

const padHour = (hour) => String(hour).padStart(2, "0");

const formatDayAxisLabel = (position) => {
  if (position === 0.5) return "00:00";
  if (position === 6.5) return "06:00";
  if (position === 12.5) return "12:00";
  if (position === 18.5) return "18:00";
  if (position === 23.5) return "23:00";
  return "";
};

function DayAxisTick({ x, y, payload }) {
  const position = Number(payload?.value);
  const label = formatDayAxisLabel(position);
  if (!label) return null;

  return (
    <text
      x={x}
      y={y + 14}
      fill={AXIS_COLOR}
      fontSize={11}
      fontWeight={700}
      textAnchor="middle"
    >
      {label}
    </text>
  );
}

const humidityBarColor = (value) => {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const cold = { r: 56, g: 189, b: 248 };
  const hot = { r: 239, g: 68, b: 68 };
  const t = v / 100;
  const r = Math.round(cold.r + (hot.r - cold.r) * t);
  const g = Math.round(cold.g + (hot.g - cold.g) * t);
  const b = Math.round(cold.b + (hot.b - cold.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
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

const buildDayChartData = (rows, dataKey) => {
  const slots = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    time: `${padHour(hour)}:00`,
    [dataKey]: 0,
  }));

  rows.forEach((row) => {
    const match = String(row.time || "").match(/^(\d{2}):/);
    if (!match) return;
    const hour = Number(match[1]);
    if (hour < 0 || hour > 23) return;
    slots[hour][dataKey] = toNumber(row[dataKey]);
  });

  return slots;
};

const chartMargins = { top: 14, right: 22, left: 2, bottom: 2 };

const AXIS_LINE_STYLE = {
  stroke: AXIS_COLOR,
  strokeWidth: 1.8,
};

function SensorChart({ title, data, dataKey, variant = "line" }) {
  const chartRows = useMemo(
    () => buildDayChartData(data, dataKey),
    [data, dataKey]
  );

  const yDomain = useMemo(() => {
    const values = chartRows
      .map((row) => Number(row[dataKey]))
      .filter((v) => !Number.isNaN(v));

    if (variant === "bar") {
      return [0, 100];
    }

    return TEMP_Y_DOMAIN;
  }, [variant]);

  const tooltipLabel = (item) => {
    if (item?.time == null) return "";
    return `${item.time} – ${padHour(item.hour)}:59`;
  };

  const sharedAxes = (
    <>
      <XAxis
        type="number"
        dataKey="hour"
        domain={[0, 23]}
        allowDecimals={false}
        ticks={CHART_X_LABEL_TICKS}
        tick={DayAxisTick}
        axisLine={AXIS_LINE_STYLE}
        tickLine={false}
        height={34}
        tickMargin={6}
      />
      <YAxis
        width={42}
        domain={yDomain}
        ticks={variant === "line" ? TEMP_Y_TICKS : undefined}
        tick={AXIS_TICK}
        axisLine={AXIS_LINE_STYLE}
        tickLine={false}
        tickMargin={6}
        tickCount={variant === "bar" ? 5 : undefined}
        allowDecimals={variant === "bar"}
      />
      <Tooltip
        labelFormatter={(_, payload) => tooltipLabel(payload?.[0]?.payload)}
        formatter={(value) => {
          const unit = dataKey === "temp" ? "°C" : "%";
          const name = dataKey === "temp" ? "Temperature" : "Humidity";
          return [`${value}${unit}`, name];
        }}
      />
    </>
  );

  return (
    <div className="iot-chart-card">
      <h3 className="iot-card-label">{title}</h3>

      <div className="iot-chart-area">
        <ResponsiveContainer width="100%" height="100%">
          {variant === "bar" ? (
            <BarChart data={chartRows} margin={chartMargins} barCategoryGap="18%">
              {sharedAxes}
              <Bar
                dataKey={dataKey}
                radius={[6, 6, 0, 0]}
                maxBarSize={14}
                isAnimationActive={false}
              >
                {chartRows.map((row) => (
                  <Cell
                    key={`bar-${row.hour}`}
                    fill={humidityBarColor(row[dataKey])}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={chartRows} margin={chartMargins}>
              {sharedAxes}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={TEMP_LINE_COLOR}
                strokeWidth={3}
                dot={{ r: 4, fill: TEMP_LINE_COLOR, stroke: "#fff", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: TEMP_LINE_COLOR, stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
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
                variant="line"
              />

              <SensorChart
                title="HUMIDITY LOG"
                data={chartData}
                dataKey="humi"
                variant="bar"
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
  <span>Green</span>
  <span>Red</span>
  <span>White</span>
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