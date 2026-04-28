import React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FacePage from "./pages/FacePage";
import VoicePage from "./pages/VoicePage";
import IotPage from "./pages/IotPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="navbar">
          <h2>Smart Home IoT</h2>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/face">Face</Link>
            
            <Link to="/iot">IoT</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/face" element={<FacePage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/iot" element={<IotPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}