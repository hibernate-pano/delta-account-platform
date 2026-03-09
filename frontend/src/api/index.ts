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
  getMyOrders: () => api.get('/api/orders/my'),
};

// Wallet API
export const walletApi = {
  getBalance: () => api.get('/api/wallet/balance'),
  recharge: (data: { amount: number; paymentMethod?: string }) =>
    api.post('/api/wallet/recharge', data),
  withdraw: (data: { amount: number; accountType?: string; accountNo: string; accountName: string }) =>
    api.post('/api/wallet/withdraw', data),
  getTransactions: (params?: { page?: number; size?: number }) =>
    api.get('/api/wallet/transactions', { params }),
  getRecharges: (params?: { page?: number; size?: number }) =>
    api.get('/api/wallet/recharges', { params }),
  getWithdrawals: (params?: { page?: number; size?: number }) =>
    api.get('/api/wallet/withdrawals', { params }),
};

// Message API
export const messageApi = {
  getSessions: () => api.get('/api/messages/sessions'),
  getSessionMessages: (sessionId: number) => api.get(`/api/messages/sessions/${sessionId}`),
  sendMessage: (sessionId: number, data: { content: string }) =>
    api.post(`/api/messages/sessions/${sessionId}`, data),
  markAsRead: (sessionId: number) => api.put(`/api/messages/sessions/${sessionId}/read`),
  getUnreadCount: () => api.get('/api/messages/unread-count'),
  createSession: (data: { accountId: number; sellerId: number }) =>
    api.post('/api/messages/sessions', data),
};

// Refund API
export const refundApi = {
  apply: (data: { orderId: number; amount: number; reason: string; evidenceImages?: string[] }) =>
    api.post('/api/refunds', data),
  getMy: () => api.get('/api/refunds/my'),
  getById: (id: number) => api.get(`/api/refunds/${id}`),
  cancel: (id: number) => api.put(`/api/refunds/${id}/cancel`),
};

// Notification API
export const notificationApi = {
  getList: () => api.get('/api/notifications'),
  markAsRead: (id: number) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

// Review API
export const reviewApi = {
  create: (data: { orderId: number; revieweeId: number; rating: number; content: string }) =>
    api.post('/api/reviews', data),
  getByAccount: (accountId: number) => api.get(`/api/reviews/account/${accountId}`),
  getByUser: (userId: number) => api.get(`/api/reviews/user/${userId}`),
};

export default api;
