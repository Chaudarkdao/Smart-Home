import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IotPage from "./pages/IotPage";
import LogSensor from "./pages/LogSensor";
import FacePage from "./pages/FacePage";
import FaceRegisterPage from "./pages/FaceRegisterPage";
import "./App.css";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IotPage />} />
        <Route path="/iot" element={<IotPage />} />
        <Route path="/logsensor" element={<LogSensor />} />
        <Route path="/face" element={<FacePage />} />
        <Route path="/face/register" element={<FaceRegisterPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
