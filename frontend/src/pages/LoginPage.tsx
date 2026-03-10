import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Gamepad2, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const LoginPage: React.FC = () => {
  usePageTitle('登录');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Delta<span className="gradient-text">Hub</span>
            </span>
          </Link>
        </div>

        <div className="card-static p-8">
          <h1 className="text-2xl font-bold text-center mb-2">欢迎回来</h1>
          <p className="text-slate-400 text-center mb-8">登录您的账号</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="请输入密码"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              {/* 记住我功能暂未实现 */}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700">
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
