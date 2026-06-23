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
      const isPublic = config.url === '/auth/login' || config.url === '/auth/register' || config.url === '/jobs/public-stats' || config.url === '/health';
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (!isPublic) {
        // Block unauthenticated calls to protected endpoints to avoid 401 redirect loops
        return Promise.reject(new Error('No authorization token available'));
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 with refresh ────────────
// Single refresh-in-flight flag + queue to prevent parallel refresh storms
let _isRefreshing = false;
let _pendingQueue = []; // { resolve, reject }[]

function processPendingQueue(error, token = null) {
  _pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request to retry once refresh completes
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest._retry = true;
          return api(originalRequest).then((r) => r);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        // Attempt to refresh the Supabase session before giving up
        const { supabase } = await import('./supabase');
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data?.session) throw refreshError || new Error('Refresh failed');

        const newToken = data.session.access_token;
        localStorage.setItem('applyai_token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processPendingQueue(null, newToken);
        _isRefreshing = false;

        // Transparently retry the original request with the fresh token
        return api(originalRequest).then((r) => r);
      } catch (refreshErr) {
        processPendingQueue(refreshErr);
        _isRefreshing = false;

        // Refresh also failed — clear session and send user back to splash/login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('applyai_token');
          localStorage.removeItem('applyai_user');
          window.location.href = '/';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

// ── Proactive token refresh every 45 minutes ─────────────────
// Runs silently in the background so users rarely hit the 401 path.
if (typeof window !== 'undefined') {
  const REFRESH_INTERVAL_MS = 45 * 60 * 1000;
  setInterval(async () => {
    try {
      const token = localStorage.getItem('applyai_token');
      if (!token) return; // Not logged in — skip

      const { supabase } = await import('./supabase');
      if (!supabase) return;

      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session?.access_token) {
        const newToken = data.session.access_token;
        localStorage.setItem('applyai_token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        console.debug('[auth] Proactive token refresh successful');
      }
    } catch (err) {
      console.warn('[auth] Proactive token refresh failed:', err?.message);
    }
  }, REFRESH_INTERVAL_MS);
}

// ── API Functions ────────────────────────────────────────────

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
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
  getPublicStats: () => api.get('/jobs/public-stats'),
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

export const notificationsApi = {
  getVapidKey: () => api.get('/notifications/vapid-key'),
  subscribe: (subscription) => api.post('/notifications/subscribe', subscription),
};

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.post('/profile', data),
};

export default api;
