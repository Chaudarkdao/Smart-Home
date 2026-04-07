import React from 'react';

export default function Header({ icon = '🎤', title, subtitle, isDarkMode = true }) {
  return (
    <div className={`rounded-[32px] border p-6 shadow-glow backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200/50 bg-white/80'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`inline-flex items-center gap-3 text-lg font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>
            <span className="text-2xl">{icon}</span>
            {title}
          </p>
          {subtitle && <p className={`mt-2 max-w-2xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
