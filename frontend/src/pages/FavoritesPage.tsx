import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoriteApi } from '../api';
import { Account } from '../types';
import { Gamepad2, Heart } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';
import { GridSkeleton } from '../components/ui/Skeleton';

const FavoritesPage: React.FC = () => {
  usePageTitle('我的收藏');
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await favoriteApi.getMyList();
        setAccounts(res.data.data || []);
      } catch (error: any) {
        toast('error', error.response?.data?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">我的收藏</h1>
        <GridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">我的收藏</h1>

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

export default FavoritesPage;
