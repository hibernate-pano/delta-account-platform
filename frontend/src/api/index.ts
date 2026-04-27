import axios from 'axios';
import { useAuthStore } from '../store/auth';
import type { FunnelEvent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15秒请求超时
});

// Token 从 Zustand store 读取（单一数据源）
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 软跳转：清除 store 状态，用 React Router 跳转而非硬刷新
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 网络错误处理
    if (!error.response) {
      console.error('网络错误:', error.message);
    }

    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      // 软跳转而非 window.location.href 硬刷新
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.history.replaceState(null, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
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
  updateProfile: (data: { nickname?: string; email?: string; phone?: string; avatar?: string }) =>
    api.put('/api/auth/profile', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/api/auth/password', data),
  getMembership: () => api.get('/api/auth/membership'),
};

// Account API
export const accountApi = {
  getList: (params?: { page?: number; size?: number; keyword?: string; sort?: string; minPrice?: number; maxPrice?: number; gameRank?: string }) =>
    api.get('/api/accounts', { params }),
  getById: (id: number) => api.get(`/api/accounts/${id}`),
  getMy: (params?: { page?: number; size?: number }) =>
    api.get('/api/accounts/my', { params }),
  create: (data: {
    title: string;
    gameRank?: string;
    skinCount?: number;
    weapons?: string;
    price: number;
    rentalPrice?: number | null;
    description?: string;
    images?: string[];
  }) => api.post('/api/accounts', data),
  update: (id: number, data: {
    title?: string;
    gameRank?: string;
    skinCount?: number;
    weapons?: string;
    price?: number;
    rentalPrice?: number | null;
    description?: string;
    images?: string[];
  }) => api.put(`/api/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/api/accounts/${id}`),
  toggleStatus: (id: number, status: string) =>
    api.put(`/api/accounts/${id}/toggle`, null, { params: { status } }),
};

// Dispute API
export const disputeApi = {
  create: (data: { orderId: number; reason: string; description: string; evidenceImages?: string[] }) =>
    api.post('/api/disputes', data),
  getMy: (params?: { page?: number; size?: number }) =>
    api.get('/api/disputes/my', { params }),
  getById: (id: number) => api.get(`/api/disputes/${id}`),
  getByOrderId: (orderId: number) => api.get(`/api/disputes/order/${orderId}`),
  cancel: (id: number) => api.put(`/api/disputes/${id}/cancel`),
  // Admin
  getAll: (params?: { page?: number; size?: number; status?: string }) =>
    api.get('/api/disputes/admin/all', { params }),
  resolve: (id: number, data: { resolution: string; adminRemark?: string }) =>
    api.put(`/api/disputes/${id}/resolve`, null, { params: data }),
  getPendingCount: () => api.get('/api/disputes/admin/pending-count'),
};

// Order API
export const orderApi = {
  create: (data: { accountId: number; type: string; rentHours?: number }) =>
    api.post('/api/orders', data),
  getMy: (params?: { page?: number; size?: number }) =>
    api.get('/api/orders/my', { params }),
  getById: (id: number) => api.get(`/api/orders/${id}`),
  pay: (id: number) => api.put(`/api/orders/${id}/pay`),
  confirm: (id: number) => api.put(`/api/orders/${id}/confirm`),
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
  getUserReviews: (userId: number) => api.get(`/api/reviews/user/${userId}`),
  getUserStats: (userId: number) => api.get(`/api/reviews/user/${userId}/stats`),
  reply: (id: number, reply: string) =>
    api.post(`/api/reviews/${id}/reply`, null, { params: { reply } }),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (params?: { page?: number; size?: number }) =>
    api.get('/api/admin/users', { params }),
  banUser: (id: number) => api.put(`/api/admin/users/${id}/ban`),
  unbanUser: (id: number) => api.put(`/api/admin/users/${id}/unban`),
  getPendingAccounts: (params?: { page?: number; size?: number }) =>
    api.get('/api/admin/accounts/pending', { params }),
  verifyAccount: (id: number, action: string) =>
    api.put(`/api/admin/accounts/${id}/verify`, null, { params: { action } }),
  getOrders: (params?: { page?: number; size?: number; status?: string }) =>
    api.get('/api/admin/orders', { params }),
};

// Favorite API
export const favoriteApi = {
  toggle: (accountId: number) => api.post(`/api/favorites/${accountId}`),
  getMyIds: () => api.get('/api/favorites/ids'),
  getMyList: () => api.get('/api/favorites'),
};

// Payment API
export const paymentApi = {
  create: (data: { orderId: number; paymentMethod: string }) =>
    api.post('/api/payments', data),
  pay: (id: number) => api.post(`/api/payments/${id}/pay`),
  getByOrderId: (orderId: number) => api.get(`/api/payments/order/${orderId}`),
  getMy: () => api.get('/api/payments/my'),
  refund: (id: number, reason?: string) =>
    api.post(`/api/payments/${id}/refund`, null, { params: { reason } }),
};

// Market API
export const marketApi = {
  getConfig: () => api.get('/api/market/config'),
};

// File Upload API
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/api/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (url: string) => api.delete('/api/upload/image', { params: { url } }),
};

// Analytics API
export const analyticsApi = {
  trackEvent: (data: FunnelEvent) => api.post('/api/analytics/events', data),
};

export default api;
