import React from 'react';
import Header from '../components/Header';

export default function HomePage({ isDarkMode = true, onNavigate }) {
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Header
          icon="🏠"
          title="Smart Home Dashboard"
          subtitle="Welcome to the Smart Home Voice & Face Recognition System"
          isDarkMode={isDarkMode}
        />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Voice Recognition Card */}
          <div className={`rounded-[40px] border p-8 shadow-glow backdrop-blur-xl transition hover:-translate-y-2 ${isDarkMode ? 'border-white/10 bg-slate-900/80 hover:border-emerald-400/30' : 'border-slate-200/50 bg-white/80 hover:border-emerald-400/50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className={`text-sm uppercase tracking-[0.24em] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>Voice System</p>
                <h3 className={`mt-3 text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>🎤 Voice Recognition</h3>
                <p className={`mt-4 text-base leading-7 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Register voice samples and use advanced voice recognition to identify speakers. Save voice profiles and get real-time recognition results with confidence scores.
                </p>
                <div className="mt-6 space-y-2">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>✓ Record and save voice samples</p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>✓ Real-time voice recognition</p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>✓ Confidence-based results</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('voice')}
                  className="mt-6 rounded-3xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Get Started →
                </button>
              </div>
            </div>
          </div>

          {/* Face Recognition Card */}
          <div className={`rounded-[40px] border p-8 shadow-glow backdrop-blur-xl transition hover:-translate-y-2 ${isDarkMode ? 'border-white/10 bg-slate-900/80 hover:border-sky-400/30' : 'border-slate-200/50 bg-white/80 hover:border-sky-400/50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className={`text-sm uppercase tracking-[0.24em] ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Face System</p>
                <h3 className={`mt-3 text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>👤 Face Recognition</h3>
                <p className={`mt-4 text-base leading-7 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Capture face images and register them with names. Use computer vision to detect and recognize faces with high accuracy and detailed confidence metrics.
                </p>
                <div className="mt-6 space-y-2">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>✓ Capture face images</p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>✓ Register with names</p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>✓ Real-time detection</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('face')}
                  className="mt-6 rounded-3xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600"
                >
                  Get Started →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className={`mt-12 rounded-[40px] border p-8 shadow-glow ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200/50 bg-white/80'}`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>System Features</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>2</p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Recognition Systems</p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>Real-time</p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Live Detection</p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>Mock API</p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Local Storage</p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>100%</p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Responsive</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className={`mt-12 rounded-[40px] border p-8 ${isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200/50 bg-slate-50/60'}`}>
          <p className={`text-sm leading-7 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>Welcome to Smart Home Recognition System.</strong> This application demonstrates modern voice and face recognition capabilities through a responsive web interface. All voice and face registrations are stored locally in your browser using localStorage, ensuring your data remains private. The system provides mock recognition results based on registered samples. Choose either Voice or Face Recognition from the cards above to get started today.
          </p>
        </div>
      </div>
    </div>
  );
}
