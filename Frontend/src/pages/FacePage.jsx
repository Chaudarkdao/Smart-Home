import React, { useEffect, useState } from "react";
import SensorFaceGate from "../components/FaceRecogniotion/SensorFaceGate";
import AppNav from "../components/Common/AppNav";
import PremiumHeaderStatus from "../components/PremiumHeaderStatus";
import { getIotData } from "../services/iotApi";
import "./iotpage.css";
import "./facepage.css";

export default function FacePage() {
  const [iotData, setIotData] = useState({
    temp: 0,
    humi: 0,
  });

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const dataRes = await getIotData();
        setIotData((prev) => ({
          ...prev,
          temp: dataRes.temp ?? prev.temp,
          humi: dataRes.humi ?? prev.humi,
        }));
      } catch (e) {
        console.error("Face page IoT poll:", e);
      }
    };
    fetchRealtime();
    const id = window.setInterval(fetchRealtime, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="iot-premium-page face-recognition-page">
      <div className="iot-premium-shell">
        <header className="iot-premium-header">
          <div>
            <p className="iot-hi-text">Hi Khang,</p>
            <h1>Welcome to your home</h1>
            <AppNav active="face" />
          </div>

          <PremiumHeaderStatus humi={iotData.humi} temp={iotData.temp} />
        </header>

        <main className="face-recognition-main">
          <SensorFaceGate />
        </main>
      </div>
    </div>
  );
}
