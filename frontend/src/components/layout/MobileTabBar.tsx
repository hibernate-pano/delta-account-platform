import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Home, Gamepad2, ShoppingCart, MessageCircle, User, Plus, Bell, Heart
} from 'lucide-react';

interface TabBarItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  isAction?: boolean;
  isNotification?: boolean;
}

const MobileTabBar: React.FC<{ msgUnreadCount?: number; notifUnreadCount?: number }> = ({
  msgUnreadCount = 0,
  notifUnreadCount = 0,
}) => {
  const { token } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const tabs: TabBarItem[] = token
    ? [
        { to: '/', icon: Home, label: '首页' },
        { to: '/accounts', icon: Gamepad2, label: '市场' },
        { to: '/sell', icon: Plus, label: '发布', isAction: true },
        { to: '/orders', icon: ShoppingCart, label: '订单' },
        { to: '/messages', icon: MessageCircle, label: '消息', badge: msgUnreadCount },
        { to: '/notifications', icon: Bell, label: '通知', badge: notifUnreadCount },
        { to: '/profile', icon: User, label: '我的' },
      ]
    : [
        { to: '/', icon: Home, label: '首页' },
        { to: '/accounts', icon: Gamepad2, label: '市场' },
        { to: '/login', icon: User, label: '登录' },
      ];

  // For logged-in users: Home | Market | Action | Orders | Wishlist | More
  const displayTabs: TabBarItem[] = token
    ? [
        { to: '/', icon: Home, label: '首页' },
        { to: '/accounts', icon: Gamepad2, label: '市场' },
        { to: '/sell', icon: Plus, label: '发布', isAction: true },
        { to: '/orders', icon: ShoppingCart, label: '订单' },
        { to: '/wishlist', icon: Heart, label: '收藏' },
        { to: '/profile', icon: User, label: '我的' },
      ]
    : [
        { to: '/', icon: Home, label: '首页' },
        { to: '/accounts', icon: Gamepad2, label: '市场' },
        { to: '/login', icon: User, label: '登录' },
      ];

  return (
    <>
      {/* Spacer for mobile so content isn't hidden behind tab bar */}
      <div className="md:hidden h-20" />

      {/* Mobile Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-16 bg-dark/95 backdrop-blur-xl">
          {displayTabs.map((tab) => {
            const active = isActive(tab.to);
            const Icon = tab.icon;

            if (tab.isAction) {
              // Center action button (Publish)
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="flex-1 flex flex-col items-center justify-center relative -mt-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40 ring-4 ring-primary/20 hover:scale-105 active:scale-95 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] mt-1 text-primary font-medium">{tab.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex-1 flex flex-col items-center justify-center transition-all duration-200 ${
                  active ? 'text-primary' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-all ${active ? 'scale-110' : ''}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 transition-all ${active ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
                {/* Active indicator */}
                {active && (
                  <span className="absolute bottom-0 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileTabBar;
