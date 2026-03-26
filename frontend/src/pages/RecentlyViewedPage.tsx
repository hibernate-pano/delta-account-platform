import React from 'react';
import { Link } from 'react-router-dom';
import { useRecentStore } from '../store/recent';
import { useAuthStore } from '../store/auth';
import { WishlistButton } from '../components/ui/WishlistButton';
import {
  Eye, Trash2, ArrowRight, Gamepad2, History, Clock, CheckCircle, Sparkles
} from 'lucide-react';

const formatRelativeTime = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(diff / 86400000);
  if (d < 7) return `${d}天前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const RecentlyViewedPage: React.FC = () => {
  const { items: recentItems, removeItem, clearAll } = useRecentStore();
  const { token } = useAuthStore();

  if (!token) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-xl font-bold mb-2">登录后查看浏览历史</h2>
        <p className="text-slate-500 mb-6">浏览过的账号会出现在这里</p>
        <Link to="/login" className="btn-primary inline-flex items-center gap-2">
          立即登录 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            最近浏览
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {recentItems.length > 0
              ? `${recentItems.length} 个浏览过的账号`
              : '暂无浏览记录'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {recentItems.length > 0 && (
            <button
              onClick={() => {
                if (!confirm(`确定要清空全部 ${recentItems.length} 条浏览记录吗？`)) return;
                clearAll();
              }}
              className="btn-ghost !text-red-400 !border-red-500/30 flex items-center gap-1.5 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              清空全部
            </button>
          )}
          {recentItems.length > 0 && (
            <Link to="/accounts" className="btn-secondary flex items-center gap-1.5 text-sm">
              <Gamepad2 className="w-4 h-4" />
              去逛逛
            </Link>
          )}
        </div>
      </div>

      {recentItems.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-12 h-12 text-slate-700" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-slate-300">还没有浏览记录</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            浏览账号市场后，你浏览过的账号会显示在这里
          </p>
          <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            开始浏览
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {recentItems.map((item) => (
            <div key={`${item.account.id}-${item.viewedAt}`} className="card group relative hover:border-slate-700 transition-all">
              {/* Wishlist */}
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton account={item.account} size="sm" />
              </div>

              <Link to={`/accounts/${item.account.id}`} className="block">
                {/* Image */}
                <div className="aspect-video bg-dark rounded-lg mb-4 overflow-hidden relative">
                  {item.account.images?.[0] ? (
                    <img
                      src={item.account.images[0]}
                      alt={item.account.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-10 h-10 text-slate-700" />
                    </div>
                  )}
                  {item.account.verificationStatus === 'VERIFIED' && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 bg-green-500/90 text-white text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> 已认证
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2">
                    <span className="text-lg font-bold text-white drop-shadow-lg">¥{item.account.price}</span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {item.account.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {item.account.gameRank && (
                    <span className="badge badge-primary">{item.account.gameRank}</span>
                  )}
                  <span className="flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> {item.account.skinCount} 皮肤</span>
                </div>

                {/* Viewed timestamp */}
                <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(item.viewedAt)}
                </p>
              </Link>

              {/* Remove */}
              <button
                onClick={(e) => { e.preventDefault(); removeItem(item.account.id); }}
                className="absolute bottom-4 right-4 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="移除记录"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedPage;
