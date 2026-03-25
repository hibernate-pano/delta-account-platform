import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Gamepad2, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!formData.password.trim()) {
      setError('请输入密码');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(formData);
      const { token, userId, username, role } = res.data.data;
      setAuth(token, { id: userId, username, role, balance: 0, creditScore: 100, status: 'ACTIVE' });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (username: string) => {
    setFormData({ username, password: 'password123' });
    setLoading(true);
    try {
      const res = await authApi.login({ username, password: 'password123' });
      const { token, userId, username: uname, role } = res.data.data;
      setAuth(token, { id: userId, username: uname, role, balance: 0, creditScore: 100, status: 'ACTIVE' });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-dark">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Delta<span className="gradient-text">Hub</span>
            </span>
          </Link>
        </div>

        <div className="card-static p-8 animate-slide-up">
          <h1 className="text-2xl font-bold text-center mb-2">欢迎回来</h1>
          <p className="text-slate-400 text-center mb-8">登录您的账号</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">用户名</label>
              <div className={`relative transition-all ${focusedField === 'username' ? 'scale-[1.02]' : ''}`}>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="input pl-4 pr-10"
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">密码</label>
              <div className={`relative transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="input pl-4 pr-12"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary" />
                记住我
              </label>
              <a href="#" className="text-primary hover:text-primary-light transition-colors">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-500 text-xs mb-3">快速体验</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-dark-lighter rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                管理员
              </button>
              <button
                onClick={() => handleDemoLogin('seller1')}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-dark-lighter rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                卖家体验
              </button>
              <button
                onClick={() => handleDemoLogin('buyer1')}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-dark-lighter rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                买家体验
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400">
              还没有账号？{' '}
              <Link to="/register" className="text-primary font-medium hover:text-primary-light transition-colors">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
