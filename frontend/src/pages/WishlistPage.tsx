import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../store/wishlist';
import { useRecentStore } from '../store/recent';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { WishlistButton } from '../components/ui/WishlistButton';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { EmptyState } from '../components/ui/EmptyState';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatRelativeTime } from '../utils/format';
import {
  Heart, Trash2, ArrowRight, Gamepad2, Filter,
  ShoppingCart, ShoppingBag, Grid3x3, List, SortAsc, SortDesc, User, ShieldCheck, Star, Eye,
  Bell, X, RefreshCw, Sparkles, CheckCircle
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortMode = 'default' | 'price_asc' | 'price_desc' | 'recent' | 'value' | 'seller_rating';

const WishlistPage: React.FC = () => {
  usePageTitle('我的心愿单');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const { items: wishlistItems, removeItem, clearAll, getVerifiedCount, getPriceRange } = useWishlistStore();
  const { items: recentItems } = useRecentStore();
  const verifiedCount = getVerifiedCount();
  const priceRange = getPriceRange();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filterVerified, setFilterVerified] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState<number | null>(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('delta_price_alerts') || '{}'); }
    catch { return {}; }
  });

  // Persist price alerts
  useEffect(() => {
    localStorage.setItem('delta_price_alerts', JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  const sortedItems = useMemo(() => {
    return [...wishlistItems]
      .filter((a) => !filterVerified || a.verificationStatus === 'VERIFIED')
      .sort((a, b) => {
        if (sortMode === 'price_asc') return a.price - b.price;
        if (sortMode === 'price_desc') return b.price - a.price;
        if (sortMode === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortMode === 'value') return ((b.skinCount || 0) / b.price) - ((a.skinCount || 0) / a.price);
        if (sortMode === 'seller_rating') return (b.sellerCreditScore || 0) - (a.sellerCreditScore || 0);
        return 0;
      });
  }, [wishlistItems, filterVerified, sortMode]);

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    const itemsToRestore = [...wishlistItems];
    clearAll();
    setShowClearConfirm(false);
    const count = itemsToRestore.length;
    showToast(`已清空 ${count} 条收藏`, 'info', {
      label: '撤销',
      onClick: () => {
        itemsToRestore.forEach(item => useWishlistStore.getState().addItem(item.account));
        showToast(`已恢复 ${count} 条收藏`, 'success');
      },
    });
  };

  const handleRemove = (id: number) => {
    setRemovingId(id);
    setTimeout(() => {
      removeItem(id);
      showToast('已从收藏移除', 'info');
      setRemovingId(null);
    }, 150);
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={Heart}
          title="登录后查看收藏"
          description="收藏感兴趣的账号，随时购买"
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
            <Heart className="w-6 h-6 text-red-400 fill-red-400" />
            我的收藏
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {wishlistItems.length > 0
              ? `${wishlistItems.length} 个收藏 · ${verifiedCount} 个已认证${priceRange.max > 0 ? ` · ¥${priceRange.min}-${priceRange.max}` : ''}`
              : '暂无收藏'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wishlistItems.length > 1 && (
            <button
              onClick={handleClearAll}
              className="btn-ghost !text-red-400 !border-red-500/30 flex items-center gap-1.5 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              清空全部
            </button>
          )}
          {wishlistItems.length > 0 && (
            <Link to="/accounts" className="btn-secondary flex items-center gap-1.5 text-sm">
              <ShoppingBag className="w-4 h-4" />
              去逛逛
            </Link>
          )}
        </div>
      </div>

      {/* Wishlist stats banner */}
      {wishlistItems.length > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-dark-card border border-dark-border hover:border-slate-600 transition-all rounded-xl">
          <div className="flex items-center gap-1.5 text-sm">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span className="text-slate-400">共</span>
            <span className="font-semibold text-white">{wishlistItems.length}</span>
            <span className="text-slate-400">个收藏</span>
          </div>
          <div className="w-px h-4 bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-slate-400">已认证</span>
            <span className="font-semibold text-green-400">{verifiedCount}</span>
          </div>
          <div className="w-px h-4 bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm">
            <SortAsc className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">价格区间</span>
            <span className="font-semibold text-white">
              {priceRange.max > 0 ? `¥${priceRange.min} ~ ¥${priceRange.max}` : '—'}
            </span>
          </div>
          <div className="w-px h-4 bg-dark-border" />
          <div className="flex items-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">收藏总值</span>
            <span className="font-semibold text-amber-400">
              ¥{wishlistItems.reduce((sum: number, a: any) => sum + a.price, 0).toLocaleString()}
            </span>
          </div>
          {Object.keys(priceAlerts).length > 0 && (
            <>
              <div className="w-px h-4 bg-dark-border" />
              <div className="flex items-center gap-1.5 text-sm">
                <Bell className="w-4 h-4 text-green-400" />
                <span className="text-slate-400">已到提醒</span>
                <span className={`font-semibold ${wishlistItems.filter((a: any) => priceAlerts[a.id] && a.price <= priceAlerts[a.id]).length > 0 ? 'text-green-400 animate-pulse' : 'text-slate-400'}`}>
                  {wishlistItems.filter((a: any) => priceAlerts[a.id] && a.price <= priceAlerts[a.id]).length}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {showClearConfirm && (
        <div className="mb-4">
          <ConfirmInline
            message={`确定要清空全部 ${wishlistItems.length} 个收藏吗？`}
            onConfirm={confirmClearAll}
            onCancel={() => setShowClearConfirm(false)}
            confirmLabel="清空"
          />
        </div>
      )}

      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="收藏夹是空的"
          description="在账号市场浏览时，点击心形图标即可收藏感兴趣的账号"
          actions={[
            { label: '浏览账号市场', to: '/accounts', icon: Gamepad2 },
            { label: '查看最近浏览', to: '/recent', icon: Eye, variant: 'secondary' },
          ]}
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Verified filter */}
            <button
              onClick={() => setFilterVerified(!filterVerified)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterVerified
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-dark-lighter text-slate-400 border border-dark-border hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              仅看已认证 {verifiedCount > 0 && `(${verifiedCount})`}
            </button>

            {/* Sort */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="排序方式"
              className="bg-dark-lighter border border-dark-border text-slate-400 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
            >
              <option value="default">默认排序</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
              <option value="recent">最近添加</option>
              <option value="value">性价比最高</option>
              <option value="seller_rating">卖家评分</option>
            </select>

            {/* Sort icon hints */}
            <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <span>共 {sortedItems.length} 个</span>
            </div>

            {/* View mode toggle */}
            <div className="flex bg-dark-lighter rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all hover:scale-110 active:scale-95 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                title="网格视图"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all hover:scale-110 active:scale-95 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {sortedItems.map((account) => (
                <div key={account.id} className="card group relative hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                  {/* Wishlist btn */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    <WishlistButton account={account} size="sm" />
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAlertModal(account.id); setAlertPrice(account.price.toString()); }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        priceAlerts[account.id]
                          ? 'bg-yellow-500/90 text-black hover:bg-yellow-400'
                          : 'bg-black/50 hover:bg-yellow-500/90 hover:text-black text-white/70'
                      }`}
                      title={priceAlerts[account.id] ? `降价提醒 ¥${priceAlerts[account.id]}` : '设置降价提醒'}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link to={`/accounts/${account.id}`} className="block">
                    {/* Image */}
                    <div className="aspect-video bg-dark rounded-lg mb-4 overflow-hidden relative">
                      {account.images?.[0] ? (
                        <img
                          src={account.images[0]}
                          alt={account.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-12 h-12 text-slate-700" />
                        </div>
                      )}
                      {/* Verified badge */}
                      {account.verificationStatus === 'VERIFIED' && (
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-0.5 bg-green-500/90 text-white text-xs rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> 已认证
                          </span>
                        </div>
                      )}
                      {/* Price overlay */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        {priceAlerts[account.id] && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                            account.price <= priceAlerts[account.id]
                              ? 'bg-green-500/90 text-white animate-pulse'
                              : 'bg-yellow-500/90 text-black'
                          }`}>
                            {account.price <= priceAlerts[account.id] ? (
                              <>
                                <span className="text-[9px] bg-red-500 text-white px-1 rounded-sm font-bold">速</span>
                                ¥{account.price}
                              </>
                            ) : (
                              <>目标 ¥{priceAlerts[account.id]}</>
                            )}
                          </span>
                        )}
                        <span className="text-lg font-bold text-white drop-shadow-lg">¥{account.price}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {account.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      {account.gameType && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs hover:scale-105 active:scale-95 transition-all cursor-default">
                          {account.gameType}
                        </span>
                      )}
                      {account.gameRank && (
                        <span className="badge badge-primary">{account.gameRank}</span>
                      )}
                      <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400/80" /> {account.skinCount} 皮肤</span>
                      {account.weapons && (
                        <span className="truncate max-w-[80px]">{account.weapons}</span>
                      )}
                      {account.rentalPrice && (
                        <span className="text-slate-600 ml-auto">租 ¥{account.rentalPrice}/时</span>
                      )}
                    </div>
                    {account.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{account.description}</p>
                    )}
                    {(account.sellerNickname || account.sellerUsername) && (
                      <div className="flex items-center gap-1.5 mb-2">
                        {account.sellerAvatar ? (
                          <img src={account.sellerAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-dark-lighter flex items-center justify-center">
                            <User className="w-2.5 h-2.5 text-slate-600" />
                          </div>
                        )}
                        <span className="text-[10px] text-slate-600 truncate max-w-[100px]">
                          {account.sellerNickname || account.sellerUsername}
                        </span>
                        {account.sellerCreditScore && (
                          <span className="text-xs text-yellow-400 flex items-center gap-0.5" title="卖家评分">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {account.sellerCreditScore}
                          </span>
                        )}
                        {account.verificationStatus === 'VERIFIED' && (
                          <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                        {account.sellerCreditScore != null && account.sellerCreditScore >= 80 && (
                          <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                        )}
                      </div>
                      {/* Escrow protection badge */}
                      {account.verificationStatus === 'VERIFIED' && (account.sellerCreditScore ?? 0) >= 70 && (
                        <div className="mt-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-green-400" />
                          <span className="text-[9px] text-green-400">资金托管</span>
                        </div>
                      )}
                    )}
                    {/* Engagement stats */}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                      {account.viewCount != null && (
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {account.viewCount}
                        </span>
                      )}
                      {account.orderCount != null && account.orderCount > 0 && (
                        <span className="flex items-center gap-0.5">
                          <ShoppingCart className="w-3 h-3" />
                          {account.orderCount}笔交易
                        </span>
                      )}
                      {(() => {
                        const recent = recentItems.find((r: any) => r.account.id === account.id);
                        if (!recent || !recent.viewedAt) return null;
                        const mins = Math.floor((Date.now() - recent.viewedAt) / 60000);
                        const label = mins < 1 ? '刚看过' : mins < 60 ? `${mins}分钟前` : mins < 1440 ? `${Math.floor(mins / 60)}小时前` : '今天';
                        return (
                          <span className="text-primary/60 flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            {label}
                          </span>
                        );
                      })()}
                      <span className="ml-auto opacity-60">{formatRelativeTime(account.createdAt)}</span>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-dark-border">
                    <Link
                      to={`/accounts/${account.id}`}
                      className="flex-1 btn-secondary !py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      查看详情
                    </Link>
                    <button
                      onClick={() => handleRemove(account.id)}
                      disabled={removingId === account.id}
                      className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="移除收藏"
                    >
                      {removingId === account.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3 animate-fade-in">
              {sortedItems.map((account) => (
                <div key={account.id} className="card flex items-center gap-4 p-4 hover:border-slate-700 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10 transition-all group">
                  {/* Image */}
                  <Link to={`/accounts/${account.id}`} className="flex-shrink-0">
                    <div className="w-24 h-16 bg-dark rounded-lg overflow-hidden">
                      {account.images?.[0] ? (
                        <img src={account.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-slate-700" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {account.verificationStatus === 'VERIFIED' && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">已认证</span>
                      )}
                      {account.gameType && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full hover:scale-105 active:scale-95 transition-all cursor-default">{account.gameType}</span>
                      )}
                      {account.gameRank && (
                        <span className="badge badge-primary">{account.gameRank}</span>
                      )}
                    </div>
                    <Link to={`/accounts/${account.id}`}>
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {account.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400/80" /> {account.skinCount} 皮肤</span>
                      {account.weapons && <span className="truncate">{account.weapons}</span>}
                    </div>
                    {account.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{account.description}</p>
                    )}
                    {/* Engagement stats */}
                    {(account.viewCount != null || (account.orderCount != null && account.orderCount > 0)) && (
                      <div className="flex items-center gap-3 mt-1">
                        {account.viewCount != null && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-600">
                            <Eye className="w-3 h-3" />{account.viewCount}次浏览
                          </span>
                        )}
                        {account.orderCount != null && account.orderCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-600">
                            <ShoppingCart className="w-3 h-3" />{account.orderCount}笔交易
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price + Seller */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary">¥{account.price}</p>
                    {account.skinCount > 0 && (
                      <p className="text-[10px] text-amber-400/60 flex items-center gap-0.5 mt-0.5 justify-end">
                        <Sparkles className="w-2.5 h-2.5" />
                        ¥{(account.price / account.skinCount).toFixed(1)}/皮肤
                      </p>
                    )}
                    {account.rentalPrice && (
                      <p className="text-xs text-slate-500">租 ¥{account.rentalPrice}/时</p>
                    )}
                    {(account.sellerNickname || account.sellerUsername) && (
                      <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                        {account.sellerAvatar ? (
                          <img src={account.sellerAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-dark-lighter flex items-center justify-center">
                            <User className="w-2.5 h-2.5 text-slate-600" />
                          </div>
                        )}
                        <span className="text-[10px] text-slate-600">{account.sellerNickname || account.sellerUsername}</span>
                        {account.verificationStatus === 'VERIFIED' && (
                          <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <WishlistButton account={account} size="sm" />
                    <Link
                      to={`/accounts/${account.id}`}
                      className="p-2 text-slate-500 hover:text-white hover:bg-dark hover:scale-110 active:scale-95 rounded-lg transition-all"
                      title="查看"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleRemove(account.id)}
                      disabled={removingId === account.id}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 hover:scale-110 active:scale-95 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="移除"
                    >
                      {removingId === account.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary footer */}
          <div className="mt-8 card p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium">
                {sortedItems.length} 个收藏
                {filterVerified && ` · ${verifiedCount} 个已认证`}
              </p>
              {sortedItems.length > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  价格区间: ¥{Math.min(...sortedItems.map((a) => a.price), Infinity).toFixed(0)}
                  — ¥{Math.max(...sortedItems.map((a) => a.price), -Infinity).toFixed(0)}
                </p>
              )}
              {sortedItems.length > 1 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  预估总价: ¥{sortedItems.reduce((sum, a) => sum + a.price, 0).toLocaleString()}
                </p>
              )}
            </div>
            <Link to="/accounts" className="btn-primary !py-2 text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              继续逛逛
            </Link>
          </div>
        </>
      )}
    </div>

    {/* Price alert modal */}
    {showAlertModal !== null && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAlertModal(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative card max-w-sm w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              设置降价提醒
            </h3>
            <button onClick={() => setShowAlertModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-lighter text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">当价格低于设置金额时，我们将通知您</p>
          {(() => {
            const target = wishlistItems.find((a) => a.id === showAlertModal);
            return target ? (
              <div className="mb-3 px-3 py-2 bg-dark-lighter rounded-lg text-xs text-slate-500 flex items-center justify-between">
                <span>当前价格</span>
                <span className="text-white font-medium">¥{target.price?.toLocaleString()}</span>
              </div>
            ) : null;
          })()}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {[0.9, 0.8, 0.7].map((pct) => {
              const target = wishlistItems.find((a) => a.id === showAlertModal);
              if (!target) return null;
              const targetPrice = Math.floor(target.price * pct);
              const label = pct === 0.9 ? '-10%' : pct === 0.8 ? '-20%' : '-30%';
              return (
                <button
                  key={pct}
                  onClick={() => setAlertPrice(targetPrice.toString())}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                    parseFloat(alertPrice) === targetPrice
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-dark-border text-slate-400 hover:border-primary/50 hover:text-white'
                  }`}
                >
                  {label}
                  <br />
                  <span className="font-medium">¥{targetPrice.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mb-4 bg-dark rounded-xl p-3">
            <span className="text-2xl text-slate-500">¥</span>
            <input
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-bold outline-none placeholder-slate-600"
              placeholder="输入目标价格"
              min="1"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            {priceAlerts[showAlertModal] && (
              <button
                onClick={() => {
                  const next = { ...priceAlerts };
                  delete next[showAlertModal];
                  setPriceAlerts(next);
                  setShowAlertModal(null);
                }}
                className="btn-secondary flex-1"
              >
                取消提醒
              </button>
            )}
            <button
              disabled={isSavingAlert}
              onClick={() => {
                const price = parseFloat(alertPrice);
                if (price > 0) {
                  setIsSavingAlert(true);
                  setPriceAlerts({ ...priceAlerts, [showAlertModal]: price });
                  showToast(`已设置 ¥${price} 的降价提醒`, 'success');
                  setTimeout(() => {
                    setShowAlertModal(null);
                    setIsSavingAlert(false);
                  }, 200);
                } else {
                  setShowAlertModal(null);
                }
              }}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSavingAlert ? '保存中...' : '确认设置'}
            </button>
          </div>
        </div>
      </div>
    )}
  );
};

export default WishlistPage;
