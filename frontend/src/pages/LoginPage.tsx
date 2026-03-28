import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Gamepad2, ArrowRight, AlertCircle, Eye, EyeOff, User, Lock, Shield, Zap, TrendingUp, MessageCircle, CheckCircle, RefreshCw } from 'lucide-react';
import AuthBackground from '../components/ui/AuthBackground';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';

const REMEMBER_KEY = 'delta_remembered_username';

const LoginPage: React.FC = () => {
  usePageTitle('登录');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const nextUrl = searchParams.get('next') || '/';
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [error, setError] = useState(searchParams.get('expired') === '1' ? '登录已过期，请重新登录' : '');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const [loginTab, setLoginTab] = useState<'manual' | 'demo'>('manual');

  // Load remembered username
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setFormData((f) => ({ ...f, username: saved }));
      setRememberMe(true);
    }
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { username?: string; password?: string } = {};
    if (!formData.username.trim()) errors.username = '请输入用户名';
    if (!formData.password.trim()) errors.password = '请输入密码';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errors.username || errors.password || '请填写完整信息');
      triggerShake();
      return;
    }
    setFieldErrors({});
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(formData);
      const { token, userId, username: uname, role } = res.data.data;

      // Remember username
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, formData.username);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      setAuth(token, { id: userId, username: uname, role, balance: 0, creditScore: 100, status: 'ACTIVE' });
      navigate(nextUrl, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || (err.request ? '无法连接到服务器，请检查网络' : '登录失败，请检查用户名和密码'));
      triggerShake();
      usernameRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (username: string) => {
    setFormData({ username, password: 'password123' });
    setLoginTab('manual');
    setLoadingAccountId(username);
    try {
      const res = await authApi.login({ username, password: 'password123' });
      const { token, userId, username: uname, role } = res.data.data;
      setAuth(token, { id: userId, username: uname, role, balance: 0, creditScore: 100, status: 'ACTIVE' });
      navigate(nextUrl, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || (err.request ? '无法连接到服务器，请检查网络' : '登录失败'));
      triggerShake();
      usernameRef.current?.focus();
    } finally {
      setLoadingAccountId(null);
    }
  };

  const demoAccounts = [
    { id: 'admin', label: '管理员', sub: '全部权限', icon: Shield, color: 'text-purple-400', bg: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
    { id: 'seller1', label: '卖家体验', sub: '发布账号', icon: TrendingUp, color: 'text-green-400', bg: 'hover:bg-green-500/10 hover:border-green-500/30' },
    { id: 'buyer1', label: '买家体验', sub: '快速购买', icon: Zap, color: 'text-yellow-400', bg: 'hover:bg-yellow-500/10 hover:border-yellow-500/30' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <AuthBackground />

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

        <div className={`card-static p-8 animate-slide-up ${shake ? 'animate-shake' : ''}`}>
          <h1 className="text-2xl font-bold text-center mb-1">欢迎回来</h1>
          <p className="text-slate-400 text-center mb-6">登录您的账号</p>

          {/* Login / Demo Tabs */}
          <div className="flex bg-dark-lighter rounded-xl p-1 mb-6">
            {(['manual', 'demo'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setLoginTab(tab); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  loginTab === tab
                    ? 'bg-dark-card text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'manual' ? '账号登录' : '快速体验'}
              </button>
            ))}
          </div>

          {loginTab === 'manual' ? (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">用户名</label>
                <div className={`relative transition-all ${focusedField === 'username' ? 'scale-[1.01]' : ''}`}>
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    ref={usernameRef}
                    value={formData.username}
                    onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setFieldErrors((f) => ({ ...f, username: undefined })); setError(''); }}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className={`input pl-11 pr-4 ${fieldErrors.username ? '!border-red-500/50 !ring-1 !ring-red-500/30' : ''}`}
                    placeholder="用户名 / 手机号 / 邮箱"
                    autoComplete="username"
                    autoFocus
                  />
                  {fieldErrors.username && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">密码</label>
                <div className={`relative transition-all ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors((f) => ({ ...f, password: undefined })); setError(''); }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`input pl-11 pr-12 ${fieldErrors.password ? '!border-red-500/50 !ring-1 !ring-red-500/30' : ''}`}
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
                  {fieldErrors.password && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.password}
                    </p>
                  )}
                  {/* Password strength */}
                  {formData.password && !fieldErrors.password && (() => {
                    const pw = formData.password;
                    const ok8 = pw.length >= 8;
                    const okMixed = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
                    const okDigit = /\d/.test(pw);
                    const okSpecial = /[^a-zA-Z0-9]/.test(pw);
                    const score = [ok8, okMixed, okDigit, okSpecial].filter(Boolean).length;
                    const strength = score <= 1 ? 1 : score <= 2 ? 2 : 3;
                    const color = score <= 1 ? 'bg-red-500' : score <= 2 ? 'bg-yellow-500' : 'bg-green-500';
                    return (
                      <div className="space-y-1.5 mt-2">
                        <div className="flex gap-1">
                          {([1, 2, 3] as const).map((level) => (
                            <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? color : 'bg-dark-lighter'}`} />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                          {[
                            { done: ok8, label: '8位以上' },
                            { done: okMixed, label: '大小写混合' },
                            { done: okDigit, label: '包含数字' },
                            { done: okSpecial, label: '特殊字符' },
                          ].map(({ done, label }) => (
                            <span key={label} className={`text-[10px] flex items-center gap-0.5 ${done ? 'text-green-400' : 'text-slate-600'}`}>
                              {done ? <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" /> : <span className="w-2.5 h-2.5 flex-shrink-0" />}
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary cursor-pointer"
                  />
                  记住我
                </label>
                <button type="button" onClick={() => showToast('忘记密码功能即将上线，敬请期待', 'info')} className="text-primary hover:text-primary-light transition-colors">
                  忘记密码？
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 group relative overflow-hidden"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>登录</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <p className="text-slate-500 text-sm text-center -mt-1 mb-4">
                选择一个角色直接登录体验
              </p>
              <div className="space-y-2.5">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  const isLoading = loadingAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleDemoLogin(acc.id)}
                      disabled={!!loadingAccountId}
                      className={`w-full flex items-center gap-4 p-4 bg-dark-lighter border border-transparent rounded-xl text-left transition-all disabled:opacity-50 group ${acc.bg}`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-dark flex items-center justify-center flex-shrink-0 border border-slate-700/50`}>
                        {isLoading ? (
                          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : (
                          <Icon className={`w-5 h-5 ${acc.color}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{isLoading ? '登录中...' : acc.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{isLoading ? '正在验证...' : acc.sub}</p>
                      </div>
                      {!isLoading && <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-600 text-center mt-4">
                演示账号密码统一为 <span className="font-mono text-slate-500">password123</span>
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400">
              还没有账号？{' '}
              <Link to="/register" className="text-primary font-medium hover:text-primary-light transition-colors">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          登录即表示同意我们的{' '}
          <Link to="/terms" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">服务条款</Link>
          {' '}和{' '}
          <Link to="/privacy" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">隐私政策</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
