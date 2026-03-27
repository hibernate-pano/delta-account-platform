import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRecentStore } from '../store/recent';
import { useAuthStore } from '../store/auth';
import { WishlistButton } from '../components/ui/WishlistButton';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatRelativeTime } from '../utils/format';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { useToast } from '../components/ui/Toast';
import {
  Eye, Trash2, ArrowRight, Gamepad2, History, Clock, CheckCircle, Sparkles, Star, ShoppingCart, RefreshCw
} from 'lucide-react';

const RecentlyViewedPage: React.FC = () => {
  usePageTitle('最近浏览');
  const { items: recentItems, removeItem, clearAll } = useRecentStore();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sortMode, setSortMode] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    return recentItems
      .filter(item => !verifiedOnly || item.account.verificationStatus === 'VERIFIED')
      .sort((a, b) => {
        if (sortMode === 'price_asc') return a.account.price - b.account.price;
        if (sortMode === 'price_desc') return b.account.price - a.account.price;
        return b.viewedAt - a.viewedAt;
      });
  }, [recentItems, sortMode, verifiedOnly]);

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
              ? `${filteredItems.length} / ${recentItems.length} 个浏览过的账号`
              : '暂无浏览记录'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {recentItems.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
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

      {showClearConfirm && (
        <div className="mb-4">
          <ConfirmInline
            message={`确定要清空全部 ${recentItems.length} 条浏览记录吗？`}
            onConfirm={() => { clearAll(); setShowClearConfirm(false); }}
            onCancel={() => setShowClearConfirm(false)}
            confirmLabel="清空"
          />
        </div>
      )}

      {recentItems.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs text-slate-500">排序:</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            className="bg-dark-lighter border border-dark-border text-slate-300 text-xs rounded-lg px-3 py-1.5 cursor-pointer"
          >
            <option value="recent">最近浏览</option>
            <option value="price_asc">价格 ↑ 低到高</option>
            <option value="price_desc">价格 ↓ 高到低</option>
          </select>
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              verifiedOnly
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-dark-lighter text-slate-400 border border-dark-border hover:border-green-500/30 hover:text-green-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              仅看已认证
            </span>
          </button>
        </div>
      )}

      {filteredItems.length === 0 && recentItems.length > 0 ? (
        <div className="card text-center py-12 animate-fade-in">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500 mb-2">没有符合条件的浏览记录</p>
          <button onClick={() => { setSortMode('recent'); setVerifiedOnly(false); }} className="text-xs text-primary hover:text-primary-light transition-colors">
            清除筛选条件
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
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
          {filteredItems.map((item) => (
            <div key={`${item.account.id}-${item.viewedAt}`} className="card group relative hover:border-slate-700 transition-all">
              {/* Wishlist */}
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton account={item.account} size="sm" />
              </div>

              <Link to={`/accounts/${item.account.id}`} className={`block ${item.account.status && item.account.status !== 'ON_SALE' && item.account.status !== 'PENDING' ? 'opacity-70' : ''}`}>
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
                  {item.account.status && item.account.status !== 'ON_SALE' && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 bg-slate-800/90 text-slate-400 text-xs rounded-full border border-slate-700">
                        {item.account.status === 'SOLD' ? '已售出' : item.account.status === 'RENTED' ? '出租中' : '已下架'}
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
                  {item.account.gameType && (
                    <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded">{item.account.gameType}</span>
                  )}
                  {item.account.gameRank && (
                    <span className="badge badge-primary">{item.account.gameRank}</span>
                  )}
                  <span className="flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> {item.account.skinCount} 皮肤</span>
                </div>
                {/* Seller info */}
                {(item.account.sellerNickname || item.account.sellerUsername) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-600">
                      卖家: {item.account.sellerNickname || item.account.sellerUsername}
                    </span>
                    {item.account.sellerCreditScore != null && (
                      <span className="flex items-center gap-0.5 text-[11px] text-yellow-400/80">
                        <Star className="w-3 h-3 fill-yellow-400/80" />
                        {item.account.sellerCreditScore}分
                      </span>
                    )}
                    {item.account.verificationStatus === 'VERIFIED' && (
                      <span className="text-[10px] text-emerald-400/70">已认证</span>
                    )}
                  </div>
                )}

                {/* Viewed timestamp */}
                <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(item.viewedAt)}
                </p>

                {/* Social proof */}
                {(item.account.viewCount != null || (item.account.orderCount != null && item.account.orderCount > 0)) && (
                  <div className="flex items-center gap-3 mt-1.5">
                    {item.account.viewCount != null && (
                      <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
                        <Eye className="w-3 h-3" />
                        {item.account.viewCount} 次浏览
                      </span>
                    )}
                    {item.account.orderCount != null && item.account.orderCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] text-green-400/70">
                        <ShoppingCart className="w-3 h-3" />
                        {item.account.orderCount} 笔售出
                      </span>
                    )}
                  </div>
                )}
              </Link>

              {/* Remove */}
              <button
                disabled={removingId === item.account.id}
                onClick={(e) => {
                  e.preventDefault();
                  setRemovingId(item.account.id);
                  setTimeout(() => {
                    removeItem(item.account.id);
                    showToast('已移除浏览记录', 'info');
                    setRemovingId(null);
                  }, 150);
                }}
                className="absolute bottom-4 right-4 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="移除记录"
              >
                {removingId === item.account.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedPage;
