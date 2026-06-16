// lib/api.js — Axios instance with auth token injection
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject auth token ───────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('applyai_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('applyai_token');
        localStorage.removeItem('applyai_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

// ── API Functions ────────────────────────────────────────────

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const resumeApi = {
  upload: (file, label) => {
    const formData = new FormData();
    formData.append('resume', file);
    if (label) formData.append('label', label);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: () => api.get('/resume'),
  getAll: () => api.get('/resume/all'),
  delete: (id) => api.delete(`/resume/${id}`),
  reparse: (id) => api.post(`/resume/${id}/reparse`),
  setActive: (id) => api.post(`/resume/${id}/active`),
  update: (id, data) => api.patch(`/resume/${id}`, data),
};

export const preferencesApi = {
  get: () => api.get('/preferences'),
  update: (data) => api.put('/preferences', data),
  toggleAuto: () => api.patch('/preferences/toggle-auto'),
};

export const jobsApi = {
  getRecommended: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  save: (id) => api.post(`/jobs/${id}/save`),
  apply: (id) => api.post(`/jobs/${id}/apply`),
  refresh: () => api.post('/jobs/refresh'),
  abTest: (id) => api.post(`/jobs/${id}/ab-test`),
};

export const applicationsApi = {
  list: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  addNote: (id, note) => api.post(`/applications/${id}/note`, { note }),
  withdraw: (id) => api.delete(`/applications/${id}`),
};

export const schedulesApi = {
  list: () => api.get('/schedules'),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  toggle: (id) => api.patch(`/schedules/${id}/toggle`),
  delete: (id) => api.delete(`/schedules/${id}`),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  activity: (limit) => api.get('/dashboard/activity', { params: { limit } }),
  insights: () => api.get('/dashboard/insights'),
};

export default api;
