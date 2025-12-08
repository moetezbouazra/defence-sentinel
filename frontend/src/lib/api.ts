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

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string, name?: string) => {
  const response = await api.post('/auth/register', { email, password, name });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.put('/auth/me', data);
  return response.data;
};

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

export const getDevices = async () => {
  const response = await api.get('/devices');
  return response.data;
};

export const createDevice = async (data: any) => {
  const response = await api.post('/devices', data);
  return response.data;
};

export const updateDevice = async (id: string, data: any) => {
  const response = await api.put(`/devices/${id}`, data);
  return response.data;
};

export const deleteDevice = async (id: string) => {
  const response = await api.delete(`/devices/${id}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

export const getTimeline = async () => {
  const response = await api.get('/analytics/timeline');
  return response.data;
};

export const getThreatDistribution = async () => {
  const response = await api.get('/analytics/threats');
  return response.data;
};

export const getDevicePerformance = async () => {
  const response = await api.get('/analytics/devices');
  return response.data;
};

// IoT Simulator API (separate from backend)
const IOT_SIMULATOR_URL = import.meta.env.VITE_IOT_SIMULATOR_URL || 'http://localhost:4000';

export const triggerCameraCapture = async (deviceId: string) => {
  const response = await axios.post(`${IOT_SIMULATOR_URL}/trigger`, { deviceId });
  return response.data;
};

export const getAvailableCameras = async () => {
  const response = await api.get('/devices');
  // Return devices in format expected by Dashboard
  return {
    cameras: response.data.map((device: any) => device.deviceId)
  };
};

export default api;
