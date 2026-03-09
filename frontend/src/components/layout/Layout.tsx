import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Gamepad2, User, LogOut, Plus, Home, ShoppingCart } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-darker">
      {/* Header */}
      <header className="bg-dark border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-white">
              Delta<span className="text-primary">Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                isActive('/') ? 'text-primary' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>首页</span>
            </Link>
            <Link
              to="/accounts"
              className={`text-sm font-medium transition-colors ${
                isActive('/accounts') ? 'text-primary' : 'text-gray-300 hover:text-white'
              }`}
            >
              账号市场
            </Link>
            {token && (
              <Link
                to="/sell"
                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                  isActive('/sell') ? 'text-primary' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>发布账号</span>
              </Link>
            )}
            {token && (
              <Link
                to="/orders"
                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                  isActive('/orders') ? 'text-primary' : 'text-gray-300 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>订单</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {token ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.nickname || user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="space-x-3">
                <Link to="/login" className="btn-secondary text-sm">
                  登录
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark border-t border-gray-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 DeltaHub - 三角洲账号交易平台</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
