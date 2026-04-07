const STORAGE_KEY = 'yolo-voice-registrations';

const simulateNetworkDelay = (payload, delay = 700) => {
  return new Promise((resolve) => setTimeout(() => resolve(payload), delay));
};

const getStoredVoices = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setStoredVoices = (voices) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voices));
  } catch (error) {
    console.error('Unable to save voices to localStorage', error);
  }
};

export const registerVoice = async ({ username, audioBlob }) => {
  if (!username || !username.trim()) {
    throw new Error('Vui lòng nhập tên người dùng để lưu giọng nói.');
  }

  const normalizedUsername = username.trim();
  const voices = getStoredVoices();
  const existing = voices.find((item) => item.username.toLowerCase() === normalizedUsername.toLowerCase());

  if (existing) {
    existing.updatedAt = new Date().toISOString();
  } else {
    voices.push({ username: normalizedUsername, createdAt: new Date().toISOString() });
  }

  setStoredVoices(voices);

  return simulateNetworkDelay({
    success: true,
    message: 'Voice saved successfully',
    count: voices.length,
  });
};

export const recognizeVoice = async ({ audioBlob }) => {
  if (!audioBlob) {
    throw new Error('Không tìm thấy bản ghi âm để nhận diện.');
  }

  const voices = getStoredVoices();
  if (voices.length === 0) {
    return simulateNetworkDelay({
      count: 1,
      results: [
        {
          name: 'Unknown',
          confidence: 0.42,
        },
      ],
    });
  }

  const recognized = voices[voices.length - 1];
  const confidence = Math.min(0.97, Math.max(0.55, 0.7 + Math.random() * 0.23));

  return simulateNetworkDelay({
    count: 1,
    results: [
      {
        name: recognized.username,
        confidence,
      },
    ],
  });
};
