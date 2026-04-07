import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import VoiceRecorder from '../components/VoiceRecorder';
import VoiceResult from '../components/VoiceResult';
import { recognizeVoice, registerVoice } from '../services/voiceApi';

function VoicePage({ isDarkMode = true }) {
  const [username, setUsername] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('Ready to record');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [lastSavedName, setLastSavedName] = useState('');

  const handleRecordingComplete = async (blob) => {
    setAudioBlob(blob);
    setResults([]);
    setCount(0);
    setError('');
    setFeedback('Recording finished. Sending audio to recognition...');
    setLoading(true);

    try {
      const response = await recognizeVoice({ audioBlob: blob });
      setCount(response.count ?? response.results.length);
      setResults(response.results ?? []);
      setFeedback('Recognition complete. Check the result cards below.');
    } catch (apiError) {
      setError(apiError?.message || 'Lỗi khi nhận diện giọng nói.');
      setFeedback('');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoice = async () => {
    setError('');
    if (!username.trim()) {
      setError('Vui lòng nhập tên người dùng.');
      return;
    }

    if (!audioBlob) {
      setError('Bạn cần ghi âm giọng nói trước khi lưu.');
      return;
    }

    setSaving(true);
    setFeedback('Saving voice sample...');

    try {
      const response = await registerVoice({ username, audioBlob });
      setLastSavedName(username.trim());
      setFeedback(`${response.message} for ${username.trim()}.`);
      setError('');
    } catch (apiError) {
      setError(apiError?.message || 'Lỗi khi lưu giọng nói.');
      setFeedback('');
    } finally {
      setSaving(false);
    }
  };

  const resultCountText = useMemo(() => {
    if (loading) return 'Processing recognition...';
    if (count === 0) return 'No recognition results yet.';
    return `Số lượng giọng nói: ${count}`;
  }, [count, loading]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Header
          title="Voice Registration"
          subtitle="Register voice samples and view recognition results in a polished interface."
          isDarkMode={isDarkMode}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.9fr]">
          <section className={`rounded-[40px] border p-6 shadow-glow backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200/50 bg-white/80'}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Enroll voice</p>
                <h1 className={`mt-3 text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>🎤 Voice Registration</h1>
                <p className={`mt-3 max-w-2xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Enter a username, record your voice, then save the sample to the mock API.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-[1.2fr_auto] sm:items-end">
              <label className="space-y-3">
                <span className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={`w-full rounded-3xl border px-4 py-4 text-base outline-none ring-1 ring-transparent transition focus:border-emerald-400 focus:ring-emerald-400/20 ${isDarkMode ? 'border-white/10 bg-slate-950/90 text-slate-100' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500'}`}
                  placeholder="Enter username"
                />
              </label>

              <button
                type="button"
                onClick={handleSaveVoice}
                disabled={saving || !audioBlob}
                className="rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                💾 {saving ? 'Saving...' : 'Save Voice'}
              </button>
            </div>

            <div className="mt-8 space-y-5">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                onStatusChange={setRecordingStatus}
                isDarkMode={isDarkMode}
              />
            </div>

            <div className={`mt-6 rounded-3xl border p-5 text-sm ${isDarkMode ? 'border-white/10 bg-slate-950/70 text-slate-300' : 'border-slate-200/50 bg-slate-100/60 text-slate-700'}`}>
              <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Recording status</p>
              <p className="mt-2">{recordingStatus}</p>
            </div>
          </section>

          <section className={`rounded-[40px] border p-6 shadow-glow backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200/50 bg-white/80'}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Recognition</p>
                <h2 className={`mt-3 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recognition Results</h2>
              </div>
              <div className={`rounded-3xl px-4 py-2 text-sm ${isDarkMode ? 'bg-slate-950/80 text-slate-300' : 'bg-slate-200/60 text-slate-700'}`}>
                {resultCountText}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {error && (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                  {error}
                </div>
              )}

              {feedback && !error && (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  {feedback}
                </div>
              )}

              {results.map((item, index) => (
                <VoiceResult key={index} index={index + 1} result={item} isDarkMode={isDarkMode} />
              ))}

              {!loading && results.length === 0 && (
                <div className={`rounded-3xl border border-dashed p-6 text-sm ${isDarkMode ? 'border-white/10 bg-slate-950/60 text-slate-500' : 'border-slate-300/50 bg-slate-100/60 text-slate-500'}`}>
                  Record a voice sample to generate recognition results here.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className={`mt-10 rounded-[40px] border p-6 text-sm shadow-glow ${isDarkMode ? 'border-white/10 bg-slate-900/80 text-slate-400' : 'border-slate-200/50 bg-white/80 text-slate-600'}`}>
          <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Mock API behavior</p>
          <p className="mt-3 leading-7">
            Saved voice registrations are stored locally in browser storage. Each recorded blob is sent to a simulated recognition endpoint and returns a mock response.
          </p>
          {lastSavedName && (
            <p className={`mt-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Last saved voice: <span className="text-emerald-300">{lastSavedName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoicePage;
