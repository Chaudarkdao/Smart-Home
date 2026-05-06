import api from "./api";

export const detectFaces = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/face/detect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const compareFaces = async (file1, file2) => {
  const formData = new FormData();
  formData.append("file1", file1);
  formData.append("file2", file2);

  const res = await api.post("/api/face/compare", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const registerFace = async (name, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/api/face/register/${encodeURIComponent(name)}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
