import api from './api';

export const detectFaces = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await api.post('/api/face/detect', formData);
  return response.data;
};

export const compareFaces = async (file1, file2) => {
  const formData = new FormData();
  formData.append('file1', file1);
  formData.append('file2', file2);
  
  const response = await api.post('/api/face/compare', formData);
  return response.data;
};

export const registerFace = async (name, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await api.post(`/api/face/register/${name}`, formData);
  return response.data;
};