import api from "./api";

export const recognizeVoice = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/voice/recognize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getCommands = async () => {
  const res = await api.get("/api/voice/commands");
  return res.data;
};

export const executeTextCommand = async (text) => {
  const res = await api.post("/api/voice/execute-text", null, {
    params: { text },
  });
  return res.data;
};