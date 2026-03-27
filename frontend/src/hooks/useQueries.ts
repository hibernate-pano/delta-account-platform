import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { accountApi, orderApi, walletApi, messageApi, notificationApi, authApi, adminApi, refundApi, reviewApi, favoriteApi } from '../api';
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
  refunds: {
    all: ['refunds'] as const,
    my: ['refunds', 'my'] as const,
    detail: (id: number) => ['refunds', 'detail', id] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    list: ['favorites', 'list'] as const,
    ids: ['favorites', 'ids'] as const,
  },
};

// Default query options
export const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
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
      gameType?: string;
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

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof accountApi.update>[1] }) =>
      accountApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => accountApi.delete(id),
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

export const useAdminOrders = (params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminApi.getOrders(params),
    ...defaultQueryOptions,
  });
};

export const useAdminUsers = (params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
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

export const useCompleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => orderApi.complete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => orderApi.cancel(orderId),
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
    ...defaultQueryOptions,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
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
  return useQuery<{ notificationCount: number; messageCount: number }>({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const [notifRes, msgRes] = await Promise.all([
        notificationApi.getUnreadCount(),
        messageApi.getUnreadCount(),
      ]);
      const notifData = notifRes.data?.data;
      const msgData = msgRes.data?.data;
      return {
        notificationCount: typeof notifData === 'number' ? notifData : (notifData?.notificationCount ?? 0),
        messageCount: typeof msgData === 'number' ? msgData : (msgData?.messageCount ?? 0),
      };
    },
    staleTime: 1000 * 10,
    refetchInterval: 30000,
    ...defaultQueryOptions,
  });
};

export const useReviewOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { orderId: number; revieweeId: number; rating: number; content: string }) =>
      reviewApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
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

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationApi.delete(id),
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
    ...defaultQueryOptions,
    staleTime: 1000 * 60 * 10, // 10 minutes for profile
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: { nickname?: string; email?: string; phone?: string; avatar?: string }) =>
      authApi.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
      if (res.data?.data) {
        updateUser(res.data.data);
      }
    },
  });
};

// ==================== Refund Hooks ====================

export const useMyRefunds = () => {
  return useQuery({
    queryKey: queryKeys.refunds.my,
    queryFn: () => refundApi.getMy(),
    ...defaultQueryOptions,
  });
};

// ==================== Favorites Hooks ====================

export const useFavorites = () => {
  return useQuery({
    queryKey: queryKeys.favorites.list,
    queryFn: () => favoriteApi.getMyList(),
    ...defaultQueryOptions,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: number) => favoriteApi.toggle(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list });
    },
  });
};

export const useRefundDetail = (id: number) => {
  return useQuery({
    queryKey: queryKeys.refunds.detail(id),
    queryFn: () => refundApi.getById(id),
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useApplyRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { orderId: number; amount: number; reason: string; evidenceImages?: string[] }) =>
      refundApi.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all });
    },
  });
};

export const useCancelRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => refundApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all });
    },
  });
};

// ==================== Review Hooks ====================

export const useSellerReviewStats = (sellerId: number | undefined) => {
  return useQuery({
    queryKey: ['reviews', 'user', sellerId, 'stats'],
    queryFn: () => reviewApi.getUserStats(sellerId!),
    enabled: !!sellerId,
    ...defaultQueryOptions,
  });
};

export const useSellerReviews = (sellerId: number | undefined) => {
  return useQuery({
    queryKey: ['reviews', 'user', sellerId],
    queryFn: () => reviewApi.getUserReviews(sellerId!),
    enabled: !!sellerId,
    ...defaultQueryOptions,
  });
};

export const useReplyReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      reviewApi.reply(id, reply),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
    },
  });
};

// ==================== Query Client Factory ====================

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
  },
});
