import React from 'react';
import Header from '../components/Header';
import FaceCapture from '../components/FaceRecogniotion/FaceCapture';

export default function FacePage({ isDarkMode = true }) {
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Header
          icon="👤"
          title="Face Recognition"
          subtitle="Capture face images and register face names for mock recognition."
          isDarkMode={isDarkMode}
        />

        <div className={`mt-8 rounded-[40px] border p-6 shadow-glow backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200/50 bg-white/80'}`}>
          <FaceCapture isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}
