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
      className={`nav-link ${isActive(to) ? 'active' : ''}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Header - Glassmorphism with neon accents */}
      <header className="glass sticky top-0 z-50 border-b border-neon-pink/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Synthwave Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(255,16,240,0.5)] transition-all duration-300 group-hover:scale-110">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/50 to-neon-cyan/50 rounded-xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
              </div>
              <span className="text-xl font-display font-bold text-white">
                Delta<span className="gradient-text">Hub</span>
              </span>
            </Link>

            {/* Quick Search - Synthwave style */}
            <div className="hidden md:block mx-6 flex-1 max-w-xs relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan/70 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="搜索账号..."
                    className="w-full pl-10 pr-14 py-2 bg-bg-dark border-2 border-bg-lighter rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink focus:shadow-[0_0_20px_rgba(255,16,240,0.3)] transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] pointer-events-none">
                    <span className="px-1.5 py-0.5 bg-neon-pink/20 border border-neon-pink/30 rounded text-neon-pink/80 font-mono">⌘</span>
                    <span className="px-1.5 py-0.5 bg-neon-pink/20 border border-neon-pink/30 rounded text-neon-pink/80 font-mono">K</span>
                  </kbd>
                </div>
              </form>

              {/* Recent searches dropdown */}
              {showSuggestions && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-bg-surface border border-neon-pink/20 rounded-xl shadow-[0_0_40px_rgba(255,16,240,0.2)] overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-bg-lighter">
                    <span className="text-xs text-text-muted font-display">最近搜索</span>
                    <button onClick={handleClearSearches} className="text-xs text-neon-pink hover:text-neon-cyan transition-colors">清除</button>
                  </div>
                  {recentSearches.map((q) => (
                    <button
                      key={q}
                      onMouseDown={() => handleSuggestionClick(q)}
                      className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors flex items-center gap-3"
                    >
                      <History className="w-3.5 h-3.5 text-text-muted" />
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Nav - Synthwave style */}
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
                    className={`p-2 rounded-lg transition-all relative group ${
                      isActive('/notifications')
                        ? 'text-neon-pink bg-neon-pink/10'
                        : 'text-text-secondary hover:text-neon-cyan hover:bg-bg-lighter'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-neon-pink text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Shortcuts hint */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('delta:show-shortcuts'))}
                    className="p-2 rounded-lg text-text-muted hover:text-neon-cyan hover:bg-bg-lighter transition-all font-mono text-sm"
                    title="键盘快捷键 (?)"
                  >
                    ?
                  </button>

                  {/* User Menu */}
                  <div className="relative user-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(!showUserMenu);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-all border border-transparent hover:border-neon-pink/30"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-neon-pink/30" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="font-display font-semibold">{user?.nickname || user?.username}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown - Synthwave style */}
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-bg-surface border border-neon-pink/30 rounded-xl shadow-[0_0_40px_rgba(255,16,240,0.2)] py-2 animate-fade-in">
                        <div className="px-4 py-3 border-b border-bg-lighter">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-display font-semibold text-text-primary">{user?.nickname || user?.username}</p>
                            {user?.role === 'ADMIN' && (
                              <span className="badge badge-primary">管理员</span>
                            )}
                            {user?.role === 'USER' && (
                              <span className="badge bg-neon-cyan/20 text-neon-cyan border border-neon-cyan">用户</span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">@{user?.username}</p>
                          {user?.creditScore !== undefined && (
                            <div className="flex items-center gap-1 mt-2">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-3 h-3 ${s <= Math.round(user.creditScore / 20) ? 'text-neon-yellow fill-neon-yellow' : 'text-bg-lighter'}`} />
                              ))}
                              <span className="text-[10px] text-neon-yellow font-mono ml-1">{user.creditScore}</span>
                            </div>
                          )}
                        </div>
                        <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors">
                          <User className="w-4 h-4 text-neon-cyan" />
                          个人中心
                        </Link>
                        <Link to="/wallet" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors">
                          <Wallet className="w-4 h-4 text-neon-green" />
                          我的钱包
                          <span className="ml-auto text-neon-pink font-mono font-bold">¥{user?.balance?.toFixed(2)}</span>
                        </Link>
                        <Link to="/wishlist" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors">
                          <Heart className="w-4 h-4 text-neon-pink" />
                          我的收藏
                        </Link>
                        <Link to="/recent" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors">
                          <History className="w-4 h-4 text-text-muted" />
                          最近浏览
                        </Link>
                        <Link to="/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors">
                          <ShoppingCart className="w-4 h-4 text-neon-cyan" />
                          我的订单
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-lighter transition-colors">
                            <Shield className="w-4 h-4 text-neon-yellow" />
                            管理后台
                          </Link>
                        )}
                        <div className="border-t border-bg-lighter mt-2 pt-2">
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
                  <Link to="/login" className="btn-ghost text-text-secondary hover:text-text-primary">
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
              className="md:hidden p-2 text-text-secondary hover:text-neon-pink hover:bg-bg-lighter rounded-lg transition-colors"
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
            <nav className="flex flex-col gap-1 pt-4 border-t border-bg-lighter">
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
                  <div className="border-t border-bg-lighter my-2 pt-2">
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

      {/* Footer - Synthwave style */}
      <footer className="border-t border-neon-pink/20 pt-12 pb-6 mt-8 hidden md:block bg-bg-darker/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan rounded-lg flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/50 to-neon-cyan/50 rounded-lg blur-lg opacity-50" />
                </div>
                <span className="text-lg font-display font-bold text-white">
                  Delta<span className="gradient-text">Hub</span>
                </span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                专业游戏账号交易平台，买卖租赁，安全可靠，快速交付。
              </p>
              <div className="space-y-2">
                {[
                  { icon: Shield, text: '资金托管保障', color: 'text-neon-green' },
                  { icon: CheckCircle, text: '账号审核认证', color: 'text-neon-cyan' },
                  { icon: BarChart3, text: '信用评价体系', color: 'text-neon-yellow' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className={`flex items-center gap-2 text-xs ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">快捷链接</h4>
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
                    className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">帮助支持</h4>
              <div className="space-y-2.5">
                {token && [
                  { to: '/notifications', label: '通知中心' },
                  { to: '/wallet', label: '钱包充值' },
                  { to: '/refunds', label: '退款申请' },
                ].map((link) => (
                  <Link key={link.to} to={link.to}
                    className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                    {link.label}
                  </Link>
                ))}
                <Link to="/faq" className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                  常见问题 FAQ
                </Link>
                <Link to="/faq" className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                  交易指南
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">法律信息</h4>
              <div className="space-y-2.5">
                <Link to="/terms" className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                  服务条款
                </Link>
                <Link to="/privacy" className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                  隐私政策
                </Link>
                <Link to="/refunds" className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                  退款政策
                </Link>
                <Link to="/messages" className="block text-sm text-text-muted hover:text-neon-pink hover:bg-neon-pink/5 -mx-2 px-2 py-1 rounded-lg transition-all hover:translate-x-1">
                  联系我们
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-bg-lighter pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <span>© 2026 DeltaHub. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>支付方式:</span>
                <span className="px-2 py-1 bg-neon-green/10 border border-neon-green/30 rounded text-neon-green hover:bg-neon-green/20 transition-colors">微信</span>
                <span className="px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-neon-cyan hover:bg-neon-cyan/20 transition-colors">支付宝</span>
                <span className="px-2 py-1 bg-neon-pink/10 border border-neon-pink/30 rounded text-neon-pink hover:bg-neon-pink/20 transition-colors">平台余额</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Quick Actions FAB - Synthwave style */}
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
              className="flex items-center gap-2 bg-bg-surface border border-neon-green/30 hover:border-neon-green rounded-xl pl-4 pr-5 py-2.5 shadow-[0_0_30px_rgba(0,255,136,0.2)] transition-all group whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-neon-green" />
              <span className="text-sm text-text-secondary group-hover:text-neon-green">发布账号</span>
            </button>
            <button
              onClick={() => { navigate('/wallet'); setQuickActionsOpen(false); }}
              aria-label="钱包充值"
              className="flex items-center gap-2 bg-bg-surface border border-neon-pink/30 hover:border-neon-pink rounded-xl pl-4 pr-5 py-2.5 shadow-[0_0_30px_rgba(255,16,240,0.2)] transition-all group whitespace-nowrap"
            >
              <Wallet className="w-4 h-4 text-neon-pink" />
              <span className="text-sm text-text-secondary group-hover:text-neon-pink">钱包充值</span>
            </button>
            <button
              onClick={() => { navigate('/messages'); setQuickActionsOpen(false); }}
              aria-label="消息中心"
              className="flex items-center gap-2 bg-bg-surface border border-neon-cyan/30 hover:border-neon-cyan rounded-xl pl-4 pr-5 py-2.5 shadow-[0_0_30px_rgba(0,217,255,0.2)] transition-all group whitespace-nowrap relative"
            >
              <MessageCircle className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm text-text-secondary group-hover:text-neon-cyan">消息中心</span>
              {msgUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-pink rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
                  {msgUnreadCount > 9 ? '9+' : msgUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { navigate('/notifications'); setQuickActionsOpen(false); }}
              aria-label="通知中心"
              className="flex items-center gap-2 bg-bg-surface border border-neon-yellow/30 hover:border-neon-yellow rounded-xl pl-4 pr-5 py-2.5 shadow-[0_0_30px_rgba(255,230,0,0.2)] transition-all group whitespace-nowrap relative"
            >
              <Bell className="w-4 h-4 text-neon-yellow" />
              <span className="text-sm text-text-secondary group-hover:text-neon-yellow">通知中心</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-pink rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            aria-label={quickActionsOpen ? '关闭快捷操作' : '打开快捷操作'}
            aria-expanded={quickActionsOpen}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,16,240,0.5)] transition-all ${
              quickActionsOpen
                ? 'bg-red-500 hover:bg-red-600 rotate-45'
                : 'bg-gradient-to-br from-neon-pink to-neon-purple hover:shadow-[0_0_50px_rgba(255,16,240,0.8)]'
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