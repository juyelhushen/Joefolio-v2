import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiClient = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? '/backend'
      : (configuredBaseUrl || 'https://joefolio-backend.onrender.com').replace(/\/+$/, ''),
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});
