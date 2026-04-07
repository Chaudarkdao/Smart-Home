import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import VoicePage from './pages/VoicePage';
import FacePage from './pages/FacePage';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeClasses = {
    container: isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
    header: isDarkMode
      ? 'border-white/10 bg-slate-900/80'
      : 'border-slate-200/50 bg-white/80 backdrop-blur-xl',
    button: {
      active: isDarkMode ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-500 text-white',
      inactive: isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300',
      faceActive: isDarkMode ? 'bg-sky-500 text-slate-950' : 'bg-sky-500 text-white',
      theme: isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.container}`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {activePage !== 'home' && (
          <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[32px] border p-5 shadow-glow backdrop-blur-xl ${themeClasses.header}`}>
            <div>
              <p className={`text-sm uppercase tracking-[0.3em] ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Smart Home</p>
              <h1 className={`mt-2 text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recognition System</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActivePage('home')}
                className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${activePage === 'home' ? themeClasses.button.active : themeClasses.button.inactive}`}
              >
                🏠 Home
              </button>
              <button
                type="button"
                onClick={() => setActivePage('voice')}
                className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${activePage === 'voice' ? themeClasses.button.active : themeClasses.button.inactive}`}
              >
                🎤 Voice
              </button>
              <button
                type="button"
                onClick={() => setActivePage('face')}
                className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${activePage === 'face' ? themeClasses.button.faceActive : themeClasses.button.inactive}`}
              >
                👤 Face
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${themeClasses.button.theme}`}
              >
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
          </div>
        )}

        {activePage === 'home' && <HomePage isDarkMode={isDarkMode} onNavigate={setActivePage} />}
        {activePage === 'voice' && <VoicePage isDarkMode={isDarkMode} />}
        {activePage === 'face' && <FacePage isDarkMode={isDarkMode} />}
      </div>
    </div>
  );
}

export default App;
