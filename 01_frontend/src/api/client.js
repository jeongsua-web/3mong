import axios from 'axios';
import { ACCESS_TOKEN, USER_ID } from '../constants/storage';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_SKIP_AUTH === 'true'
    ? 'dev-token'
    : localStorage.getItem(ACCESS_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(USER_ID);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
