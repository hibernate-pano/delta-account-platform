import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { Gamepad2, Mail, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';

const ForgotPasswordPage: React.FC = () => {
  usePageTitle('忘记密码');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast('error', '请输入邮箱地址');
      return;
    }
    setLoading(true);
    try {
      // TODO: Backend implementation needed - this will call actual API when ready
      // await authApi.forgotPassword({ email: formData.email });
      toast('info', '密码重置功能正在开发中，请联系客服');
      setStep('success');
    } catch (error: any) {
      toast('error', error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">邮件已发送</h1>
            <p className="text-slate-400">
              如果该邮箱已注册，我们会发送密码重置链接到您的邮箱。
            </p>
          </div>
          <div className="card-static p-6 text-center">
            <p className="text-sm text-slate-400 mb-4">
              没有收到邮件？请检查垃圾邮件文件夹，或
              <button onClick={() => setStep('input')} className="text-primary hover:underline ml-1">
                重新发送
              </button>
            </p>
            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-center mb-2">忘记密码</h1>
          <p className="text-slate-400 text-center mb-8">
            输入您的注册邮箱，我们将发送密码重置链接
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
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
                  发送重置链接
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400">
              想起密码了？{' '}
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

export default ForgotPasswordPage;
