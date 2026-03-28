import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Account } from '../types';
import { Search, Gamepad2, LayoutGrid, List, SlidersHorizontal, X, Clock, Scale, Check, ShieldCheck, Zap, Eye, User, Star, Shield, CheckCircle, ShoppingCart, ArrowRight, ExternalLink, RefreshCw, MessageCircle, AlertCircle, Keyboard, Flame, Sparkles, Crown, ArrowUpDown, Palette } from 'lucide-react';
import { AccountCardSkeleton } from '../components/ui/Skeleton';
import { WishlistButton } from '../components/ui/WishlistButton';
import { CompareBar, CompareModal } from '../components/ui/CompareBar';
import { StarRating } from '../components/ui/StarRating';
import { ScrollToTop } from '../components/ui/ScrollToTop';
import { Pagination } from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCompact } from '../utils/format';
import { useAccounts, useBuyAccount, useCreateSession } from '../hooks/useQueries';
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { currentPage, setCurrentPage, setTotalPages, goNext, goPrev, goFirst, goLast, canGoNext, canGoPrev } = usePagination();
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [quickViewAccount, setQuickViewAccount] = useState<Account | null>(null);
  const quickViewTriggerRef = useRef<HTMLElement | null>(null);
  const quickViewCloseRef = useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const buyMutation = useBuyAccount();
  const createSessionMutation = useCreateSession();

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

  // Focus trap for Quick View modal
  React.useEffect(() => {
    if (!quickViewAccount) return;
    quickViewCloseRef.current?.focus();
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !quickViewCloseRef.current) return;
      const modal = quickViewCloseRef.current.closest('[data-quickview]') as HTMLElement;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setQuickViewAccount(null); };
    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEsc);
      quickViewTriggerRef.current?.focus();
    };
  }, [quickViewAccount]);

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

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useAccounts({ page: currentPage, size: 12, keyword: debouncedKeyword, sort });
  const totalPages = data?.data?.data?.pages ?? 1;
  const totalRecords = data?.data?.data?.total ?? 0;
  const { items: recentItems } = useRecentStore();
  const recentAccounts = recentItems.slice(0, 6).map((item) => item.account); // Show max 6 recent

  React.useEffect(() => { setTotalPages(data?.data?.data?.pages ?? 1); }, [data?.data?.data?.pages, setTotalPages]);

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
    { key: '', label: '最新', icon: Sparkles },
    { key: 'price_asc', label: '价格从低到高', icon: ArrowUpDown },
    { key: 'price_desc', label: '价格从高到低', icon: ArrowUpDown },
    { key: 'skin_count', label: '皮肤数量', icon: Palette },
    { key: 'seller_credit', label: '卖家信誉', icon: Star },
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
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
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
                      <Gamepad2 className="w-6 h-6 text-slate-700" />
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : isSearching ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 bg-dark-lighter border border-dark-border px-1.5 py-0.5 rounded hover:bg-dark-lighter/80 hover:border-primary/30 transition-all">
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
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-500'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500'}`}
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
                className="px-2 py-0.5 bg-dark-lighter hover:bg-dark border border-dark-border hover:border-primary/40 rounded-full text-xs text-slate-500 hover:text-slate-300 transition-all hover:scale-105"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="relative">
          {showShortcuts && (
            <div className="absolute top-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-xl p-4 shadow-xl animate-fade-in z-20 w-52">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">键盘快捷键</p>
                <button onClick={() => setShowShortcuts(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { key: '⌘ K', desc: '打开账号市场' },
                  { key: '/', desc: '聚焦搜索框' },
                  { key: '← →', desc: '翻页' },
                  { key: 'G', desc: '切换视图' },
                  { key: 'P', desc: '回到第1页' },
                  { key: '?', desc: '显示此面板' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">{desc}</span>
                    <kbd className="px-2 py-0.5 bg-dark rounded border border-dark-border font-mono text-slate-400 flex-shrink-0">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="absolute top-2 right-2 text-xs text-slate-600 hover:text-primary transition-colors"
            title="显示键盘快捷键"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-dark-card rounded-xl border border-dark-border animate-fade-in">
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-3">价格区间</h4>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setSelectedPriceRange(range.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedPriceRange === range.key
                        ? 'bg-primary text-white'
                        : 'bg-dark-lighter text-slate-400 hover:text-white active:scale-95'
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
          <span className="text-sm text-slate-500">排序:</span>
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSortChange(option.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                sort === option.key
                  ? 'bg-primary text-white'
                  : 'bg-dark-lighter text-slate-400 hover:text-white active:scale-95'
              }`}
            >
              <span className="mr-1">{React.createElement(option.icon, { className: 'w-3.5 h-3.5' })}</span>
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              verifiedOnly
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-dark-lighter text-slate-400 hover:text-white'
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
                : 'bg-dark-lighter text-slate-400 hover:text-white'
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

      {/* Results Count + Active Filters */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-500">
              <span className="text-primary font-medium">{totalRecords}</span> 个账号
              {totalRecords < (data?.data?.data?.total || 0) && (
                <span className="text-slate-600">（共 {(data?.data?.data?.total || 0)} 个）</span>
              )}
            </p>
            {verifiedOnly && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs flex items-center gap-1 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> 已认证
                <button onClick={() => setVerifiedOnly(false)} className="ml-0.5 hover:text-emerald-300"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {rentalOnly && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1 border border-purple-500/30">
                <Clock className="w-3 h-3" /> 支持租赁
                <button onClick={() => setRentalOnly(false)} className="ml-0.5 hover:text-purple-300"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selectedPriceRange && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1 border border-blue-500/30">
                {priceRanges.find(r => r.key === selectedPriceRange)?.label || selectedPriceRange}
                <button onClick={() => setSelectedPriceRange('')} className="ml-0.5 hover:text-blue-300"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {sort && (
              <span className="px-2 py-0.5 bg-dark-lighter text-slate-400 rounded-full text-xs flex items-center gap-1 border border-dark-border">
                {sortOptions.find(o => o.key === sort)?.label || sort}
                <button onClick={() => setSort('')} className="ml-0.5 hover:text-slate-300"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                清除全部
              </button>
            )}
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            第 <span className="text-primary">{currentPage}</span>/<span>{totalPages}</span> 页
            <RefreshCw className="w-3 h-3 ml-2" />
            {dataUpdatedAt ? ` ${(() => { const d = Math.floor((Date.now() - dataUpdatedAt) / 60000); return d < 1 ? '刚刚' : d < 60 ? `${d}分钟前` : `${Math.floor(d/60)}小时前`; })()}` : ''}
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
      ) : isError ? (
        <div className="text-center py-16">
          <AlertCircle className="w-14 h-14 mx-auto mb-4 text-red-400/60" />
          <p className="text-slate-400 mb-4">加载失败，请重试</p>
          <button
            onClick={() => refetch()}
            className="btn-primary text-sm px-6"
          >
            重新加载
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 mb-4">暂无符合条件的账号</p>
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
                    <Gamepad2 className="w-10 h-10 text-slate-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-sm font-medium flex items-center gap-1">查看详情 <ChevronRight className="w-3 h-3" /></span>
                </div>
                <div className="absolute top-2 right-2">
                  <WishlistButton account={account} size="sm" />
                </div>
                {/* NEW badge */}
                {isNewAccount(account.createdAt) && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary/90 text-white text-[10px] rounded flex items-center gap-0.5 z-10">
                    <Zap className="w-3 h-3" /> NEW
                  </span>
                )}
                {/* HOT badge */}
                {((account.viewCount ?? 0) >= 100 || (account.orderCount ?? 0) >= 5) && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500/90 text-white text-[10px] rounded flex items-center gap-0.5 z-10" style={isNewAccount(account.createdAt) ? { top: '1.75rem' } : {}}>
                    <Flame className="w-3 h-3" /> 热门
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickViewTriggerRef.current = e.currentTarget as HTMLElement; setQuickViewAccount(account); }}
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
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">{account.gameType}</span>
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">{account.gameRank || '暂无'}</span>
                <span>{account.skinCount} 皮肤</span>
                {(account.viewCount != null || account.orderCount != null) && (
                  <div className="flex items-center gap-2 text-[10px]">
                    {account.viewCount != null && (
                      <span className="flex items-center gap-0.5 text-slate-600">
                        <Eye className="w-3 h-3" />{formatCompact(account.viewCount)}
                      </span>
                    )}
                    {account.orderCount != null && account.orderCount > 0 && (
                      <span className="flex items-center gap-0.5 text-slate-600">
                        <ShoppingCart className="w-3 h-3" />{account.orderCount}笔
                      </span>
                    )}
                  </div>
                )}
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
                  <span className="text-xs text-slate-500">
                    租 ¥{account.rentalPrice}/时
                    {account.deposit != null && account.deposit > 0 && <span className="text-slate-600">(+¥{account.deposit}押金)</span>}
                  </span>
                )}
              </div>
              {(account.sellerNickname || account.sellerUsername) && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {account.sellerAvatar ? (
                    <img src={account.sellerAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-dark-lighter flex items-center justify-center">
                      <User className="w-2.5 h-2.5 text-slate-600" />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-600 truncate max-w-[120px]">
                    {account.sellerNickname || account.sellerUsername}
                  </span>
                  {account.verificationStatus === 'VERIFIED' && (
                    <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                </div>
              )}
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
                    <Gamepad2 className="w-8 h-8 text-slate-700" />
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {account.title}
                  </h3>
                  {((account.viewCount ?? 0) >= 100 || (account.orderCount ?? 0) >= 5) && (
                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] rounded flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> 热门
                    </span>
                  )}
                  {account.verificationStatus === 'VERIFIED' && (
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> 已认证
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-2">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">{account.gameType}</span>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">{account.gameRank || '暂无'}</span>
                  <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-400/80" /> {account.skinCount} 皮肤</span>
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
                    <span className="text-sm text-slate-500">租 ¥{account.rentalPrice}/时</span>
                  )}
                </div>
                {/* Engagement stats */}
                {(account.viewCount != null || (account.orderCount != null && account.orderCount > 0)) && (
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5">
                    {account.viewCount != null && (
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" />{formatCompact(account.viewCount)}
                      </span>
                    )}
                    {account.orderCount != null && account.orderCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <ShoppingCart className="w-3 h-3" />{account.orderCount}笔交易
                      </span>
                    )}
                  </div>
                )}
                {/* Seller info */}
                {(account.sellerNickname || account.sellerUsername) && (
                  <div className="flex items-center gap-2 mt-2">
                    {account.sellerAvatar ? (
                      <img src={account.sellerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-dark-lighter flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                    <span className="text-xs text-slate-500">{account.sellerNickname || account.sellerUsername}</span>
                    {account.verificationStatus === 'VERIFIED' && (
                      <Shield className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onFirst={() => setCurrentPage(1)}
        onLast={() => setCurrentPage(totalPages)}
        canGoNext={currentPage < totalPages}
        canGoPrev={currentPage > 1}
      />

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
            data-quickview
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-white">快速预览</h2>
              <button ref={quickViewCloseRef} onClick={() => setQuickViewAccount(null)} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
                  {quickViewAccount.gameType && (
                    <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">{quickViewAccount.gameType}</span>
                  )}
                  <span className="px-2.5 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">{quickViewAccount.gameRank || '暂无段位'}</span>
                  <span className="px-2.5 py-1 bg-dark-lighter text-slate-400 rounded-full text-sm flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400/70" /> {quickViewAccount.skinCount} 皮肤</span>
                  {quickViewAccount.verificationStatus === 'VERIFIED' && (
                    <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 已认证</span>
                  )}
                  {quickViewAccount.status === 'ON_SALE' && (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium inline-flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> 出售中</span>
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
                      {quickViewAccount.deposit != null && quickViewAccount.deposit > 0 && (
                        <p className="text-[10px] text-slate-500 mt-0.5">押金 ¥{quickViewAccount.deposit}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '游戏类型', value: quickViewAccount.gameType || '未填写' },
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
                      <StarRating score={quickViewAccount.sellerCreditScore || 50} size="sm" showScore scoreText={`${quickViewAccount.sellerCreditScore || '—'}`} />
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
                  onClick={async () => {
                    if (!token) { navigate('/login'); return; }
                    setQuickViewAccount(null);
                    try {
                      await buyMutation.mutateAsync(quickViewAccount.id);
                      showToast('购买成功！正在跳转...', 'success');
                      setTimeout(() => navigate('/orders'), 1000);
                    } catch (err: any) {
                      showToast(err.response?.data?.message || '购买失败', 'error');
                    }
                  }}
                  disabled={buyMutation.isPending || quickViewAccount.status !== 'ON_SALE'}
                  className="btn-primary flex-1 !py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {buyMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
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
                  onClick={async () => {
                    if (!quickViewAccount?.sellerId) { showToast('无法联系卖家', 'error'); return; }
                    try {
                      const { data } = await createSessionMutation.mutateAsync({
                        accountId: quickViewAccount.id,
                        sellerId: quickViewAccount.sellerId,
                      });
                      setQuickViewAccount(null);
                      navigate(`/messages/${data.data.data.id}`);
                    } catch {
                      showToast('无法发起对话，请重试', 'error');
                    }
                  }}
                  disabled={createSessionMutation.isPending || !quickViewAccount?.sellerId}
                  className="btn-secondary !py-3 !px-3 disabled:opacity-40"
                  title="联系卖家"
                >
                  {createSessionMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    <ScrollToTop />
    </div>
  );
};

export default AccountsPage;
