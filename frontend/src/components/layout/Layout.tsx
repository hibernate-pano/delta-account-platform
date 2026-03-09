import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Gamepad2, User, LogOut, Plus, Home, ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon?: React.ElementType }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isActive(to) 
          ? 'text-primary bg-primary/10' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Delta<span className="gradient-text">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/" icon={Home}>首页</NavLink>
              <NavLink to="/accounts">账号市场</NavLink>
              {token && <NavLink to="/sell" icon={Plus}>发布账号</NavLink>}
              {token && <NavLink to="/orders" icon={ShoppingCart}>订单</NavLink>}
            </nav>

            {/* User Section */}
            <div className="hidden md:flex items-center gap-4">
              {token ? (
                <div className="flex items-center gap-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{user?.nickname || user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
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
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800">
              <nav className="flex flex-col gap-2">
                <NavLink to="/" icon={Home}>首页</NavLink>
                <NavLink to="/accounts">账号市场</NavLink>
                {token && <NavLink to="/sell" icon={Plus}>发布账号</NavLink>}
                {token && <NavLink to="/orders" icon={ShoppingCart}>订单</NavLink>}
                
                {token ? (
                  <>
                    <NavLink to="/profile" icon={User}>个人中心</NavLink>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3 px-4 pt-2">
                    <Link to="/login" className="btn-secondary flex-1 text-center">登录</Link>
                    <Link to="/register" className="btn-primary flex-1 text-center">注册</Link>
                  </div>
                )}
              </nav>
            </div>
          )}
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
