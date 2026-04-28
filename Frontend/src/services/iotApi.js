import api from "./api";

export const getIotData = async () => {
  const res = await api.get("/api/iot/data");
  return res.data;
};

export const getIotHistory = async () => {
  const res = await api.get("/api/iot/history");
  return res.data;
};

export const controlDevice = async (device, val) => {
  const res = await api.post(`/api/iot/control/${device}/${val}`);
  return res.data;
};