// src/pages/FacePage.jsx
import React from 'react';
import Header from '../components/Header';
import FaceCapture from '../components/FaceRecogniotion/FaceCapture';

export default function FacePage({ isDarkMode = true }) {
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header
          icon="👁️"
          title="Face Tracking System"
          subtitle="Hệ thống theo dõi và nhận diện khuôn mặt thời gian thực."
          isDarkMode={isDarkMode}
        />

        <div className={`mt-8 rounded-[32px] border p-6 shadow-glow backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/40' : 'border-slate-200/50 bg-white/60'}`}>
          <FaceCapture isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}