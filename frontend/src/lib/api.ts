import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getEvents = async (params: any) => {
  const response = await api.get('/events', { params });
  return response.data;
};

export const getEventById = async (id: string) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const getDetections = async (params: any) => {
  const response = await api.get('/detections', { params });
  return response.data;
};

export const getDetectionStats = async () => {
  const response = await api.get('/detections/stats');
  return response.data;
};

export const getAlerts = async (params: any) => {
  const response = await api.get('/alerts', { params });
  return response.data;
};

export const getUnreadAlertCount = async () => {
  const response = await api.get('/alerts/unread-count');
  return response.data;
};

export const acknowledgeAlert = async (id: string) => {
  const response = await api.post(`/alerts/${id}/acknowledge`);
  return response.data;
};

export default api;
