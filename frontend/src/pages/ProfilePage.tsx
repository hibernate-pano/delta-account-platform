import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, accountApi, orderApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import {
  User, Package, FileText, LogOut, Settings, ChevronRight,
  Star, Shield, TrendingUp, Gamepad2, CheckCircle, Clock
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'orders' | 'stats'>('accounts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [profileRes, accountsRes, ordersRes] = await Promise.all([
        authApi.getProfile().catch(() => ({ data: { data: null } })),
        accountApi.getList({ size: 100 }),
        orderApi.getMyOrders()
      ]);
      setProfile(profileRes.data.data);
      const allAccounts = accountsRes.data.data.records || [];
      setAccounts(allAccounts.filter((a: any) => a.sellerId === profileRes.data.data?.id));
      setOrders(ordersRes.data.data.records || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('已安全退出登录', 'success');
    navigate('/');
  };

  const stats = {
    totalAccounts: accounts.length,
    onSale: accounts.filter((a) => a.status === 'ON_SALE').length,
    sold: accounts.filter((a) => a.status === 'SOLD').length,
    totalOrders: orders.length,
    completedOrders: orders.filter((o) => o.status === 'COMPLETED').length,
    creditScore: profile?.creditScore || user?.creditScore || 100,
  };

  const getCreditLevel = (score: number) => {
    if (score >= 90) return { label: '卓越', color: 'text-yellow-400', icon: Star };
    if (score >= 70) return { label: '优秀', color: 'text-green-400', icon: TrendingUp };
    if (score >= 50) return { label: '良好', color: 'text-blue-400', icon: CheckCircle };
    return { label: '一般', color: 'text-slate-400', icon: Clock };
  };

  const creditLevel = getCreditLevel(stats.creditScore);
  const CreditIcon = creditLevel.icon;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl md:text-2xl font-bold">
                  {profile?.nickname || user?.nickname || user?.username}
                </h2>
                {profile?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    管理员
                  </span>
                )}
              </div>
              <p className="text-slate-500">@{profile?.username || user?.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Credit Score */}
            <div className="card-static p-3 text-center">
              <div className={`flex items-center justify-center gap-1 mb-1 ${creditLevel.color}`}>
                <CreditIcon className="w-4 h-4" />
                <span className="font-bold">{stats.creditScore}</span>
              </div>
              <p className="text-xs text-slate-500">信誉分 · {creditLevel.label}</p>
            </div>

            {/* Balance */}
            <div className="card-static p-3 text-center">
              <p className="text-xl font-bold text-primary">¥{(profile?.balance || user?.balance || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-500">账户余额</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'accounts', label: '我的账号', icon: Package, count: stats.totalAccounts },
          { key: 'orders', label: '订单记录', icon: FileText, count: stats.totalOrders },
          { key: 'stats', label: '数据统计', icon: TrendingUp, count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-dark'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="card">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 skeleton rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-32 skeleton rounded mb-2" />
                  <div className="h-3 w-48 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">发布的账号</h3>
                <Link to="/sell" className="btn-primary text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  发布新账号
                </Link>
              </div>

              {accounts.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gamepad2 className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-400">暂无发布的账号</h3>
                  <p className="text-slate-600 mb-6">发布你的第一个账号开始变现</p>
                  <Link to="/sell" className="btn-primary inline-flex items-center gap-2">
                    立即发布
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="card hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden">
                        {account.images?.[0] ? (
                          <img
                            src={account.images[0]}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-8 h-8 text-slate-700" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {account.title}
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">¥{account.price}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          account.status === 'ON_SALE' ? 'bg-green-500/20 text-green-400' :
                          account.status === 'SOLD' ? 'bg-slate-500/20 text-slate-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {account.status === 'ON_SALE' ? '🔥 出售中' :
                           account.status === 'SOLD' ? '✓ 已出售' : account.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-400">暂无订单记录</h3>
                  <p className="text-slate-600 mb-6">开始购买或租赁账号吧</p>
                  <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
                    去逛逛
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="card flex items-center gap-4 hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => navigate(`/accounts/${order.accountId}`)}
                    >
                      <div className="w-12 h-12 bg-dark rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          订单 #{order.orderNo.slice(-8)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {order.type === 'BUY' ? '购买' : '租赁'} · {order.createdAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">¥{order.amount.toFixed(2)}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {order.status === 'COMPLETED' ? '已完成' :
                           order.status === 'PENDING' ? '待支付' : order.status}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  账号统计
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">发布总数</span>
                    <span className="font-medium">{stats.totalAccounts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">正在出售</span>
                    <span className="font-medium text-green-400">{stats.onSale}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">已成功售出</span>
                    <span className="font-medium text-blue-400">{stats.sold}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  订单统计
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">订单总数</span>
                    <span className="font-medium">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">已完成</span>
                    <span className="font-medium text-green-400">{stats.completedOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">完成率</span>
                    <span className="font-medium text-blue-400">
                      {stats.totalOrders > 0
                        ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(0)}%`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <h3 className="text-sm text-slate-500 mb-4">快捷操作</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/wallet" className="btn-secondary text-sm flex items-center gap-2">
            <Package className="w-4 h-4" />
            充值
          </Link>
          <Link to="/accounts" className="btn-secondary text-sm flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            浏览市场
          </Link>
          <button
            onClick={handleLogout}
            className="btn-secondary text-sm flex items-center gap-2 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
