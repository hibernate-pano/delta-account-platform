import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Search, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';
import { GridSkeleton } from '../components/ui/Skeleton';

const PAGE_SIZE_OPTIONS = [12, 24, 48];

const AccountsPage: React.FC = () => {
  usePageTitle('账号市场');
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [gameRank, setGameRank] = useState(searchParams.get('gameRank') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('size')) || 12);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await accountApi.getList({
          keyword: searchKeyword || undefined,
          sort: sort || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          gameRank: gameRank || undefined,
          page,
          size: pageSize,
        });
        const data = res.data.data;
        setAccounts(data.records || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (error: any) {
        toast('error', error.response?.data?.message || '加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [searchKeyword, sort, minPrice, maxPrice, gameRank, page, pageSize]);

  const syncParams = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = {};
    const merged = { keyword: searchKeyword, sort, minPrice, maxPrice, gameRank, page, pageSize, ...overrides };
    if (merged.keyword) params.keyword = String(merged.keyword);
    if (merged.sort) params.sort = String(merged.sort);
    if (merged.minPrice) params.minPrice = String(merged.minPrice);
    if (merged.maxPrice) params.maxPrice = String(merged.maxPrice);
    if (merged.gameRank) params.gameRank = String(merged.gameRank);
    if (Number(merged.page) > 1) params.page = String(merged.page);
    if (Number(merged.pageSize) !== 12) params.size = String(merged.pageSize);
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(keyword);
    setPage(1);
    syncParams({ keyword, page: 1 });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
    syncParams({ sort: newSort, page: 1 });
  };

  const handleFilterApply = () => {
    setPage(1);
    syncParams({ page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    syncParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    syncParams({ size: newSize, page: 1 });
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && page > 1) {
      handlePageChange(page - 1);
    } else if (e.key === 'ArrowRight' && page < totalPages) {
      handlePageChange(page + 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setGameRank('');
    setPage(1);
    syncParams({ minPrice: '', maxPrice: '', gameRank: '', page: 1 });
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索账号标题、段位..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input w-full pl-12"
            />
          </div>
          <button type="submit" className="btn-primary px-8">
            搜索
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => handleSortChange('')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              !sort ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            最新
          </button>
          <button
            onClick={() => handleSortChange('price_asc')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              sort === 'price_asc' ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            价格从低到高
          </button>
          <button
            onClick={() => handleSortChange('price_desc')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              sort === 'price_desc' ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            价格从高到低
          </button>
          <button
            onClick={() => handleSortChange('skin_count')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              sort === 'skin_count' ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            皮肤数量
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-wrap items-end gap-3 mt-4 p-4 bg-dark-lighter rounded-lg">
          <div>
            <label className="block text-xs text-gray-500 mb-1">最低价格</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input w-28 text-sm"
              placeholder="¥0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">最高价格</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input w-28 text-sm"
              placeholder="¥不限"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">段位</label>
            <select
              value={gameRank}
              onChange={(e) => setGameRank(e.target.value)}
              className="input w-28 text-sm"
            >
              <option value="">全部</option>
              <option value="青铜">青铜</option>
              <option value="白银">白银</option>
              <option value="黄金">黄金</option>
              <option value="铂金">铂金</option>
              <option value="钻石">钻石</option>
              <option value="大师">大师</option>
              <option value="王者">王者</option>
            </select>
          </div>
          <button onClick={handleFilterApply} className="btn-primary text-sm px-4 py-2">筛选</button>
          {(minPrice || maxPrice || gameRank) && (
            <button onClick={handleResetFilters} className="text-sm text-gray-400 hover:text-white px-3 py-2">重置</button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <GridSkeleton count={8} />
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500 mb-4">暂无符合条件的账号</p>
          <Link to="/sell" className="btn-primary">
            发布账号
          </Link>
        </div>
      ) : (
        <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accounts.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.id}`}
              className="card hover:border-primary transition-all duration-200 group"
            >
              <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden">
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
                  <span className="text-xs text-gray-500">
                    租 ¥{account.rentalPrice}/时
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages >= 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            {/* Results info and page size */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>共 {total} 个结果</span>
              <div className="flex items-center gap-2">
                <span>每页</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="input py-1 px-2 text-sm bg-dark-lighter"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>条</span>
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-dark-lighter text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | 'gap')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('gap');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'gap' ? (
                    <span key={`gap-${idx}`} className="px-2 text-gray-600">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item as number)}
                      className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                        page === item ? 'bg-primary text-white' : 'bg-dark-lighter text-gray-400 hover:text-white'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-dark-lighter text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default AccountsPage;
