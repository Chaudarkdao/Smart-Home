import axios from "axios";

const baseURL =
  (typeof process !== "undefined" && process.env.REACT_APP_API_URL) ||
  "http://localhost:8000";

const api = axios.create({
  baseURL,
  timeout: 10000,
});

export default api;