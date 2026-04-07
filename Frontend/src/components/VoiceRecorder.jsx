import React, { useEffect, useRef, useState } from 'react';

export default function VoiceRecorder({ onRecordingComplete, onStatusChange, isDarkMode = true }) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [statusText, setStatusText] = useState('Ready to record');
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStatus = (nextStatus) => {
    setStatusText(nextStatus);
    onStatusChange?.(nextStatus);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Trình duyệt của bạn không hỗ trợ ghi âm bằng microphone.');
      return;
    }

    setError('');
    setAudioUrl('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob);
        handleStatus('Recording finished');
      };

      recorder.start();
      setRecording(true);
      handleStatus('Recording...');
    } catch (recordError) {
      console.error('Recording error', recordError);
      setError('Không thể truy cập micro. Vui lòng kiểm tra quyền trình duyệt.');
      handleStatus('Ready to record');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  return (
    <div className={`rounded-[32px] border p-6 shadow-glow backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200/50 bg-white/80'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Recording console</p>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Use the mic controls to capture the voice sample.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startRecording}
            disabled={recording}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🎙️ Record
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!recording}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            ⏹️ Stop
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className={`rounded-3xl border p-5 text-sm ${isDarkMode ? 'border-violet-500/20 bg-violet-950/60 text-slate-300' : 'border-violet-200/50 bg-violet-50/60 text-slate-700'}`}>
          <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Status</p>
          <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{statusText}</p>
          {recording && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex h-3 w-3 animate-pulse-fast rounded-full bg-emerald-400"></span>
              <span className="text-xs uppercase tracking-[0.2em] text-emerald-300">Live waveform</span>
            </div>
          )}
        </div>

        <div className={`rounded-3xl p-4 text-sm shadow-inner ${isDarkMode ? 'bg-slate-950/80 text-slate-300' : 'bg-slate-100/80 text-slate-700'}`}>
          <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Preview</p>
          {audioUrl ? (
            <audio controls className="mt-3 w-full" src={audioUrl} />
          ) : (
            <p className={`mt-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No recording yet.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
