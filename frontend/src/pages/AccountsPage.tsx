import React, { useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Account } from '../types';
import { Search, Gamepad2, LayoutGrid, List, SlidersHorizontal, X, Clock, Scale, Check } from 'lucide-react';
import { AccountCardSkeleton } from '../components/ui/Skeleton';
import { WishlistButton } from '../components/ui/WishlistButton';
import { CompareBar, CompareModal } from '../components/ui/CompareBar';
import { useDebounce } from '../hooks/useDebounce';
import { useAccounts } from '../hooks/useQueries';
import { useRecentStore } from '../store/recent';

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [compareItems, setCompareItems] = useState<Array<{ account: Account; addedAt: number }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;
  const [showCompareModal, setShowCompareModal] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Reset to page 1 when search or sort changes
  React.useEffect(() => { setCurrentPage(1); }, [debouncedKeyword, sort]);

  const { data, isLoading } = useAccounts({ page: currentPage, size: PAGE_SIZE, keyword: debouncedKeyword, sort });
  const totalPages = data?.data?.data?.pages ?? 1;
  const totalRecords = data?.data?.data?.total ?? 0;
  const { items: recentItems } = useRecentStore();
  const recentAccounts = recentItems.slice(0, 6); // Show max 6 recent

  const allAccounts: Account[] = data?.data?.data?.records || [];

  // Client-side price range filter
  const accounts = selectedPriceRange
    ? allAccounts.filter((acc) => {
        const [min, max] = selectedPriceRange.split('-').map(Number);
        return max ? acc.price >= min && acc.price <= max : acc.price >= min;
      })
    : allAccounts;

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
    setSearchParams({});
  };

  const hasActiveFilters = keyword || sort || selectedPriceRange;
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

  const sortOptions = [
    { key: '', label: '最新', icon: '✨' },
    { key: 'price_asc', label: '价格从低到高', icon: '⬆️' },
    { key: 'price_desc', label: '价格从高到低', icon: '⬇️' },
    { key: 'skin_count', label: '皮肤数量', icon: '🎨' },
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
        <p className="text-sm text-gray-500 mb-4">
          第 <span className="text-primary font-medium">{currentPage}</span> / {totalPages} 页，
          共 <span className="text-primary font-medium">{totalRecords}</span> 个账号
        </p>
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
                {/* Compare toggle */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(account); }}
                  className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all z-10 ${
                    isCompareSelected(account.id)
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  title={isCompareSelected(account.id) ? '取消对比' : '加入对比'}
                >
                  {isCompareSelected(account.id) ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
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
    </div>
  );
};

export default AccountsPage;
