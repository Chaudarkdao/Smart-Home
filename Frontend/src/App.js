import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import FacePage from './pages/FacePage';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ... (giữ các useEffect và toggleTheme của bạn)

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Navbar chỉ hiện khi không ở trang home */}
      {activePage !== 'home' && (
        <nav className="p-4 flex justify-center gap-4">
          <button onClick={() => setActivePage('home')} className="px-4 py-2 bg-emerald-500 rounded-xl">🏠 Dashboard</button>
          <button onClick={() => setActivePage('face')} className="px-4 py-2 bg-sky-500 rounded-xl text-white">👤 Camera</button>
        </nav>
      )}

      <main>
        {/* QUAN TRỌNG: Phải truyền onNavigate={setActivePage} ở đây */}
        {activePage === 'home' && (
          <HomePage 
            isDarkMode={isDarkMode} 
            onNavigate={(page) => setActivePage(page)} 
          />
        )}
        
        {activePage === 'face' && <FacePage isDarkMode={isDarkMode} />}
      </main>
    </div>
  );
}

export default App;