import axios from 'axios';

// In production the frontend is served by the same Express server,
// so we use relative URLs (empty string).  In dev, Vite proxies or
// we hit localhost:8080 directly.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
