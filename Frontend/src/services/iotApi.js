
const API_URL = "http://localhost:8000";

const request = async (url, options = {}) => {
  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json();
};

export const getIotData = async () => {
  return request(`${API_URL}/api/iot/data`);
};

export const getIotHistory = async () => {
  return request(`${API_URL}/api/iot/history`);
};

export const controlDevice = async (device, val) => {
  return request(`${API_URL}/api/iot/control/${device}/${val}`, {
    method: "POST",
  });
};

export const triggerAiAuth = async (authVal) => {
  return request(`${API_URL}/api/iot/ai_trigger_auth/${authVal}`, {
    method: "POST",
  });
};
