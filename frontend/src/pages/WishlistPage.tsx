import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../store/wishlist';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { WishlistButton } from '../components/ui/WishlistButton';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Heart, Trash2, ArrowRight, Gamepad2, Filter,
  ShoppingCart, ShoppingBag, Grid3x3, List, SortAsc, SortDesc
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortMode = 'default' | 'price_asc' | 'price_desc' | 'recent';

const WishlistPage: React.FC = () => {
  usePageTitle('我的心愿单');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const { items: wishlistItems, removeItem, clearAll } = useWishlistStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filterVerified, setFilterVerified] = useState(false);

  const sortedItems = [...wishlistItems]
    .filter((a) => !filterVerified || a.verificationStatus === 'VERIFIED')
    .sort((a, b) => {
      if (sortMode === 'price_asc') return a.price - b.price;
      if (sortMode === 'price_desc') return b.price - a.price;
      return 0; // default: order added
    });

  const handleClearAll = () => {
    if (!confirm(`确定要清空全部 ${wishlistItems.length} 个收藏吗？`)) return;
    clearAll();
    showToast('收藏列表已清空', 'info');
  };

  const handleRemove = (id: number) => {
    removeItem(id);
    showToast('已从收藏移除', 'info');
  };

  const verifiedCount = wishlistItems.filter((a) => a.verificationStatus === 'VERIFIED').length;

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-xl font-bold mb-2">登录后查看收藏</h2>
        <p className="text-slate-500 mb-6">收藏感兴趣的账号，随时购买</p>
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
            <Heart className="w-6 h-6 text-red-400 fill-red-400" />
            我的收藏
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {wishlistItems.length > 0
              ? `${wishlistItems.length} 个收藏账号 · ${verifiedCount} 个已认证`
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

      {wishlistItems.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-slate-700" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-slate-300">收藏夹是空的</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            在账号市场浏览时，点击心形图标即可收藏感兴趣的账号
          </p>
          <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            浏览账号市场
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
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
              className="bg-dark-lighter border border-dark-border text-slate-400 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
            >
              <option value="default">默认排序</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
            </select>

            {/* Sort icon hints */}
            <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <span>共 {sortedItems.length} 个</span>
            </div>

            {/* View mode toggle */}
            <div className="flex bg-dark-lighter rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                title="网格视图"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
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
                <div key={account.id} className="card group relative">
                  {/* Wishlist btn */}
                  <div className="absolute top-2 right-2 z-10">
                    <WishlistButton account={account} size="sm" />
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
                            ✓ 已认证
                          </span>
                        </div>
                      )}
                      {/* Price overlay */}
                      <div className="absolute bottom-2 right-2">
                        <span className="text-lg font-bold text-white drop-shadow-lg">¥{account.price}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {account.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      {account.gameRank && (
                        <span className="badge badge-primary">{account.gameRank}</span>
                      )}
                      <span>🎨 {account.skinCount} 皮肤</span>
                      {account.weapons && (
                        <span className="truncate max-w-[80px]">{account.weapons}</span>
                      )}
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-dark-border">
                    <Link
                      to={`/accounts/${account.id}`}
                      className="flex-1 btn-secondary !py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      查看详情
                    </Link>
                    <button
                      onClick={() => handleRemove(account.id)}
                      className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="移除收藏"
                    >
                      <Trash2 className="w-4 h-4" />
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
                <div key={account.id} className="card flex items-center gap-4 p-4 hover:border-slate-700 transition-all group">
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
                      {account.gameRank && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">{account.gameRank}</span>
                      )}
                    </div>
                    <Link to={`/accounts/${account.id}`}>
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {account.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>🎨 {account.skinCount} 皮肤</span>
                      {account.weapons && <span className="truncate">{account.weapons}</span>}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary">¥{account.price}</p>
                    {account.rentalPrice && (
                      <p className="text-xs text-slate-500">租 ¥{account.rentalPrice}/时</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <WishlistButton account={account} size="sm" />
                    <Link
                      to={`/accounts/${account.id}`}
                      className="p-2 text-slate-500 hover:text-white hover:bg-dark rounded-lg transition-colors"
                      title="查看"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleRemove(account.id)}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="移除"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  价格区间: ¥{Math.min(...sortedItems.map((a) => a.price))}
                  — ¥{Math.max(...sortedItems.map((a) => a.price))}
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
  );
};

export default WishlistPage;
