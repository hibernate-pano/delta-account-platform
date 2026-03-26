import React, { useEffect, lazy, Suspense, useState, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/auth';
import HomePage from './pages/HomePage';
import AccountsPage from './pages/AccountsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import WalletPage from './pages/WalletPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import RefundsPage from './pages/RefundsPage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';
import RecentlyViewedPage from './pages/RecentlyViewedPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import FAQPage from './pages/FAQPage';
import { ToastProvider } from './components/ui/Toast';
import { BrowserTabBadge, UnreadIndicator } from './components/ui/BrowserTabBadge';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalLoadingProvider, useGlobalLoading } from './components/GlobalLoading';
import { createQueryClient } from './hooks/useQueries';

// Lazy-loaded heavy pages for code splitting
const AccountDetailPage = lazy(() => import('./pages/AccountDetailPage'));
const SellPage = lazy(() => import('./pages/SellPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Page-level loading fallback
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-500">加载中...</span>
    </div>
  </div>
);

const queryClient = createQueryClient();

// Global loading progress bar
const LoadingProgressBar: React.FC = () => {
  const { isLoading } = useGlobalLoading();

  return (
    <>
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-slide {
          animation: loading-slide 1.5s ease-in-out infinite;
        }
      `}</style>
      <div
        className="fixed top-0 left-0 right-0 z-[200] transition-all duration-300"
        style={{
          height: isLoading ? '3px' : '0',
          opacity: isLoading ? 1 : 0,
        }}
      >
        <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-loading-slide shadow-lg shadow-primary/50" />
      </div>
    </>
  );
};

// Keyboard shortcuts
const KeyboardShortcuts: React.FC<{ onShowShortcuts: () => void }> = ({ onShowShortcuts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const onShowRef = useRef(onShowShortcuts);
  useEffect(() => { onShowRef.current = onShowShortcuts; });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/' && location.pathname === '/accounts') {
        e.preventDefault();
        const el = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
        el?.focus();
      }
      if (e.key === 'Escape') {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.blur) active.blur();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/accounts');
      }
      if (e.key === 'g' && location.pathname === '/accounts' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('delta:toggle-view'));
      }
      if (e.key === '?' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        onShowRef.current();
      }
    };
    const handleCustom = () => onShowRef.current();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('delta:show-shortcuts', handleCustom);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('delta:show-shortcuts', handleCustom);
    };
  }, [navigate, location.pathname]);

  return null;
};

// Keyboard shortcuts help overlay
const KeyboardShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const shortcuts = [
    { keys: ['⌘', 'K'], desc: '打开账号市场搜索' },
    { keys: ['/'], desc: '在市场页聚焦搜索框' },
    { keys: ['G'], desc: '切换市场列表/网格视图' },
    { keys: ['Esc'], desc: '关闭弹窗 / 取消聚焦' },
    { keys: ['←', '→'], desc: '市场页翻页 / 图片画廊' },
    { keys: ['+', '-'], desc: '图片画廊放大/缩小' },
    { keys: ['P'], desc: '市场页回到第一页' },
    { keys: ['?'], desc: '显示此帮助面板' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">键盘快捷键</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors text-sm">
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">按 <kbd className="px-1 py-0.5 bg-dark rounded text-slate-400 font-mono">?</kbd> 打开此面板</p>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-slate-300">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-1 bg-dark rounded text-xs font-mono text-slate-400 border border-dark-border">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Back to top button
const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-24 md:bottom-8 right-6 w-11 h-11 bg-dark-card border border-dark-border rounded-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-primary/50 transition-all duration-300 z-40 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      title="回到顶部"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
};

const App: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isInitialized, initAuth } = useAuthStore();

  // Initialize auth on app mount
  useEffect(() => {
    if (!isInitialized) {
      initAuth();
    }
  }, []);

  // Show minimal loader while auth initializes
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <GlobalLoadingProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <LoadingProgressBar />
              <BrowserTabBadge />
              <UnreadIndicator />
              <KeyboardShortcuts onShowShortcuts={() => setShowShortcuts(true)} />
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/accounts" element={<AccountsPage />} />
                    <Route path="/accounts/:id" element={<AccountDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/sell" element={<SellPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/messages/:sessionId" element={<MessagesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/refunds" element={<RefundsPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/recent" element={<RecentlyViewedPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </Layout>
              {showShortcuts && <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />}
              <BackToTop />
            </BrowserRouter>
          </ErrorBoundary>
        </GlobalLoadingProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
