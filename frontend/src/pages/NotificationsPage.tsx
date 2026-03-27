import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from '../hooks/useQueries';
import { formatRelativeTime } from '../utils/format';
import { usePageTitle } from '../hooks/usePageTitle';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ScrollToTop } from '../components/ui/ScrollToTop';
import {
  Bell, CheckCheck, RefreshCw, ShoppingCart, Wallet, MessageCircle,
  BellOff, Clock, ChevronRight, Package, User, Star, Trash2, Zap, X, AlertCircle, ArrowLeft,
  XCircle, ShieldOff, CreditCard, AlertTriangle, Lock, CheckCircle, CheckCheck
} from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  status: 'UNREAD' | 'READ';
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  relatedId?: string;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; priority: 'HIGH' | 'NORMAL' | 'LOW' }> = {
  ORDER_PAID: { icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/20', label: '支付', priority: 'HIGH' },
  ORDER_COMPLETED: { icon: Package, color: 'text-green-400', bg: 'bg-green-500/20', label: '完成', priority: 'NORMAL' },
  ORDER_CANCELLED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: '取消', priority: 'HIGH' },
  ORDER_REJECTED: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: '拒绝', priority: 'HIGH' },
  NEW_MESSAGE: { icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/20', label: '消息', priority: 'HIGH' },
  NEW_REVIEW: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '评价', priority: 'NORMAL' },
  WALLET: { icon: Wallet, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '钱包', priority: 'NORMAL' },
  ACCOUNT_VERIFIED: { icon: CheckCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: '认证', priority: 'LOW' },
  ACCOUNT_EXPIRING: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20', label: '即将到期', priority: 'HIGH' },
  ACCOUNT_SUSPENDED: { icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-500/20', label: '账号异常', priority: 'HIGH' },
  USER_REGISTERED: { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: '用户', priority: 'LOW' },
  REFUND: { icon: Wallet, color: 'text-red-400', bg: 'bg-red-500/20', label: '退款', priority: 'HIGH' },
  PAYMENT_FAILED: { icon: CreditCard, color: 'text-red-400', bg: 'bg-red-500/20', label: '支付失败', priority: 'HIGH' },
  LOGIN_ALERT: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '安全', priority: 'HIGH' },
  PASSWORD_CHANGED: { icon: Lock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: '安全', priority: 'HIGH' },
  SYSTEM: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20', label: '系统', priority: 'HIGH' },
};
const getDefault = () => ({ icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/20', label: '通知', priority: 'NORMAL' as const });

const PRIORITY_LABEL: Record<string, { label: string; color: string }> = {
  HIGH: { label: '重要', color: 'text-red-400' },
  NORMAL: { label: '一般', color: 'text-slate-500' },
  LOW: { label: '低', color: 'text-slate-600' },
};

const groupByDate = (notifications: Notification[]) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: { label: string; items: Notification[] }[] = [];
  const todayItems: Notification[] = [], yesterdayItems: Notification[] = [], olderItems: Notification[] = [];

  notifications.forEach((n) => {
    const date = new Date(n.createdAt).toDateString();
    if (date === today) todayItems.push(n);
    else if (date === yesterday) yesterdayItems.push(n);
    else olderItems.push(n);
  });

  if (todayItems.length) groups.push({ label: '今天', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
  if (olderItems.length) groups.push({ label: '更早', items: olderItems });
  return groups;
};

// Smart navigation map per notification type
const getNavTarget = (notification: Notification): { to: string; label: string } | null => {
  const { type, relatedId } = notification;
  switch (type) {
    case 'ORDER_PAID':
    case 'ORDER_COMPLETED':
    case 'ORDER_CANCELLED':
    case 'ORDER_REJECTED':
    case 'PAYMENT_FAILED':
      return {
        to: relatedId ? `/orders?orderId=${relatedId}` : '/orders',
        label: type === 'PAYMENT_FAILED' ? '重新支付' : '查看订单',
      };
    case 'REFUND':
      return {
        to: relatedId ? `/refunds?orderId=${relatedId}` : '/refunds',
        label: '查看退款',
      };
    case 'NEW_MESSAGE':
      return { to: '/messages', label: '回复消息' };
    case 'WALLET':
      return { to: '/wallet', label: '查看钱包' };
    case 'NEW_REVIEW':
      return { to: '/profile?tab=reviews', label: '查看评价' };
    case 'LOGIN_ALERT':
    case 'PASSWORD_CHANGED':
    case 'ACCOUNT_VERIFIED':
      return { to: '/profile', label: '个人中心' };
    case 'ACCOUNT_EXPIRING':
      return { to: '/accounts', label: '浏览账号' };
    default:
      return null;
  }
};

// Single notification item
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (n: Notification) => void;
  markReadPending: boolean;
  markDeletePending: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
}> = ({ notification, onMarkRead, onDelete, onView, markReadPending, markDeletePending, selectedIds, onToggleSelect }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef(0);
  const config = typeConfig[notification.type] || getDefault();
  const Icon = config.icon;
  const isUnread = notification.status === 'UNREAD';

  const navigate = useNavigate();

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -80)); // left = delete
    if (dx > 0 && isUnread) setSwipeX(Math.min(dx, 80)); // right = mark read
  };
  const handleTouchEnd = () => {
    if (swipeX < -40) {
      setSwipeX(-80);
    } else if (swipeX > 40 && isUnread) {
      onMarkRead(notification.id);
      setSwipeX(0);
    } else {
      setSwipeX(0);
    }
    setSwiping(false);
  };

  const isHigh = config.priority === 'HIGH';

  return (
    <div className={`relative overflow-hidden transition-all ${isUnread ? 'bg-primary/4' : ''}`}>
      {/* Swipe-to-delete action */}
      <div
        className="absolute inset-y-0 right-0 w-20 bg-red-500/90 flex items-center justify-center cursor-pointer"
        onClick={() => { onDelete(notification.id); setSwipeX(0); }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>
      {/* Swipe-to-mark-read action */}
      {isUnread && (
        <div
          className="absolute inset-y-0 left-0 w-20 bg-green-500/90 flex items-center justify-center cursor-pointer"
          onClick={() => { onMarkRead(notification.id); setSwipeX(0); }}
        >
          <CheckCheck className="w-5 h-5 text-white" />
        </div>
      )}

      <div
        className="relative bg-dark-card"
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.2s' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Selection checkbox */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect(notification.id); }}
          aria-label={selectedIds.has(notification.id) ? '取消选择此通知' : '选择此通知'}
          className="flex-shrink-0 flex items-center justify-center w-10 h-full align-middle"
        >
          <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
            selectedIds.has(notification.id)
              ? 'bg-primary border-primary'
              : 'border-slate-600 hover:border-slate-400'
          }`}>
            {selectedIds.has(notification.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
        </button>
        <div className="px-2 py-4 flex items-start gap-3 hover:bg-dark-lighter/40 transition-colors cursor-pointer active:bg-dark-lighter/60"
          onClick={() => {
            // Smart navigate on click
            const target = getNavTarget(notification);
            if (target) {
              onView(notification); // still mark read
              if (isUnread) onMarkRead(notification.id);
              setTimeout(() => navigate(target.to), 100);
            } else {
              onView(notification); // open modal
            }
          }}
        >
          {/* Icon */}
          <div className={`relative flex-shrink-0`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${isHigh && isUnread ? 'ring-2 ring-red-500/40' : ''}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            {isUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-dark-card" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              {isHigh && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 ${PRIORITY_LABEL.HIGH.color}`}>
                  {PRIORITY_LABEL.HIGH.label}
                </span>
              )}
              {isUnread && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                  新
                </span>
              )}
            </div>
            <p className={`text-sm font-medium leading-snug ${isUnread ? 'text-white' : 'text-slate-300'}`}>
              {notification.title}
            </p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {notification.content}
            </p>
            <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>

          {/* Nav indicator + Actions */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {getNavTarget(notification) && (
              <ChevronRight className="w-4 h-4 text-slate-600 mb-1" />
            )}
            {isUnread && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                disabled={markReadPending}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50"
                title="标记已读"
              >
                {markReadPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id); setSwipeX(0); }}
              disabled={markDeletePending}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-wait"
              title="删除"
            >
              {markDeletePending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsPage: React.FC = () => {
  usePageTitle('消息通知');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<'all' | 'UNREAD' | 'READ'>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, !!selectedNotification);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications: Notification[] = (data?.data?.data || []).filter((n: Notification) => !deletedIds.has(n.id));

  const handleMarkAsRead = async (id: number) => {
    setPendingIds((prev) => new Set([...prev, id]));
    try { await markReadMutation.mutateAsync(id); }
    catch { showToast('操作失败', 'error'); }
    finally { setPendingIds((prev) => { const s = new Set(prev); s.delete(id); return s; }); }
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllReadMutation.mutateAsync(); showToast('已全部标记为已读', 'success'); }
    catch { showToast('操作失败', 'error'); }
  };

  const handleDelete = async (id: number) => {
    // Optimistic update
    setDeletedIds((prev) => new Set([...prev, id]));
    setDeletingIds((prev) => new Set([...prev, id]));
    try {
      await deleteMutation.mutateAsync(id);
      showToast('通知已删除', 'info');
    } catch {
      // Rollback
      setDeletedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      showToast('删除失败', 'error');
    } finally {
      setDeletingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    ids.forEach((id) => setDeletedIds((prev) => new Set([...prev, id])));
    setSelectedIds(new Set());
    const results = await Promise.allSettled(ids.map((id) => deleteMutation.mutateAsync(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed === 0) {
      showToast(`已删除 ${ids.length} 条通知`, 'success');
    } else {
      showToast(`删除了 ${ids.length - failed} 条，${failed} 条失败`, 'error');
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedIds.size === 0) return;
    const unreadIds = [...selectedIds].filter((id) => {
      const n = notifications.find((n) => n.id === id);
      return n?.status === 'UNREAD';
    });
    if (unreadIds.length === 0) { showToast('选中的通知都已读', 'info'); return; }
    unreadIds.forEach((id) => markReadMutation.mutate(id));
    setSelectedIds(new Set());
    showToast(`已标记 ${unreadIds.length} 条为已读`, 'success');
  };

  // Keyboard dismiss for detail modal
  useEffect(() => {
    if (!selectedNotification) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedNotification(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedNotification]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => { refetch(); }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return n.status === 'UNREAD';
    if (activeFilter === 'READ') return n.status === 'READ';
    return true;
  }).filter((n) =>
    activeTypeFilter === 'all' || n.type === activeTypeFilter
  ).filter((n) =>
    keyword.trim()
      ? n.title.toLowerCase().includes(keyword.toLowerCase()) ||
        n.content.toLowerCase().includes(keyword.toLowerCase())
      : true
  );

  const grouped = groupByDate(filteredNotifications);
  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;
  const highPriorityCount = notifications.filter((n) => n.status === 'UNREAD' && (typeConfig[n.type]?.priority === 'HIGH')).length;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 skeleton rounded" />
          <div className="h-10 w-28 skeleton rounded" />
        </div>
        <div className="card space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 py-3">
              <div className="w-10 h-10 skeleton rounded-xl" />
              <div className="flex-1"><div className="h-4 w-2/3 skeleton rounded mb-2" /><div className="h-3 w-1/2 skeleton rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-slate-300">加载通知失败</h3>
          <p className="text-slate-600 text-sm mb-6">无法获取通知列表，请检查网络后重试</p>
          <button
            onClick={() => refetch()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">通知中心</h1>
          {highPriorityCount > 0 && (
            <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              {highPriorityCount} 条重要通知待处理
            </p>
          )}
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} 条未读</p>
          )}
        </div>
        {/* Keyword search */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索通知..."
              className="input w-full !pl-10 !py-2.5 !text-sm"
            />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              aria-label="清除搜索"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} disabled={markAllReadMutation.isPending}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50">
              {markAllReadMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              全部已读
            </button>
          )}
          <button
            onClick={() => { setSelectedIds(new Set()); }}
            className="btn-ghost p-2"
            title={selectedIds.size > 0 ? '取消选择' : '选择'}
          >
            {selectedIds.size > 0 ? <X className="w-4 h-4 text-primary" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkMarkAsRead} className="btn-secondary !py-1.5 !px-3 text-sm flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              已读 ({[...selectedIds].filter((id) => notifications.find((n) => n.id === id)?.status === 'UNREAD').length})
            </button>
          )}
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="btn-secondary !py-1.5 !px-3 text-sm flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              删除 ({selectedIds.size})
            </button>
          )}
          <button onClick={() => refetch()} className="btn-ghost p-2" title="刷新">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {dataUpdatedAt && (
          <p className="text-xs text-slate-600 mt-1 text-right flex items-center gap-1 justify-end">
            <RefreshCw className="w-3 h-3" />
            {(() => { const d = Math.floor((Date.now() - dataUpdatedAt) / 60000); return d < 1 ? '刚刚更新' : d < 60 ? `${d}分钟前更新` : `${Math.floor(d/60)}小时前更新`; })()}
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-3 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'all', label: '全部', count: notifications.length },
          { key: 'UNREAD', label: '未读', count: unreadCount, highlight: unreadCount > 0 },
          { key: 'READ', label: '已读', count: notifications.length - unreadCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeFilter === tab.key
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeFilter === tab.key ? 'bg-white/20' : tab.highlight ? 'bg-red-500/20 text-red-400' : 'bg-dark'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { key: 'all', label: '全部', config: { icon: Bell } },
          { key: 'ORDER_PAID', label: '支付', config: typeConfig.ORDER_PAID },
          { key: 'ORDER_COMPLETED', label: '完成', config: typeConfig.ORDER_COMPLETED },
          { key: 'ORDER_CANCELLED', label: '取消', config: typeConfig.ORDER_CANCELLED },
          { key: 'NEW_MESSAGE', label: '消息', config: typeConfig.NEW_MESSAGE },
          { key: 'NEW_REVIEW', label: '评价', config: typeConfig.NEW_REVIEW },
          { key: 'WALLET', label: '钱包', config: typeConfig.WALLET },
          { key: 'REFUND', label: '退款', config: typeConfig.REFUND },
          { key: 'SYSTEM', label: '系统', config: typeConfig.SYSTEM },
        ].map((tab) => {
          const count = tab.key === 'all' ? notifications.length : notifications.filter((n) => n.type === tab.key).length;
          const Icon = tab.config.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTypeFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                activeTypeFilter === tab.key
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-dark-lighter text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.key !== 'all' && tab.config.color ? tab.config.color : ''}`} />
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTypeFilter === tab.key ? 'bg-primary/30' : 'bg-dark'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      <div className="card p-0 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
              <BellOff className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">
              {activeFilter === 'UNREAD' ? '太棒了！全部已读'
               : activeTypeFilter !== 'all' ? '该分类暂无通知'
               : '暂无通知'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              {activeFilter === 'UNREAD' ? '没有遗漏任何重要消息'
               : activeFilter === 'all' && activeTypeFilter === 'all' ? '有新消息时会在这里显示'
               : '切换到全部查看'}
            </p>
            {(activeFilter !== 'all' || activeTypeFilter !== 'all') && (
              <button onClick={() => { setActiveFilter('all'); setActiveTypeFilter('all'); }} className="btn-secondary text-sm">查看全部</button>
            )}
            {activeFilter === 'UNREAD' && (
              <button onClick={() => navigate('/accounts')} className="btn-primary text-sm mt-2">去逛逛账号市场</button>
            )}
          </div>
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Date Header */}
                <div className="px-4 py-2.5 bg-dark-darker text-xs text-slate-500 font-medium sticky top-0 z-10 flex items-center justify-between">
                  <span>{group.label}</span>
                  <span className="text-slate-600">{group.items.length} 条</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-dark-border">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      onView={setSelectedNotification}
                      markReadPending={pendingIds.has(notification.id)}
                      markDeletePending={deletingIds.has(notification.id)}
                      selectedIds={selectedIds}
                      onToggleSelect={(id) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          next.has(id) ? next.delete(id) : next.add(id);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Notification Detail Modal */}
      {selectedNotification && (() => {
        const n = selectedNotification;
        const cfg = typeConfig[n.type] || getDefault();
        const Icon = cfg.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedNotification(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <div className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden"
              onClick={(e) => e.stopPropagation()} ref={modalRef}>
              <div className="px-6 py-5 border-b border-dark-border flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold">{n.title}</h2>
                  <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <button onClick={() => setSelectedNotification(null)} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                <div className="mt-5 flex gap-2 flex-wrap">
                  {getNavTarget(n) && (
                    <button
                      onClick={() => { setSelectedNotification(null); navigate(getNavTarget(n)!.to); }}
                      className="btn-primary flex-1 text-sm"
                    >
                      {getNavTarget(n)!.label}
                    </button>
                  )}
                  <button onClick={() => setSelectedNotification(null)} className="btn-secondary flex-1 text-sm">关闭</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    <ScrollToTop />
    </div>
  );
};

export default NotificationsPage;
