import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Search, Filter, Gamepad2, ChevronDown } from 'lucide-react';

const AccountsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await accountApi.getList({ keyword, sort });
        setAccounts(res.data.data.records || []);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [keyword, sort]);

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
    }
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
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">加载中...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500 mb-4">暂无符合条件的账号</p>
          <Link to="/sell" className="btn-primary">
            发布账号
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default AccountsPage;
