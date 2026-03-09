import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data),
  register: (data: { username: string; password: string; nickname?: string; email?: string; phone?: string }) =>
    api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
};

// Account API
export const accountApi = {
  getList: (params?: { page?: number; size?: number; keyword?: string; sort?: string }) =>
    api.get('/api/accounts', { params }),
  getById: (id: number) => api.get(`/api/accounts/${id}`),
  create: (data: any) => api.post('/api/accounts', data),
  update: (id: number, data: any) => api.put(`/api/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/api/accounts/${id}`),
};

// Order API
export const orderApi = {
  create: (data: { accountId: number; type: string; rentHours?: number }) =>
    api.post('/api/orders', data),
  getById: (id: number) => api.get(`/api/orders/${id}`),
  pay: (id: number) => api.put(`/api/orders/${id}/pay`),
  complete: (id: number) => api.put(`/api/orders/${id}/complete`),
  cancel: (id: number) => api.put(`/api/orders/${id}/cancel`),
};

export default api;
