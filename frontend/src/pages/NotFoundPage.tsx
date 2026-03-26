import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Gamepad2 } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const NotFoundPage: React.FC = () => {
  usePageTitle('页面未找到');
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)' }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="text-center relative z-10">
        {/* Big 404 */}
        <div className="mb-8 animate-fade-in">
          <div className="relative inline-block">
            <h1 className="text-[180px] md:text-[240px] font-extrabold leading-none select-none"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              404
            </h1>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
            />
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 bg-dark-card rounded-2xl flex items-center justify-center mx-auto border border-dark-border">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
        </div>

        {/* Message */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold mb-3">页面未找到</h2>
          <p className="text-slate-400 mb-2 max-w-sm mx-auto">
            您访问的页面不存在或已被移除
          </p>
          <p className="text-slate-600 text-sm mb-8">
            {countdown > 0 ? `${countdown} 秒后自动返回首页...` : '正在返回首页...'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上一页
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            返回首页
          </Link>
          <Link to="/accounts" className="btn-secondary flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            浏览账号市场
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-xs text-slate-600 mb-4">您可能想访问</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: '首页', to: '/' },
              { label: '账号市场', to: '/accounts' },
              { label: '发布账号', to: '/sell' },
              { label: '我的订单', to: '/orders' },
              { label: '消息中心', to: '/messages' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs px-3 py-1.5 bg-dark-lighter rounded-full text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
