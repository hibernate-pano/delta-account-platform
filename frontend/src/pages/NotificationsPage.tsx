import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, FileText, ShoppingCart, Wallet, MessageCircle } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  status: string;
  relatedId: string;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchNotifications();
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
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'READ' } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PAID':
      case 'ORDER_COMPLETED':
        return <ShoppingCart className="w-5 h-5" />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-5 h-5" />;
      case 'WALLET':
        return <Wallet className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'ORDER_PAID':
      case 'ORDER_COMPLETED':
        return 'bg-green-500/20 text-green-500';
      case 'NEW_MESSAGE':
        return 'bg-blue-500/20 text-blue-500';
      case 'WALLET':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-slate-500/20 text-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">通知中心</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            全部已读
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500">暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`py-4 flex items-start gap-4 ${
                  notification.status === 'UNREAD' ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{notification.title}</p>
                    {notification.status === 'UNREAD' && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{notification.content}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(notification.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                {notification.status === 'UNREAD' && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    title="标记已读"
                  >
                    <Check className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
