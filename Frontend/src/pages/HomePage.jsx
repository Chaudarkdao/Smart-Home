import React from 'react';

export default function HomePage({ isDarkMode = true, onNavigate }) {
  
  const handleStartCamera = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('face');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-12 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Glow Effect */}
      <div className="relative isolate pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#10b981] to-[#0ea5e9] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Dashboard */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-500 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Hệ thống đang trực tuyến
          </div>
          <h1 className={`text-5xl font-extrabold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            YOLO Home <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Security</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto opacity-70">
            Trung tâm kiểm soát an ninh sinh trắc học. Giám sát hệ thống và quản lý quyền truy cập không gian sống theo thời gian thực.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Face Recognition Access Card */}
          <div className={`lg:col-span-2 rounded-[32px] border p-8 flex flex-col justify-between shadow-2xl backdrop-blur-xl transition-all hover:border-emerald-500/30 ${isDarkMode ? 'border-white/10 bg-slate-900/60 shadow-indigo-500/5' : 'border-slate-200 bg-white'}`}>
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Biometric Access</h2>
                  <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">Live Tracking</p>
                </div>
              </div>
              
              <p className="text-lg opacity-60 leading-relaxed mb-8">
                Hệ thống camera giám sát liên tục (1 khung hình/giây) kết hợp AI Computer Vision. Tự động định danh thành viên để quản lý quyền truy cập.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {['Quét liên tục 1s/lần', 'Phát hiện xâm nhập', 'Độ trễ < 200ms', 'Lưu trữ Edge'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium opacity-80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleStartCamera}
              className="group flex items-center justify-center gap-3 w-full sm:w-fit px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              Mở Camera Giám Sát
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* System Status Card */}
          <div className={`rounded-[32px] border p-8 flex flex-col shadow-2xl backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Thông số thiết bị
            </h3>
            
            <div className="space-y-8 flex-1">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                  <span>Tải CPU (Edge AI)</span>
                  <span>42%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800/30 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-[42%] rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                  <span>RAM Usage</span>
                  <span>1.2 GB</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800/30 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[60%] rounded-full shadow-[0_0_10px_#6366f1]"></div>
                </div>
              </div>

              <div className={`mt-auto p-5 rounded-2xl border border-dashed ${isDarkMode ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-[10px] font-black uppercase tracking-tighter mb-2 opacity-40">Camera IP</p>
                <p className="font-mono text-sm font-bold tracking-widest">192.168.1.104</p>
                <p className="text-[11px] text-emerald-500 mt-2 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="mt-12 flex justify-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           {['Edge Vision', 'React v18', 'Tailwind CSS', 'AES-256'].map((t, i) => (
             <span key={i} className="text-[10px] font-black uppercase tracking-[0.4em]">{t}</span>
           ))}
        </div>

      </div>
    </div>
  );
}