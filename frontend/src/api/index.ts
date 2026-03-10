import axios from 'axios';
import { useAuthStore } from '../store/auth';

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

// Order API
export const orderApi = {
  create: (data: { accountId: number; type: string; rentHours?: number }) =>
    api.post('/api/orders', data),
  getMy: (params?: { page?: number; size?: number }) =>
    api.get('/api/orders/my', { params }),
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

// Notification API
export const notificationApi = {
  getList: () => api.get('/api/notifications'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id: number) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
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

// Review API
export const reviewApi = {
  getUserReviews: (userId: number) => api.get(`/api/reviews/user/${userId}`),
  getUserStats: (userId: number) => api.get(`/api/reviews/user/${userId}/stats`),
  create: (data: { orderId: number; rating: number; content?: string }) =>
    api.post('/api/reviews', null, { params: data }),
  reply: (id: number, reply: string) =>
    api.post(`/api/reviews/${id}/reply`, null, { params: { reply } }),
};

export default api;
