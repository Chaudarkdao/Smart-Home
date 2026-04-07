import React from 'react';

export default function VoiceResult({ index, result, isDarkMode = true }) {
  const confidencePercent = (result.confidence || 0) * 100;
  return (
    <div className={`rounded-[28px] border p-6 shadow-glow transition hover:-translate-y-1 ${isDarkMode ? 'border-white/10 bg-slate-900/90 hover:border-emerald-400/30' : 'border-slate-200/50 bg-white/90 hover:border-emerald-400/50'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>🎤 Voice {index}</p>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isDarkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-500/20 text-emerald-700'}`}>
          Confidence
        </span>
      </div>
      <div className={`mt-4 space-y-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        <p>
          <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Confidence:</span>{' '}
          <span className="text-emerald-300">{confidencePercent.toFixed(2)}%</span>
        </p>
        <p>
          <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Recognized:</span>{' '}
          <span className="text-sky-300">{result.name}</span>
        </p>
      </div>
    </div>
  );
}
