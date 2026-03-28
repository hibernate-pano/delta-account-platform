import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, MessageSquare, Clock, ChevronRight, MessageCircle } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useQueries';
import { useToast } from './Toast';

const formatTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
};

export const NotificationBell: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.notificationCount ?? 0;
  const messageCount = unreadData?.messageCount ?? 0;
  const totalUnread = unreadCount + messageCount;

  const { data: notificationsData } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const notifications = notificationsData?.data?.data || [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch {
      showToast('操作失败，请重试', 'error');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PAID':
      case 'NEW_ORDER':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ORDER_COMPLETED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'ORDER_CANCELLED':
      case 'ACCOUNT_REJECTED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'ACCOUNT_VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'NEW_REVIEW':
        return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      case 'ORDER_EXPIRING':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'SYSTEM':
        return <Bell className="w-4 h-4 text-primary" />;
      default:
        return <AlertCircle className="w-4 h-4 text-primary" />;
    }
  };

  const getNavTarget = (n: { type: string }) => {
    switch (n.type) {
      case 'ORDER_PAID':
      case 'ORDER_COMPLETED':
      case 'ORDER_CANCELLED':
      case 'REFUND':
      case 'PAYMENT_FAILED':
        return '/orders';
      case 'NEW_MESSAGE':
        return '/messages';
      case 'WALLET':
        return '/wallet';
      case 'ACCOUNT_VERIFIED':
      case 'ACCOUNT_REJECTED':
      case 'LOGIN_ALERT':
      case 'PASSWORD_CHANGED':
        return '/profile';
      case 'ACCOUNT_EXPIRING':
        return '/accounts';
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
        aria-label={`通知${totalUnread > 0 ? `，${totalUnread}条未读` : ''}`}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white shadow-lg shadow-red-500/40 animate-pulse">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
        {messageCount > 0 && unreadCount === 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-dark shadow-lg shadow-blue-500/30" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-lighter border border-dark-border rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">通知</h3>
              {messageCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  <MessageCircle className="w-3 h-3" />
                  {messageCount}条私信
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? '处理中...' : '全部已读'}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-dark hover:scale-[1.01] active:scale-[0.99] transition-all ${n.status === 'UNREAD' ? 'bg-primary/5' : ''}`}
                    onClick={async () => {
                      if (n.status === 'UNREAD') {
                        try {
                          await markReadMutation.mutateAsync(n.id);
                        } catch {
                          showToast('操作失败', 'error');
                          return;
                        }
                      }
                      const target = getNavTarget(n);
                      if (target) {
                        setShowDropdown(false);
                        setTimeout(() => navigate(target!), 80);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <span className="text-[11px] text-slate-600 flex-shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.content}</p>
                      </div>
                      {n.status === 'UNREAD' ? (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      ) : (
                        getNavTarget(n) && <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
