import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

const api = axios.create({ baseURL: API_BASE_URL });

export default api;
