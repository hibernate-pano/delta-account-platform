import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { Bell, CheckCheck, Trash2, RefreshCw, ShoppingCart, Wallet, MessageCircle, BellOff, Filter, Clock, ChevronRight, Package, User } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  status: 'UNREAD' | 'READ';
  relatedId?: string;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  ORDER_PAID: { icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/20', label: '支付' },
  ORDER_COMPLETED: { icon: Package, color: 'text-green-400', bg: 'bg-green-500/20', label: '完成' },
  NEW_MESSAGE: { icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/20', label: '消息' },
  WALLET: { icon: Wallet, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '钱包' },
  ACCOUNT_VERIFIED: { icon: CheckCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: '认证' },
  USER_REGISTERED: { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: '用户' },
};

const getDefaultConfig = () => ({ icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/20', label: '通知' });

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const groupByDate = (notifications: Notification[]) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groups: { label: string; items: Notification[] }[] = [];
  const todayItems: Notification[] = [];
  const yesterdayItems: Notification[] = [];
  const olderItems: Notification[] = [];

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

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'UNREAD' | 'READ'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [token]);

  // Auto-poll every 30s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getList();
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
      );
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
      showToast('已全部标记为已读', 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return n.status === 'UNREAD';
    if (activeFilter === 'READ') return n.status === 'READ';
    return true;
  });

  const grouped = groupByDate(filteredNotifications);
  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 skeleton rounded" />
          <div className="h-10 w-28 skeleton rounded" />
        </div>
        <div className="card space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 py-3">
              <div className="w-10 h-10 skeleton rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-2/3 skeleton rounded mb-2" />
                <div className="h-3 w-1/2 skeleton rounded" />
              </div>
            </div>
          ))}
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
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              有 <span className="text-primary font-medium">{unreadCount}</span> 条未读通知
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              全部已读
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="btn-ghost p-2"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'all', label: '全部', count: notifications.length },
          { key: 'UNREAD', label: '未读', count: unreadCount },
          { key: 'READ', label: '已读', count: notifications.length - unreadCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeFilter === tab.key
                ? 'bg-primary text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeFilter === tab.key ? 'bg-white/20' : 'bg-dark'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card p-0 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">
              {activeFilter === 'all'
                ? '暂无通知'
                : activeFilter === 'UNREAD'
                ? '没有未读通知'
                : '暂无已读通知'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              {activeFilter === 'all'
                ? '有新消息时会在这里显示'
                : '试试切换到全部通知'}
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="btn-secondary text-sm"
            >
              查看全部
            </button>
          </div>
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-dark-darker text-xs text-slate-500 font-medium sticky top-0">
                  {group.label}
                </div>

                {/* Notifications */}
                <div className="divide-y divide-dark-border">
                  {group.items.map((notification) => {
                    const config = typeConfig[notification.type] || getDefaultConfig();
                    const Icon = config.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`relative group transition-colors ${
                          notification.status === 'UNREAD'
                            ? 'bg-primary/5'
                            : 'hover:bg-dark-lighter/30'
                        }`}
                      >
                        <div className="px-4 py-4 flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                                {config.label}
                              </span>
                              {notification.status === 'UNREAD' && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className={`font-medium text-sm ${notification.status === 'UNREAD' ? 'text-white' : 'text-slate-300'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {notification.status === 'UNREAD' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="标记已读"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </button>
                            )}
                            {notification.relatedId && (
                              <button
                                onClick={() => {
                                  // Navigate based on type
                                  if (notification.type.includes('ORDER')) {
                                    navigate('/orders');
                                  } else if (notification.type.includes('MESSAGE')) {
                                    navigate('/messages');
                                  }
                                }}
                                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="查看详情"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
