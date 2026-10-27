import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let accessToken = null;
let refreshRequest = null;
export function setAccessToken(token) {
  accessToken = token;
}

api.interceptors.request.use((request) => {
  if (accessToken) request.headers.Authorization = `Bearer ${accessToken}`;
  return request;
});

api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || original?._retried || original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/login')) {
    return Promise.reject(error);
  }
  original._retried = true;
  try {
    refreshRequest ||= api.post('/auth/refresh').finally(() => { refreshRequest = null; });
    const response = await refreshRequest;
    setAccessToken(response.data.accessToken);
    original.headers.Authorization = `Bearer ${response.data.accessToken}`;
    return api(original);
  } catch (refreshError) {
    setAccessToken(null);
    return Promise.reject(refreshError);
  }
});

export function errorMessage(error) {
  return error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong.';
}

export default api;
