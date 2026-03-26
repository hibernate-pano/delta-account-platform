import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SellPage from './pages/SellPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import WalletPage from './pages/WalletPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import RefundsPage from './pages/RefundsPage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalLoadingProvider, useGlobalLoading } from './components/GlobalLoading';
import { createQueryClient } from './hooks/useQueries';

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
const KeyboardShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <GlobalLoadingProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <LoadingProgressBar />
              <KeyboardShortcuts />
              <Layout>
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
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </ErrorBoundary>
        </GlobalLoadingProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
