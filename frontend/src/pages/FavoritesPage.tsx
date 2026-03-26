import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Heart, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';
import { GridSkeleton } from '../components/ui/Skeleton';
import { useFavorites, useToggleFavorite } from '../hooks/useQueries';
import { Account } from '../types';

const FavoritesPage: React.FC = () => {
  usePageTitle('我的收藏');
  const { showToast } = useToast();
  const { data, isLoading, isError, refetch } = useFavorites();
  const toggleMutation = useToggleFavorite();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const accounts: Account[] = data?.data?.data || [];

  const handleRemove = async (e: React.MouseEvent, accountId: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(accountId);
    try {
      await toggleMutation.mutateAsync(accountId);
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
      await Promise.all(accounts.map((a) => toggleMutation.mutateAsync(a.id)));
      showToast(`已清空全部 ${accounts.length} 个收藏`, 'success');
    } catch {
      showToast('清空失败，请重试', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的收藏</h1>
        </div>
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的收藏</h1>
        </div>
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-slate-300">加载收藏失败</h3>
          <p className="text-slate-600 text-sm mb-6">无法获取收藏列表，请检查网络后重试</p>
          <button
            onClick={() => refetch()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
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
        <div className="text-center py-20 animate-fade-in">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            {/* Heart outline illustration */}
            <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="64" cy="64" r="56" fill="rgba(99,102,241,0.06)" />
              <circle cx="64" cy="64" r="48" fill="rgba(99,102,241,0.04)" />
              <path
                d="M64 96C64 96 28 74 28 52C28 38 38 28 52 28C58 28 63 30.5 64 34C65 30.5 70 28 76 28C90 28 100 38 100 52C100 74 64 96 64 96Z"
                fill="none"
                stroke="rgba(99,102,241,0.25)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Sparkles */}
              <circle cx="32" cy="36" r="2" fill="rgba(139,92,246,0.3)" />
              <circle cx="96" cy="40" r="1.5" fill="rgba(139,92,246,0.25)" />
              <circle cx="24" cy="72" r="1" fill="rgba(139,92,246,0.2)" />
              <circle cx="104" cy="80" r="2" fill="rgba(139,92,246,0.2)" />
              {/* X marks */}
              <path d="M46 58L58 70M58 58L46 70" stroke="rgba(239,68,68,0.35)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-300">还没有收藏任何账号</h3>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">
            看到心仪的账号，点个心形图标收藏起来，方便随时查看对比
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              浏览账号市场
            </Link>
            <Link to="/recent" className="btn-secondary inline-flex items-center gap-2">
              查看最近浏览
            </Link>
          </div>
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
