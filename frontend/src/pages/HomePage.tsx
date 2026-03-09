import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Search, Gamepad2, Shield, Clock, Star } from 'lucide-react';

const HomePage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountApi.getList({ size: 6 });
        setAccounts(res.data.data.records || []);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-dark-lighter opacity-50" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            三角洲账号交易平台
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            安全可靠的账号交易服务 | 租售一体 | 官方担保
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/accounts" className="btn-primary px-8 py-3 text-lg">
              浏览账号
            </Link>
            <Link to="/register" className="btn-secondary px-8 py-3 text-lg">
              立即注册
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">为什么选择我们</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">安全保障</h3>
              <p className="text-gray-400 text-sm">
                官方担保交易，账号信息全程加密保护
              </p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">快速交付</h3>
              <p className="text-gray-400 text-sm">
                7×24小时在线，分钟级账号交付
              </p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">信誉保障</h3>
              <p className="text-gray-400 text-sm">
                完善的评价体系，透明交易记录
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Account List */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">热门账号</h2>
            <Link to="/accounts" className="text-primary hover:text-primary-light">
              查看更多 →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暂无账号，快去发布吧！</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <Link
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  className="card hover:border-primary transition-all duration-200 group"
                >
                  <div className="aspect-video bg-dark rounded-lg mb-4 overflow-hidden">
                    {account.images && account.images.length > 0 ? (
                      <img
                        src={account.images[0]}
                        alt={account.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-12 h-12 text-gray-700" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {account.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                    <span>{account.gameRank || '暂无段位'}</span>
                    <span>{account.skinCount} 皮肤</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ¥{account.price}
                    </span>
                    {account.rentalPrice && (
                      <span className="text-sm text-gray-500">
                        租 ¥{account.rentalPrice}/时
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
