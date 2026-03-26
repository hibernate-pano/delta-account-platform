import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Account } from '../types';
import { Search, Gamepad2, LayoutGrid, List, SlidersHorizontal, X, Clock, Scale, Check, ShieldCheck, Zap, Eye, User, Star, Shield, CheckCircle, ShoppingCart, ArrowRight, ExternalLink, RefreshCw, MessageCircle } from 'lucide-react';
import { AccountCardSkeleton } from '../components/ui/Skeleton';
import { WishlistButton } from '../components/ui/WishlistButton';
import { CompareBar, CompareModal } from '../components/ui/CompareBar';
import { useDebounce } from '../hooks/useDebounce';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAccounts, useBuyAccount } from '../hooks/useQueries';
import { useRecentStore } from '../store/recent';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/auth';

const AccountsPage: React.FC = () => {
  usePageTitle('账号市场');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [rentalOnly, setRentalOnly] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [compareItems, setCompareItems] = useState<Array<{ account: Account; addedAt: number }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [quickViewAccount, setQuickViewAccount] = useState<Account | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const buyMutation = useBuyAccount();

  const debouncedKeyword = useDebounce(keyword, 400);

  // Auto-sync debounced keyword to URL
  React.useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (debouncedKeyword !== searchParams.get('keyword')) {
        if (debouncedKeyword) {
          setSearchParams({ keyword: debouncedKeyword, ...(sort && { sort }) });
        } else {
          setSearchParams(sort ? { sort } : {});
        }
      }
    }, 100);
  }, [debouncedKeyword, sort]);

  // G key to toggle grid/list view
  React.useEffect(() => {
    const handler = () => setViewMode((v) => v === 'grid' ? 'list' : 'grid');
    window.addEventListener('delta:toggle-view', handler);
    return () => window.removeEventListener('delta:toggle-view', handler);
  }, []);

  // Reset to page 1 when search or sort changes

  // Keyboard shortcuts: ← → for pagination, P to reset
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }
      if (e.key === 'p') { e.preventDefault(); setCurrentPage(1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalPages]);

  // Keyboard dismiss for QuickView modal
  React.useEffect(() => {
    if (!quickViewAccount) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setQuickViewAccount(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [quickViewAccount]);

  const { data, isLoading, dataUpdatedAt } = useAccounts({ page: currentPage, size: PAGE_SIZE, keyword: debouncedKeyword, sort });
  const totalPages = data?.data?.data?.pages ?? 1;
  const totalRecords = data?.data?.data?.total ?? 0;
  const { items: recentItems } = useRecentStore();
  const recentAccounts = recentItems.slice(0, 6).map((item) => item.account); // Show max 6 recent

  const allAccounts: Account[] = data?.data?.data?.records || [];

  // Client-side price range + verified filter + rental filter + sort
  let accounts = allAccounts.filter((acc) => {
    if (verifiedOnly && acc.verificationStatus !== 'VERIFIED') return false;
    if (rentalOnly && !acc.rentalPrice) return false;
    if (selectedPriceRange) {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      if (max) return acc.price >= min && acc.price <= max;
      return acc.price >= min;
    }
    return true;
  });

  // Client-side seller credit sort (sort happens after filter, before display)
  if (sort === 'seller_credit') {
    accounts = [...accounts].sort((a, b) =>
      (b.sellerCreditScore ?? 0) - (a.sellerCreditScore ?? 0)
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword) {
      setSearchParams({ keyword });
    } else {
      setSearchParams({});
    }
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    if (keyword) {
      setSearchParams({ keyword, sort: newSort });
    } else {
      setSearchParams({ sort: newSort });
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setSort('');
    setSelectedPriceRange('');
    setVerifiedOnly(false);
    setRentalOnly(false);
    setSearchParams({});
  };

  const hasActiveFilters = keyword || sort || selectedPriceRange || verifiedOnly || rentalOnly;
  const isSearching = keyword !== debouncedKeyword;

  const toggleCompare = (account: Account) => {
    setCompareItems((prev) => {
      const exists = prev.find((i) => i.account.id === account.id);
      if (exists) return prev.filter((i) => i.account.id !== account.id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, { account, addedAt: Date.now() }];
    });
  };

  const isCompareSelected = (id: number) => compareItems.some((i) => i.account.id === id);

  const isNewAccount = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 86400000; // 24 hours
  };

  const sortOptions = [
    { key: '', label: '最新', icon: '✨' },
    { key: 'price_asc', label: '价格从低到高', icon: '⬆️' },
    { key: 'price_desc', label: '价格从高到低', icon: '⬇️' },
    { key: 'skin_count', label: '皮肤数量', icon: '🎨' },
    { key: 'seller_credit', label: '卖家信誉', icon: '⭐' },
  ];

  const priceRanges = [
    { key: '', label: '全部价格' },
    { key: '0-50', label: '¥0 - ¥50' },
    { key: '50-200', label: '¥50 - ¥200' },
    { key: '200-500', label: '¥200 - ¥500' },
    { key: '500-1000', label: '¥500 - ¥1000' },
    { key: '1000-', label: '¥1000+' },
  ];

  return (
    <div>
      {/* Recently Viewed */}
      {!isLoading && !keyword && recentAccounts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-500">最近浏览</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {recentAccounts.map((account) => (
              <Link
                key={account.id}
                to={`/accounts/${account.id}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="w-36 h-20 bg-dark rounded-lg overflow-hidden mb-2 relative">
                  {account.images?.[0] ? (
                    <img src={account.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-gray-700" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1">
                    <WishlistButton account={account} size="sm" />
                  </div>
                </div>
                <p className="text-xs text-slate-300 truncate group-hover:text-primary transition-colors">¥{account.price}</p>
                <p className="text-xs text-slate-500 truncate">{account.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索账号标题、段位..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`input w-full pl-12 pr-10 transition-all ${isSearchFocused ? 'ring-2 ring-primary/50' : ''}`}
            />
            {keyword ? (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : isSearching ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-dark-lighter px-1.5 py-0.5 rounded">
                ⌘K
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary px-6">
            搜索
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary px-4 ${showFilters ? 'border-primary' : ''}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <div className="flex bg-dark-lighter rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-500'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-500'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => { setCompareItems([]); }}
            className={`btn-secondary px-4 ${compareItems.length > 0 ? 'border-primary text-primary' : ''}`}
            title="账号对比"
          >
            <Scale className="w-5 h-5" />
            {compareItems.length > 0 && (
              <span className="ml-1 text-xs font-bold">{compareItems.length}</span>
            )}
          </button>
        </form>

        {/* Popular searches */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-slate-600">热门:</span>
            {['王者 段位', '满皮肤', '钻石', '星耀', '支持租赁'].map((chip) => (
              <button
                key={chip}
                onClick={() => setKeyword(chip)}
                className="px-2 py-0.5 bg-dark-lighter hover:bg-dark border border-dark-border hover:border-primary/40 rounded-full text-xs text-slate-500 hover:text-slate-300 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-dark-card rounded-xl border border-dark-border animate-fade-in">
            <div className="mb-4">
              <h4 className="text-sm text-gray-400 mb-3">价格区间</h4>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setSelectedPriceRange(range.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedPriceRange === range.key
                        ? 'bg-primary text-white'
                        : 'bg-dark-lighter text-gray-400 hover:text-white'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sort Pills */}
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <span className="text-sm text-gray-500">排序:</span>
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSortChange(option.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                sort === option.key
                  ? 'bg-primary text-white'
                  : 'bg-dark-lighter text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              verifiedOnly
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            认证卖家
          </button>
          <button
            onClick={() => setRentalOnly(!rentalOnly)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              rentalOnly
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            支持租赁
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all ml-auto"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            第 <span className="text-primary font-medium">{currentPage}</span> / {totalPages} 页，
            共 <span className="text-primary font-medium">{totalRecords}</span> 个账号
          </p>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {dataUpdatedAt ? `更新于 ${(() => { const d = Math.floor((Date.now() - dataUpdatedAt) / 60000); return d < 1 ? '刚刚' : d < 60 ? `${d}分钟前` : `${Math.floor(d/60)}小时前`; })()}` : ''}
          </p>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className={viewMode === 'grid'
          ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'flex flex-col gap-4'
        }>
          {[...Array(8)].map((_, i) => (
            <AccountCardSkeleton key={i} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500 mb-4">暂无符合条件的账号</p>
          {hasActiveFilters ? (
            <button onClick={clearFilters} className="btn-secondary">
              清除筛选
            </button>
          ) : (
            <Link to="/sell" className="btn-primary">
              发布账号
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
          {accounts.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.id}`}
              className="card hover:border-primary transition-all duration-200 group"
            >
              <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden relative">
                {account.images && account.images.length > 0 ? (
                  <img
                    src={account.images[0]}
                    alt={account.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-sm font-medium">查看详情 →</span>
                </div>
                <div className="absolute top-2 right-2">
                  <WishlistButton account={account} size="sm" />
                </div>
                {/* NEW badge */}
                {isNewAccount(account.createdAt) && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary/90 text-white text-[10px] rounded flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> NEW
                  </span>
                )}
                {/* Verified badge */}
                {account.verificationStatus === 'VERIFIED' && (
                  <span className="absolute left-2 bottom-2 px-1.5 py-0.5 bg-emerald-500/90 text-white text-[10px] rounded flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 已认证
                  </span>
                )}
                {/* Rental badge */}
                {account.rentalPrice && (
                  <span className="absolute left-2 bottom-2 px-1.5 py-0.5 bg-purple-500/90 text-white text-[10px] rounded flex items-center gap-0.5 ml-auto mr-2">
                    <Clock className="w-3 h-3" /> 租
                  </span>
                )}
                {/* Compare toggle */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(account); }}
                  className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all z-10 ${
                    isCompareSelected(account.id)
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  title={isCompareSelected(account.id) ? '取消对比' : '加入对比'}
                  aria-label={isCompareSelected(account.id) ? '取消对比' : '加入对比'}
                >
                  {isCompareSelected(account.id) ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                </button>
                {/* Quick view button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewAccount(account); }}
                  className="absolute top-2 right-8 w-7 h-7 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-primary"
                  title="快速查看"
                  aria-label="快速查看"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-1">
                {account.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="px-2 py-1 bg-dark rounded">{account.gameRank || '暂无'}</span>
                <span>{account.skinCount} 皮肤</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">¥{account.price}</span>
                {account.sellerCreditScore && (
                  <span className="text-[10px] text-yellow-400/80 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400/80 text-yellow-400/80" />
                    {account.sellerCreditScore}
                  </span>
                )}
                {account.rentalPrice && (
                  <span className="text-xs text-gray-500">租 ¥{account.rentalPrice}/时</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 stagger-children">
          {accounts.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.id}`}
              className="card flex gap-4 hover:border-primary transition-all group"
            >
              <div className="w-40 h-28 bg-dark rounded-lg overflow-hidden flex-shrink-0 relative">
                {account.images && account.images.length > 0 ? (
                  <img
                    src={account.images[0]}
                    alt={account.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="w-8 h-8 text-gray-700" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <WishlistButton account={account} size="sm" />
                </div>
                {/* Compare toggle */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(account); }}
                  className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all z-10 ${
                    isCompareSelected(account.id)
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  title={isCompareSelected(account.id) ? '取消对比' : '加入对比'}
                  aria-label={isCompareSelected(account.id) ? '取消对比' : '加入对比'}
                >
                  {isCompareSelected(account.id) ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex-1 py-1">
                <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                  {account.title}
                </h3>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-2">
                  <span className="px-2 py-0.5 bg-dark rounded">{account.gameRank || '暂无'}</span>
                  <span>👑 {account.skinCount} 皮肤</span>
                  {account.description && (
                    <span className="line-clamp-1">{account.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-primary">¥{account.price}</span>
                  {account.sellerCreditScore && (
                    <span className="text-xs text-yellow-400/80 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-400/80 text-yellow-400/80" />
                      {account.sellerCreditScore}分
                    </span>
                  )}
                  {account.rentalPrice && (
                    <span className="text-sm text-gray-500">租 ¥{account.rentalPrice}/时</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30"
          >
            首页
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30"
          >
            上一页
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-dark-lighter text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30"
          >
            下一页
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="btn-ghost !px-3 !py-1.5 text-sm disabled:opacity-30"
          >
            末页
          </button>
        </div>
      )}

      {/* Compare floating bar */}
      <CompareBar
        items={compareItems}
        onRemove={(id) => setCompareItems((prev) => prev.filter((i) => i.account.id !== id))}
        onClear={() => setCompareItems([])}
        onCompare={() => setShowCompareModal(true)}
        maxItems={4}
      />

      {/* Compare modal */}
      {showCompareModal && compareItems.length >= 2 && (
        <CompareModal
          items={compareItems}
          onClose={() => setShowCompareModal(false)}
          onViewAccount={(id) => navigate(`/accounts/${id}`)}
        />
      )}

      {/* Quick View Modal */}
      {quickViewAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setQuickViewAccount(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-white">快速预览</h2>
              <button onClick={() => setQuickViewAccount(null)} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Images */}
              <div className="aspect-video bg-dark rounded-xl overflow-hidden">
                {quickViewAccount.images && quickViewAccount.images.length > 0 ? (
                  <img src={quickViewAccount.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="w-16 h-16 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{quickViewAccount.title}</h3>
                  <WishlistButton account={quickViewAccount} size="md" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">{quickViewAccount.gameRank || '暂无段位'}</span>
                  <span className="px-2.5 py-1 bg-dark-lighter text-slate-400 rounded-full text-sm">🎨 {quickViewAccount.skinCount} 皮肤</span>
                  {quickViewAccount.verificationStatus === 'VERIFIED' && (
                    <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">✓ 已认证</span>
                  )}
                  {quickViewAccount.status === 'ON_SALE' && (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">🔥 出售中</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="card bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">一口价</p>
                    <p className="text-3xl font-bold text-primary">¥{quickViewAccount.price}</p>
                  </div>
                  {quickViewAccount.rentalPrice && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">时租价</p>
                      <p className="text-xl font-semibold text-purple-400">¥{quickViewAccount.rentalPrice}/时</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '游戏段位', value: quickViewAccount.gameRank || '未填写' },
                  { label: '皮肤数量', value: `${quickViewAccount.skinCount} 个` },
                  { label: '装备描述', value: quickViewAccount.weapons || '未填写' },
                  { label: '发布时间', value: quickViewAccount.createdAt ? new Date(quickViewAccount.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : '未知' },
                ].map((item) => (
                  <div key={item.label} className="bg-dark rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {quickViewAccount.description && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">详细描述</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{quickViewAccount.description}</p>
                </div>
              )}

              {/* Seller info */}
              {quickViewAccount.sellerId && (
                <div className="p-3 bg-dark rounded-xl border border-dark-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                    {quickViewAccount.sellerAvatar ? (
                      <img src={quickViewAccount.sellerAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{quickViewAccount.sellerNickname || quickViewAccount.sellerUsername || '卖家'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round((quickViewAccount.sellerCreditScore || 50) / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                      ))}
                      <span className="text-xs text-yellow-400 ml-1">{quickViewAccount.sellerCreditScore || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-3 h-3 text-green-400" />平台托管
                    <CheckCircle className="w-3 h-3 text-blue-400" />账号认证
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { if (!token) { navigate('/login'); return; } buyMutation.mutate(quickViewAccount.id); setQuickViewAccount(null); setTimeout(() => navigate('/orders'), 1000); showToast('购买成功！正在跳转...', 'success'); }}
                  disabled={buyMutation.isPending || quickViewAccount.status !== 'ON_SALE'}
                  className="btn-primary flex-1 !py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  立即购买
                </button>
                <button
                  onClick={() => { setQuickViewAccount(null); navigate(`/accounts/${quickViewAccount.id}`); }}
                  className="btn-secondary flex-1 !py-3 text-sm flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  查看详情
                </button>
                <button
                  onClick={() => { /* open chat - just show toast for now */ showToast('请先进入账号详情页联系卖家', 'info'); }}
                  className="btn-secondary !py-3 !px-3"
                  title="联系卖家"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
