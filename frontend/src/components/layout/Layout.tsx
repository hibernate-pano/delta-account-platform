import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Gamepad2, User, LogOut, Plus, Home, ShoppingCart, Menu, X, Wallet,
  MessageCircle, Bell, ChevronDown, Shield, BarChart3, RefreshCw, Heart,
  CreditCard, HelpCircle, Mail, Github, ExternalLink, CheckCircle, History, Search, Star
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useUnreadCount } from '../../hooks/useQueries';
import { useToast } from '../ui/Toast';
import ErrorBoundary from '../ui/ErrorBoundary';
import MobileTabBar from './MobileTabBar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, logout } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('delta_recent_searches') || '[]'); }
    catch { return []; }
  });
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      // Save to recent searches (max 8, dedup)
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('delta_recent_searches', JSON.stringify(updated));
      navigate(`/accounts?keyword=${encodeURIComponent(q)}`);
      setSearchQuery('');
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  const handleSuggestionClick = (q: string) => {
    navigate(`/accounts?keyword=${encodeURIComponent(q)}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleClearSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('delta_recent_searches');
  };

  // Unread counts via React Query (auto-refreshes every 30s with retry/backoff)
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.notificationCount ?? 0;
  const msgUnreadCount = unreadData?.messageCount ?? 0;

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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
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

            {/* Quick Search */}
            <div className="hidden md:block mx-6 flex-1 max-w-xs relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="搜索账号..."
                    className="w-full pl-9 pr-14 py-2 bg-dark-lighter border border-dark-border rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-dark focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-slate-600 pointer-events-none">
                    <span className="px-1 py-0.5 bg-dark-border rounded text-slate-500">⌘</span>
                    <span className="px-1 py-0.5 bg-dark-border rounded text-slate-500">K</span>
                  </kbd>
                </div>
              </form>

              {/* Recent searches dropdown */}
              {showSuggestions && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border">
                    <span className="text-xs text-slate-500">最近搜索</span>
                    <button onClick={handleClearSearches} className="text-xs text-red-400 hover:text-red-300 transition-colors">清除</button>
                  </div>
                  {recentSearches.map((q) => (
                    <button
                      key={q}
                      onMouseDown={() => handleSuggestionClick(q)}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-dark-lighter hover:text-white transition-colors flex items-center gap-2"
                    >
                      <History className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" icon={Home}>首页</NavLink>
              <NavLink to="/accounts">账号市场</NavLink>
              {token && <NavLink to="/sell" icon={Plus}>发布账号</NavLink>}
              <NavLink to="/orders" icon={ShoppingCart}>订单</NavLink>
              <NavLink to="/wishlist" icon={Heart}>收藏</NavLink>
              {token && <NavLink to="/wallet" icon={Wallet}>钱包</NavLink>}
              {token && <NavLink to="/refunds" icon={RefreshCw}>退款</NavLink>}
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

                  {/* Shortcuts hint */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('delta:show-shortcuts'))}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                    title="键盘快捷键 (?)"
                  >
                    <span className="text-xs font-mono">?</span>
                  </button>

                  {/* User Menu */}
                  <div className="relative user-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(!showUserMenu);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span className="font-medium">{user?.nickname || user?.username}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-2 animate-fade-in">
                        <div className="px-4 py-3 border-b border-dark-border">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium">{user?.nickname || user?.username}</p>
                            {user?.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" /> 管理员
                              </span>
                            )}
                            {user?.role === 'USER' && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">用户</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">@{user?.username}</p>
                          {user?.creditScore !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(user.creditScore / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                              ))}
                              <span className="text-[10px] text-yellow-400 ml-0.5">{user.creditScore}</span>
                            </div>
                          )}
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
                          to="/wishlist"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-lighter transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          我的收藏
                        </Link>
                        <Link
                          to="/recent"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-lighter transition-colors"
                        >
                          <History className="w-4 h-4" />
                          最近浏览
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
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
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
                  <NavLink to="/wishlist" icon={Heart}>我的收藏</NavLink>
                  <NavLink to="/wallet" icon={Wallet}>钱包</NavLink>
                  <NavLink to="/refunds" icon={RefreshCw}>退款</NavLink>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar msgUnreadCount={msgUnreadCount} notifUnreadCount={unreadCount} />

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-12 pb-6 mt-8 hidden md:block bg-dark-darker/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Delta<span className="gradient-text">Hub</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                专业游戏账号交易平台，买卖租赁，安全可靠，快速交付。
              </p>
              <div className="space-y-2">
                {[
                  { icon: Shield, text: '资金托管保障' },
                  { icon: CheckCircle, text: '账号审核认证' },
                  { icon: BarChart3, text: '信用评价体系' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon className="w-3.5 h-3.5 text-green-400" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-medium text-sm text-slate-300 mb-4">快捷链接</h4>
              <div className="space-y-2.5">
                {[
                  { to: '/', label: '首页' },
                  { to: '/accounts', label: '账号市场' },
                  ...(token ? [
                    { to: '/sell', label: '发布账号' },
                    { to: '/orders', label: '我的订单' },
                    { to: '/wishlist', label: '我的收藏' },
                    { to: '/recent', label: '最近浏览' },
                  ] : []),
                ].map((link) => (
                  <Link key={link.to} to={link.to}
                    className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-medium text-sm text-slate-300 mb-4">帮助支持</h4>
              <div className="space-y-2.5">
                {token && [
                  { to: '/notifications', label: '通知中心' },
                  { to: '/wallet', label: '钱包充值' },
                  { to: '/refunds', label: '退款申请' },
                ].map((link) => (
                  <Link key={link.to} to={link.to}
                    className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                    {link.label}
                  </Link>
                ))}
                <Link to="/faq" className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                  常见问题 FAQ
                </Link>
                <Link to="/faq" className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                  交易指南
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-medium text-sm text-slate-300 mb-4">法律信息</h4>
              <div className="space-y-2.5">
                <Link to="/terms" className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                  服务条款
                </Link>
                <Link to="/privacy" className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                  隐私政策
                </Link>
                <Link to="/refunds" className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                  退款政策
                </Link>
                <Link to="/messages" className="block text-sm text-slate-500 hover:text-primary hover:bg-primary/5 -mx-2 px-2 py-1 rounded-lg transition-all">
                  联系我们
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-dark-border pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span>© 2026 DeltaHub. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Payment icons placeholder */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>支付方式:</span>
                <span className="px-1.5 py-0.5 bg-dark rounded text-slate-500 hover:bg-dark-lighter hover:text-slate-400 transition-all hover:scale-105 active:scale-95">微信</span>
                <span className="px-1.5 py-0.5 bg-dark rounded text-slate-500 hover:bg-dark-lighter hover:text-slate-400 transition-all hover:scale-105 active:scale-95">支付宝</span>
                <span className="px-1.5 py-0.5 bg-dark rounded text-slate-500 hover:bg-dark-lighter hover:text-slate-400 transition-all hover:scale-105 active:scale-95">平台余额</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Quick Actions FAB */}
      {token && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex flex-col items-end gap-2">
          <div
            className={`flex flex-col gap-2 mb-2 transition-all duration-300 origin-bottom-right ${
              quickActionsOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={() => { navigate('/sell'); setQuickActionsOpen(false); }}
              aria-label="发布账号"
              className="flex items-center gap-2 bg-dark-card border border-dark-border hover:border-primary/50 rounded-xl pl-4 pr-5 py-2.5 shadow-xl transition-all group whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300 group-hover:text-white">发布账号</span>
            </button>
            <button
              onClick={() => { navigate('/wallet'); setQuickActionsOpen(false); }}
              aria-label="钱包充值"
              className="flex items-center gap-2 bg-dark-card border border-dark-border hover:border-primary/50 rounded-xl pl-4 pr-5 py-2.5 shadow-xl transition-all group whitespace-nowrap"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm text-slate-300 group-hover:text-white">钱包充值</span>
            </button>
            <button
              onClick={() => { navigate('/messages'); setQuickActionsOpen(false); }}
              aria-label="消息中心"
              className="flex items-center gap-2 bg-dark-card border border-dark-border hover:border-primary/50 rounded-xl pl-4 pr-5 py-2.5 shadow-xl transition-all group whitespace-nowrap relative"
            >
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300 group-hover:text-white">消息中心</span>
              {msgUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {msgUnreadCount > 9 ? '9+' : msgUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { navigate('/notifications'); setQuickActionsOpen(false); }}
              aria-label="通知中心"
              className="flex items-center gap-2 bg-dark-card border border-dark-border hover:border-primary/50 rounded-xl pl-4 pr-5 py-2.5 shadow-xl transition-all group whitespace-nowrap relative"
            >
              <Bell className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-300 group-hover:text-white">通知中心</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            aria-label={quickActionsOpen ? '关闭快捷操作' : '打开快捷操作'}
            aria-expanded={quickActionsOpen}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all ${
              quickActionsOpen
                ? 'bg-red-500 hover:bg-red-600 rotate-45'
                : 'bg-primary hover:bg-primary/90'
            }`}
            title={quickActionsOpen ? '关闭快捷操作' : '快捷操作'}
          >
            {quickActionsOpen ? <X className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
