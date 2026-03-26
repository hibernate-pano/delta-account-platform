import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoriteApi } from '../api';
import { Account } from '../types';
import { Gamepad2, Heart, Trash2, X } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';
import { GridSkeleton } from '../components/ui/Skeleton';

const FavoritesPage: React.FC = () => {
  usePageTitle('我的收藏');
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await favoriteApi.getMyList();
        setAccounts(res.data.data || []);
      } catch (error: any) {
        showToast(error.response?.data?.message || '加载失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (e: React.MouseEvent, accountId: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(accountId);
    try {
      await favoriteApi.toggle(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      showToast(`已取消收藏「${title}」`, 'success');
    } catch {
      showToast('移除失败，请重试', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    if (accounts.length === 0) return;
    try {
      await Promise.all(accounts.map((a) => favoriteApi.toggle(a.id)));
      setAccounts([]);
      showToast(`已清空全部 ${accounts.length} 个收藏`, 'success');
    } catch {
      showToast('清空失败，请重试', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的收藏</h1>
        </div>
        <GridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">我的收藏</h1>
          <span className="px-2.5 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
            {accounts.length} 个
          </span>
        </div>
        {accounts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
            清空全部
          </button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500 mb-4">暂无收藏的账号</p>
          <Link to="/accounts" className="btn-primary">
            浏览账号市场
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
                <button
                  onClick={(e) => handleRemove(e, account.id, account.title)}
                  disabled={removingId === account.id}
                  className="absolute top-2 right-2 w-7 h-7 bg-dark/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  title="取消收藏"
                >
                  {removingId === account.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white" />
                  )}
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

export default FavoritesPage;
