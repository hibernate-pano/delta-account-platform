import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { accountApi, orderApi, walletApi, messageApi, notificationApi, authApi } from '../api';
import { useAuthStore } from '../store/auth';

// Query keys factory
export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    list: (params?: Record<string, unknown>) => ['accounts', 'list', params] as const,
    detail: (id: number) => ['accounts', 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    my: ['orders', 'my'] as const,
    detail: (id: number) => ['orders', 'detail', id] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    balance: ['wallet', 'balance'] as const,
    transactions: ['wallet', 'transactions'] as const,
  },
  messages: {
    all: ['messages'] as const,
    sessions: ['messages', 'sessions'] as const,
    messages: (sessionId: number) => ['messages', 'session', sessionId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  auth: {
    profile: ['auth', 'profile'] as const,
  },
};

// Default query options
export const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false,
};

// ==================== Account Hooks ====================

export const useAccounts = (params?: { page?: number; size?: number; keyword?: string; sort?: string }) => {
  return useQuery({
    queryKey: queryKeys.accounts.list(params),
    queryFn: () => accountApi.getList(params),
    ...defaultQueryOptions,
  });
};

export const useAccount = (id: number) => {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => accountApi.getById(id),
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

// ==================== Order Hooks ====================

export const useMyOrders = () => {
  return useQuery({
    queryKey: queryKeys.orders.my,
    queryFn: () => orderApi.getMyOrders(),
    ...defaultQueryOptions,
  });
};

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderApi.getById(id),
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { accountId: number; type: string; rentHours?: number }) =>
      orderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
    },
  });
};

export const usePayOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => orderApi.pay(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};

// ==================== Wallet Hooks ====================

export const useWalletBalance = () => {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: () => walletApi.getBalance(),
    staleTime: 1000 * 30, // 30 seconds for balance
  });
};

export const useWalletTransactions = (params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.wallet.transactions, params],
    queryFn: () => walletApi.getTransactions(params),
    ...defaultQueryOptions,
  });
};

export const useRecharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; paymentMethod?: string }) =>
      walletApi.recharge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; accountType?: string; accountNo: string; accountName: string }) =>
      walletApi.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
};

// ==================== Message Hooks ====================

export const useMessageSessions = () => {
  return useQuery({
    queryKey: queryKeys.messages.sessions,
    queryFn: () => messageApi.getSessions(),
    ...defaultQueryOptions,
    refetchInterval: 5000, // Poll every 5s for new messages
  });
};

export const useSessionMessages = (sessionId: number) => {
  return useQuery({
    queryKey: queryKeys.messages.messages(sessionId),
    queryFn: () => messageApi.getSessionMessages(sessionId),
    enabled: !!sessionId,
    ...defaultQueryOptions,
    refetchInterval: 5000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: number; content: string }) =>
      messageApi.sendMessage(sessionId, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.messages(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.sessions });
    },
  });
};

// ==================== Notification Hooks ====================

export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => notificationApi.getList(),
    ...defaultQueryOptions,
    refetchInterval: 30000, // Poll every 30s
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
};

// ==================== Auth Hooks ====================

export const useAuthProfile = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getProfile(),
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutes for profile
  });
};

// ==================== Query Client Factory ====================

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
  },
});
