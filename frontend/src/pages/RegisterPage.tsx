import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Gamepad2, Mail, Lock, User, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const RegisterPage: React.FC = () => {
  usePageTitle('注册');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register({
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname || formData.username,
        email: formData.email
      });
      const { token, userId, username, role } = res.data.data;
      setAuth(token, { id: userId, username, role, balance: 0, creditScore: 100, status: 'ACTIVE' });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
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
          <h1 className="text-2xl font-bold text-center mb-2">创建账号</h1>
          <p className="text-slate-400 text-center mb-8">加入 DeltaHub 交易平台</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">用户名 *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="3-20个字符"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">昵称</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="input"
                placeholder="可选"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="可选"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码 *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="至少6位"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">确认密码 *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input"
                placeholder="再次输入密码"
                required
              />
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-400">
              <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary" />
              <span>
                我已阅读并同意 <Link to="/terms" className="text-primary hover:underline">服务条款</Link> 和 <Link to="/privacy" className="text-primary hover:underline">隐私政策</Link>
              </span>
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
                  注册
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400">
              已有账号？{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary-light transition-colors">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
