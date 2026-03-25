import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { accountApi, orderApi, walletApi, messageApi, notificationApi, authApi, adminApi } from '../api';
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

export const useSellerAccounts = (sellerId: number | undefined) => {
  return useQuery({
    queryKey: ['accounts', 'seller', sellerId],
    queryFn: () => accountApi.getList({ size: 100 }),
    enabled: !!sellerId,
    select: (res) => (res.data.data.records || []).filter((a: any) => a.sellerId === sellerId),
    ...defaultQueryOptions,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      gameRank?: string;
      skinCount?: number;
      weapons?: string;
      price: number;
      rentalPrice?: number | null;
      description?: string;
      images?: string[];
    }) => accountApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
};

export const useBuyAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: number) =>
      orderApi.create({ accountId, type: 'BUY' }).then((res) => {
        const orderId = res.data.data.id;
        return orderApi.pay(orderId);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
    },
  });
};

export const useRentAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, rentHours }: { accountId: number; rentHours: number }) =>
      orderApi.create({ accountId, type: 'RENT', rentHours }).then((res) => {
        const orderId = res.data.data.id;
        return orderApi.pay(orderId);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
    },
  });
};

// ==================== Admin Hooks ====================

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    enabled: false, // only fetch when admin page is visited
    ...defaultQueryOptions,
  });
};

export const useAdminAccounts = (params?: { page?: number; size?: number; status?: string }) => {
  return useQuery({
    queryKey: ['admin', 'accounts', params],
    queryFn: () => adminApi.getAccounts(params),
    ...defaultQueryOptions,
  });
};

export const useVerifyAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      adminApi.verifyAccount(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, banned }: { id: number; banned: boolean }) =>
      adminApi.banUser(id, banned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
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

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, sellerId }: { accountId: number; sellerId: number }) =>
      messageApi.createSession({ accountId, sellerId }),
    onSuccess: () => {
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
