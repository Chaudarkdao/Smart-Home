const STORAGE_KEY = 'yolo-face-registrations';

const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

const getStoredFaces = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveStoredFaces = (faces) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(faces));
  } catch (error) {
    console.error('Unable to save face registrations', error);
  }
};

export const detectFaces = async (imageFile) => {
  await delay();
  const savedFaces = getStoredFaces();

  if (!imageFile) {
    throw new Error('No image was provided for face detection.');
  }

  const recognized = savedFaces.length > 0 ? savedFaces[savedFaces.length - 1].username : 'Unknown';
  const confidence = savedFaces.length > 0 ? Math.min(0.98, 0.6 + Math.random() * 0.35) : 0.42;

  return {
    count: 1,
    faces: [
      {
        recognized_name: recognized,
        confidence,
      },
    ],
  };
};

export const compareFaces = async (file1, file2) => {
  await delay();
  return {
    sameFace: Math.random() > 0.4,
    similarity: Math.random() * 0.4 + 0.6,
  };
};

export const registerFace = async (name, imageFile) => {
  await delay();
  const normalized = name?.trim();

  if (!normalized) {
    throw new Error('Name is required to register a face.');
  }

  const faces = getStoredFaces();
  const exists = faces.some((item) => item.username.toLowerCase() === normalized.toLowerCase());

  if (!exists) {
    faces.push({ username: normalized, createdAt: new Date().toISOString() });
    saveStoredFaces(faces);
  }

  return {
    success: true,
    message: 'Face registration saved successfully',
  };
};
