import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Gamepad2, User, LogOut, Plus, Home, ShoppingCart, Menu, X, Wallet,
  MessageCircle, Bell, ChevronDown, Shield, BarChart3
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../../api';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgUnreadCount, setMsgUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Poll for notifications
  useEffect(() => {
    if (!token) return;

    const fetchCounts = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          notificationApi.getUnreadCount(),
          notificationApi.getUnreadCount().catch(() => ({ data: { data: 0 } }))
        ]);
        setUnreadCount(notifRes.data.data || 0);
      } catch {
        // Silently fail
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [token]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu && !(e.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [logout, navigate]);

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'ADMIN';

  const NavLink = ({
    to,
    children,
    icon: Icon,
    badge
  }: {
    to: string;
    children: React.ReactNode;
    icon?: React.ElementType;
    badge?: number;
  }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all relative ${
        isActive(to)
          ? 'text-primary bg-primary/10'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Delta<span className="gradient-text">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" icon={Home}>首页</NavLink>
              <NavLink to="/accounts">账号市场</NavLink>
              {token && <NavLink to="/sell" icon={Plus}>发布账号</NavLink>}
              {token && <NavLink to="/orders" icon={ShoppingCart}>订单</NavLink>}
              {token && <NavLink to="/wallet" icon={Wallet}>钱包</NavLink>}
              {token && <NavLink to="/messages" icon={MessageCircle} badge={msgUnreadCount}>消息</NavLink>}
              {isAdmin && (
                <NavLink to="/admin" icon={Shield}>管理</NavLink>
              )}
            </nav>

            {/* User Section */}
            <div className="hidden md:flex items-center gap-4">
              {token ? (
                <div className="flex items-center gap-3">
                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    className={`p-2 rounded-lg transition-all relative ${
                      isActive('/notifications')
                        ? 'text-primary bg-primary/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative user-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(!showUserMenu);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{user?.nickname || user?.username}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-2 animate-fade-in">
                        <div className="px-4 py-3 border-b border-dark-border">
                          <p className="font-medium">{user?.nickname || user?.username}</p>
                          <p className="text-sm text-slate-500">@{user?.username}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-lighter transition-colors"
                        >
                          <User className="w-4 h-4" />
                          个人中心
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-lighter transition-colors"
                        >
                          <Wallet className="w-4 h-4" />
                          我的钱包
                          <span className="ml-auto text-primary text-sm">¥{user?.balance?.toFixed(2)}</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-lighter transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          我的订单
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-lighter transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            管理后台
                          </Link>
                        )}
                        <div className="border-t border-dark-border mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            退出登录
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="btn-ghost">
                    登录
                  </Link>
                  <Link to="/register" className="btn-primary">
                    注册
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ${
              mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
            }`}
          >
            <nav className="flex flex-col gap-1 pt-4 border-t border-slate-800">
              <NavLink to="/" icon={Home}>首页</NavLink>
              <NavLink to="/accounts">账号市场</NavLink>
              {token && (
                <>
                  <NavLink to="/sell" icon={Plus}>发布账号</NavLink>
                  <NavLink to="/orders" icon={ShoppingCart}>订单</NavLink>
                  <NavLink to="/wallet" icon={Wallet}>钱包</NavLink>
                  <NavLink to="/messages" icon={MessageCircle} badge={msgUnreadCount}>消息</NavLink>
                  <NavLink to="/notifications" icon={Bell} badge={unreadCount}>通知</NavLink>
                  {isAdmin && <NavLink to="/admin" icon={Shield}>管理</NavLink>}
                </>
              )}

              {token ? (
                <>
                  <div className="border-t border-slate-800 my-2 pt-2">
                    <NavLink to="/profile" icon={User}>个人中心</NavLink>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link to="/login" className="btn-secondary flex-1 text-center py-2.5">
                    登录
                  </Link>
                  <Link to="/register" className="btn-primary flex-1 text-center py-2.5">
                    注册
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Gamepad2 className="w-5 h-5" />
              <span>© 2026 DeltaHub. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-primary transition-colors">服务条款</a>
              <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
              <a href="#" className="hover:text-primary transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
