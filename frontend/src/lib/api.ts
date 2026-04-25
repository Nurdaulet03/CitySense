import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send session cookie with every request
});

// ---- Auth API ----
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ---- Weather API ----
export const weatherAPI = {
  getCurrent: (lat?: number, lng?: number) =>
    api.get('/weather/current', { params: { lat, lng } }),
  getForecast: (lat?: number, lng?: number) =>
    api.get('/weather/forecast', { params: { lat, lng } }),
  getHistory: (days?: number) =>
    api.get('/weather/history', { params: { days } }),
  getGrid: (bounds?: { latMin: number; latMax: number; lngMin: number; lngMax: number }) =>
    api.get('/weather/grid', { params: bounds }),
};

// ---- Air Quality API ----
export const airQualityAPI = {
  getCurrent: (lat?: number, lng?: number) =>
    api.get('/air-quality/current', { params: { lat, lng } }),
  getForecast: (lat?: number, lng?: number) =>
    api.get('/air-quality/forecast', { params: { lat, lng } }),
  getHistory: (days?: number) =>
    api.get('/air-quality/history', { params: { days } }),
  getGrid: (bounds?: { latMin: number; latMax: number; lngMin: number; lngMax: number }) =>
    api.get('/air-quality/grid', { params: bounds }),
};

// ---- Traffic API ----
export const trafficAPI = {
  getCurrent: () => api.get('/traffic/current'),
  getForLocation: (lat?: number, lng?: number, radius?: number) =>
    api.get('/traffic/location', { params: { lat, lng, radius } }),
  getHistory: (days?: number) =>
    api.get('/traffic/history', { params: { days } }),
};

// ---- Events API ----
export const eventsAPI = {
  getAll: (category?: string) =>
    api.get('/events', { params: { category } }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: Record<string, unknown>) => api.post('/events', data),
  join: (id: string) => api.post(`/events/${id}/join`),
  leave: (id: string) => api.post(`/events/${id}/leave`),
};

// ---- Community Notes API ----
export const communityNotesAPI = {
  getAll: () => api.get('/community-notes'),
  create: (data: { text: string; category: string; location: { lat: number; lng: number } }) =>
    api.post('/community-notes', data),
  like: (id: string) => api.post(`/community-notes/${id}/like`),
  delete: (id: string) => api.delete(`/community-notes/${id}`),
};

// ---- AI API ----
export const aiAPI = {
  getRecommendation: (lat?: number, lng?: number) =>
    api.get('/ai/recommendation', { params: { lat, lng } }),
  chat: (message: string) => api.post('/ai/chat', { message }),
  getGoOutScore: (lat?: number, lng?: number) =>
    api.get('/ai/go-out-score', { params: { lat, lng } }),
};

// ---- Historical API ----
export const historicalAPI = {
  getAirQuality: (days?: number) =>
    api.get('/historical/air-quality', { params: { days } }),
  getWeather: (days?: number) =>
    api.get('/historical/weather', { params: { days } }),
  getTraffic: (days?: number) =>
    api.get('/historical/traffic', { params: { days } }),
  getSummary: (days?: number) =>
    api.get('/historical/summary', { params: { days } }),
};

// ---- User API ----
export const userAPI = {
  updateProfile: (data: Record<string, unknown>) => api.put('/user/profile', data),
  updatePreferences: (data: Record<string, unknown>) => api.put('/user/preferences', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/user/password', data),
};

// ---- Notification API ----
export const notificationAPI = {
  getAll: (page?: number, unreadOnly?: boolean) =>
    api.get('/notifications', { params: { page, unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
