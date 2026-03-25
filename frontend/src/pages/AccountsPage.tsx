import React, { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Account } from '../types';
import { Search, Gamepad2, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { AccountCardSkeleton } from '../components/ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { useAccounts } from '../hooks/useQueries';

const AccountsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  const { data, isLoading } = useAccounts({ keyword: debouncedKeyword, sort });

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
          共找到 <span className="text-primary font-medium">{accounts.length}</span> 个账号
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
              <div className="w-40 h-28 bg-dark rounded-lg overflow-hidden flex-shrink-0">
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
    </div>
  );
};

export default AccountsPage;
