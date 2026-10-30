import axios from 'axios';

const DEFAULT_API_BASE_URL = 'https://joefolio-backend.onrender.com';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiClient = axios.create({
  baseURL: (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, ''),
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});
