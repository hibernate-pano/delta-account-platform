import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecentStore } from '../store/recent';
import { useAuthStore } from '../store/auth';
import { WishlistButton } from '../components/ui/WishlistButton';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatRelativeTime } from '../utils/format';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Eye, Trash2, ArrowRight, Gamepad2, History, Clock, CheckCircle, Sparkles, Star, ShoppingCart, RefreshCw, Heart, TrendingUp, Users, BadgeCheck
} from 'lucide-react';

const RecentlyViewedPage: React.FC = () => {
  usePageTitle('最近浏览');
  const navigate = useNavigate();
  const { items: recentItems, removeItem, clearAll, getVerifiedCount, getPriceRange } = useRecentStore();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sortMode, setSortMode] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const verifiedCount = getVerifiedCount();
  const { min: priceMin, max: priceMax } = getPriceRange();

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
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={Eye}
          title="登录后查看浏览历史"
          description="浏览过的账号会出现在这里"
          actions={[{ label: '立即登录', to: '/login', icon: ArrowRight, variant: 'primary' }]}
        />
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

      {/* Stats banner */}
      {recentItems.length > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-dark-card border border-dark-border hover:border-slate-600 transition-all rounded-xl">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-slate-400">共</span>
            <span className="font-semibold text-white">{recentItems.length}</span>
            <span className="text-slate-400">个账号</span>
          </div>
          <div className="w-px h-4 bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm">
            <BadgeCheck className="w-4 h-4 text-green-500" />
            <span className="text-slate-400">已认证</span>
            <span className="font-semibold text-green-400">{verifiedCount}</span>
          </div>
          <div className="w-px h-4 bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">价格区间</span>
            <span className="font-semibold text-white">
              {priceMin > 0 ? `¥${priceMin} ~ ¥${priceMax}` : '—'}
            </span>
          </div>
        </div>
      )}

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
        <EmptyState
          icon={CheckCircle}
          title="没有符合条件的浏览记录"
          actions={[{ label: '清除筛选条件', onClick: () => { setSortMode('recent'); setVerifiedOnly(false); }, variant: 'secondary' }]}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={History}
          title="还没有浏览记录"
          description="浏览账号市场后，你浏览过的账号会显示在这里"
          actions={[
            { label: '开始浏览', to: '/accounts', icon: Gamepad2 },
            { label: '查看收藏', to: '/wishlist', icon: Heart, variant: 'secondary' },
          ]}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredItems.map((item) => (
            <div key={`${item.account.id}-${item.viewedAt}`} className="card group relative hover:border-slate-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 transition-all">
              {/* Wishlist */}
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton account={item.account} size="sm" />
              </div>

              <Link to={`/accounts/${item.account.id}`} className={`block ${item.account.status && item.account.status !== 'ON_SALE' && item.account.status !== 'PENDING' ? 'opacity-70' : ''}`}>
                {/* Image */}
                <div className="aspect-video bg-dark rounded-lg mb-4 overflow-hidden relative border border-dark-border">
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
                  {(item.account.viewCount ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.account.viewCount}</span>
                  )}
                </div>
                {/* Seller info */}
                {(item.account.sellerNickname || item.account.sellerUsername) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-600">
                      卖家: {item.account.sellerNickname || item.account.sellerUsername}
                    </span>
                    {item.account.sellerCreditScore != null && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.account.sellerCreditScore}分
                      </span>
                    )}
                    {item.account.orderCount != null && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-600">
                        <ShoppingCart className="w-3 h-3" />
                        已售{item.account.orderCount}单
                      </span>
                    )}
                    {item.account.viewCount != null && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-600">
                        <Eye className="w-3 h-3" />
                        {item.account.viewCount}次浏览
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

              {/* Quick actions */}
              {item.account.status === 'ON_SALE' && (
                <div className="flex gap-2 pt-2 px-1">
                  <button
                    onClick={() => navigate(`/accounts/${item.account.id}`)}
                    className="flex-1 btn-secondary !py-1.5 text-xs flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3" /> 查看详情
                  </button>
                  {token && (
                    <button
                      onClick={() => navigate(`/accounts/${item.account.id}?action=buy`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors text-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> 立即购买
                    </button>
                  )}
                </div>
              )}

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
