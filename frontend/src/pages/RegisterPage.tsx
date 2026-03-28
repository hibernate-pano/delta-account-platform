import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Gamepad2, ArrowRight, AlertCircle, Eye, EyeOff, Check, X, Sparkles } from 'lucide-react';
import AuthBackground from '../components/ui/AuthBackground';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';

const RegisterPage: React.FC = () => {
  usePageTitle('注册');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string; email?: string }>({});

  // Password strength checker
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) return { strength: 1, label: '弱', color: 'bg-red-500' };
    if (score <= 3) return { strength: 2, label: '中等', color: 'bg-yellow-500' };
    return { strength: 3, label: '强', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('用户名需要3-20个字符');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('用户名只能包含字母、数字和下划线');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    if (!formData.password) {
      setError('请输入密码');
      return false;
    }
    if (formData.password.length < 6) {
      setError('密码至少需要6位');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return false;
    }
    if (!agreed) {
      setError('请阅读并同意服务条款和隐私政策');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) return;

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
      showToast('注册成功！欢迎加入 DeltaHub', 'success');
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
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

        <div className="card-static p-8 animate-slide-up">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">创建账号</h1>
            <p className="text-slate-400 mt-1">加入 DeltaHub 交易平台</p>
          </div>

          {/* Social proof bar */}
          <div className="flex items-center justify-center gap-6 mb-6 py-3 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 rounded-xl">
            <div className="text-center">
              <p className="text-base font-bold text-primary">2,847</p>
              <p className="text-[10px] text-slate-500">活跃用户</p>
            </div>
            <div className="w-px h-8 bg-dark-border" />
            <div className="text-center">
              <p className="text-base font-bold text-green-400">1,203</p>
              <p className="text-[10px] text-slate-500">已完成交易</p>
            </div>
            <div className="w-px h-8 bg-dark-border" />
            <div className="text-center">
              <p className="text-base font-bold text-yellow-400">98.5%</p>
              <p className="text-[10px] text-slate-500">好评率</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                用户名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setFieldErrors(f => { const n = { ...f }; delete n.username; return n; }); }}
                onFocus={() => setFocusedField('username')}
                onBlur={() => {
                  setFocusedField(null);
                  if (!formData.username.trim()) setFieldErrors(f => ({ ...f, username: '请输入用户名' }));
                  else if (formData.username.length < 3 || formData.username.length > 20) setFieldErrors(f => ({ ...f, username: '用户名需要3-20个字符' }));
                  else setFieldErrors(f => { const n = { ...f }; delete n.username; return n; });
                }}
                className={`input transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:scale-[1.005] ${focusedField === 'username' ? 'ring-2 ring-primary/50 scale-[1.005]' : ''} ${fieldErrors.username ? 'border-red-500' : ''}`}
                placeholder="3-20个字符"
                autoComplete="username"
                autoFocus
              />
              {fieldErrors.username && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg animate-fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{fieldErrors.username}
                </p>
              )}
            </div>

            {/* Nickname */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">昵称</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="input"
                placeholder="可选，用于展示"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFieldErrors(f => { const n = { ...f }; delete n.email; return n; }); }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => {
                  setFocusedField(null);
                  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    setFieldErrors(f => ({ ...f, email: '请输入有效的邮箱地址' }));
                  } else {
                    setFieldErrors(f => { const n = { ...f }; delete n.email; return n; });
                  }
                }}
                className={`input transition-all focus-visible:ring-2 focus-visible:ring-primary/50 ${focusedField === 'email' ? 'ring-2 ring-primary/50' : ''} ${fieldErrors.email ? 'border-red-500' : ''}`}
                placeholder="可选，用于找回密码"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg animate-fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                密码 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors(f => { const n = { ...f }; delete n.password; return n; }); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => {
                    setFocusedField(null);
                    if (!formData.password) setFieldErrors(f => ({ ...f, password: '请输入密码' }));
                    else if (formData.password.length < 6) setFieldErrors(f => ({ ...f, password: '密码至少需要6位' }));
                    else setFieldErrors(f => { const n = { ...f }; delete n.password; return n; });
                  }}
                  className={`input pr-10 transition-all focus:ring-2 focus:ring-primary/50 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="至少6位"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength.strength >= level ? passwordStrength.color : 'bg-dark-lighter'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-').replace('-500', '')}`}>
                    密码强度: {passwordStrength.label}
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg animate-fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                确认密码 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`input pr-10 transition-all focus:ring-2 focus:ring-primary/50 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? formData.confirmPassword.startsWith(formData.password) && formData.confirmPassword.length >= 3
                        ? 'border-yellow-500 focus:border-yellow-500'
                        : 'border-red-500 focus:border-red-500'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-500 focus:border-green-500'
                      : ''
                  }`}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> 密码一致
                </p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && formData.confirmPassword.startsWith(formData.password) && formData.confirmPassword.length >= 3 && (
                <p className="text-xs text-yellow-400/70 flex items-center gap-1">
                  再输入 {formData.password.length - formData.confirmPassword.length} 个字符即可匹配
                </p>
              )}
            </div>

            {/* Agreement */}
            <div className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                id="agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
              />
              <label htmlFor="agreement" className="text-slate-400 leading-relaxed">
                我已阅读并同意{' '}
                <Link to="/terms" className="text-primary hover:underline">服务条款</Link> 和{' '}
                <Link to="/privacy" className="text-primary hover:underline">隐私政策</Link>
              </label>
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
                  <Sparkles className="w-5 h-5" />
                  注册
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400">
              已有账号？{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary-light transition-colors">
                立即登录
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
