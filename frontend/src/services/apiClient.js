import axios from 'axios';

// Use VITE_API_BASE_URL from .env if provided, otherwise fall back to the
// Vite dev-server proxy at "/api" (see vite.config.js).
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

export default apiClient;
