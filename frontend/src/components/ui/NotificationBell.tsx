import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { notificationApi } from '../../api';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.data);
    } catch (e) {
      // Silently fail - notification count is not critical
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getList();
      setNotifications(res.data.data || []);
    } catch (e) {
      // Silently fail - notifications are not critical
    }
  };

  const handleOpen = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch (e) {
      // Silently fail
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

  // Smart navigation per notification type
  const getNavTarget = (n: Notification) => {
    switch (n.type) {
      case 'ORDER_PAID':
      case 'ORDER_COMPLETED':
      case 'ORDER_CANCELLED':
      case 'REFUND':
        return '/orders';
      case 'NEW_MESSAGE':
        return '/messages';
      case 'WALLET':
      case 'ACCOUNT_VERIFIED':
      case 'ACCOUNT_REJECTED':
        return '/wallet';
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-lighter border border-gray-800 rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold">通知</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                全部已读
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
                    className={`p-3 rounded-lg cursor-pointer hover:bg-dark ${n.status === 'UNREAD' ? 'bg-primary/5' : ''}`}
                    onClick={async (e) => {
                      // Mark as read
                      if (n.status === 'UNREAD') {
                        await notificationApi.markAsRead(n.id);
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, status: 'READ' } : item));
                      }
                      // Smart navigate
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
