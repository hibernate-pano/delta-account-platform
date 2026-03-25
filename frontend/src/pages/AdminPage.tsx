import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Users, Package, FileText, Shield, RefreshCw, DollarSign,
  TrendingUp, TrendingDown, UserCheck, UserX, CheckCircle, XCircle,
  Clock, AlertTriangle, BarChart3, ArrowRight, Eye
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'orders' | 'users'>('overview');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, [token, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulated data - in production this would call real API
      setStats({
        totalUsers: 156,
        activeUsers: 142,
        bannedUsers: 3,
        totalAccounts: 89,
        pendingAccounts: 12,
        verifiedAccounts: 67,
        soldAccounts: 45,
        totalOrders: 234,
        completedOrders: 198,
        cancelledOrders: 12,
        totalRevenue: 125680,
        monthlyRevenue: 28650,
        withdrawalPending: 3200,
      });
      setPendingAccounts([
        { id: 1, title: '满皮肤钻石账号', seller: 'seller1', price: 999, createdAt: '2026-03-24' },
        { id: 2, title: '星耀段位账号 · 50皮肤', seller: 'seller2', price: 1999, createdAt: '2026-03-23' },
        { id: 3, title: '王者低星账号', seller: 'seller3', price: 2999, createdAt: '2026-03-22' },
        { id: 4, title: '传说皮肤账号', seller: 'seller4', price: 4999, createdAt: '2026-03-21' },
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (accountId: number, approved: boolean) => {
    setActionLoading(accountId);
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPendingAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setStats((prev: any) => ({
        ...prev,
        pendingAccounts: prev.pendingAccounts - 1,
        verifiedAccounts: approved ? prev.verifiedAccounts + 1 : prev.verifiedAccounts,
      }));
      showToast(approved ? '账号已通过审核' : '账号已拒绝', approved ? 'success' : 'warning');
    } catch (error) {
      showToast('操作失败，请重试', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: number, ban: boolean) => {
    try {
      showToast(ban ? '用户已封禁' : '用户已解封', ban ? 'warning' : 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  if (!token || user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">权限不足</h2>
        <p className="text-slate-500 mb-6">您没有权限访问管理后台</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          返回首页
        </button>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color, sublabel }: any) => (
    <div className="card hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sublabel && <div className="text-xs text-slate-600 mt-1">{sublabel}</div>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            管理后台
          </h1>
          <p className="text-sm text-slate-500 mt-1">欢迎回来，{user?.username}</p>
        </div>
        <button onClick={fetchData} className="btn-ghost p-2" title="刷新数据">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'overview', label: '数据概览', icon: BarChart3 },
          { key: 'accounts', label: '账号审核', icon: Package },
          { key: 'orders', label: '订单管理', icon: FileText },
          { key: 'users', label: '用户管理', icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-28">
              <div className="h-10 w-10 skeleton rounded-xl mb-3" />
              <div className="h-6 w-20 skeleton rounded mb-2" />
              <div className="h-3 w-16 skeleton rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {!loading && activeTab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="用户总数"
              value={stats.totalUsers}
              color="bg-primary/20 text-primary"
              sublabel={`活跃 ${stats.activeUsers}`}
            />
            <StatCard
              icon={Package}
              label="账号总数"
              value={stats.totalAccounts}
              color="bg-blue-500/20 text-blue-400"
              sublabel={`待审 ${stats.pendingAccounts}`}
            />
            <StatCard
              icon={FileText}
              label="订单总数"
              value={stats.totalOrders}
              color="bg-green-500/20 text-green-400"
              sublabel={`完成 ${stats.completedOrders}`}
            />
            <StatCard
              icon={DollarSign}
              label="总收入"
              value={`¥${stats.totalRevenue.toLocaleString()}`}
              color="bg-emerald-500/20 text-emerald-400"
              sublabel={`本月 ¥${stats.monthlyRevenue.toLocaleString()}`}
            />
          </div>

          {/* Charts placeholder */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                账户状态分布
              </h3>
              <div className="space-y-3">
                {[
                  { label: '已认证账号', value: stats.verifiedAccounts, total: stats.totalAccounts, color: 'bg-green-500' },
                  { label: '待审核账号', value: stats.pendingAccounts, total: stats.totalAccounts, color: 'bg-yellow-500' },
                  { label: '已售出账号', value: stats.soldAccounts, total: stats.totalAccounts, color: 'bg-blue-500' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 bg-dark-lighter rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${(item.value / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                订单状态分布
              </h3>
              <div className="space-y-3">
                {[
                  { label: '已完成', value: stats.completedOrders, total: stats.totalOrders, color: 'bg-green-500' },
                  { label: '进行中', value: stats.totalOrders - stats.completedOrders - stats.cancelledOrders, total: stats.totalOrders, color: 'bg-blue-500' },
                  { label: '已取消', value: stats.cancelledOrders, total: stats.totalOrders, color: 'bg-slate-500' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 bg-dark-lighter rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${(item.value / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Accounts Tab */}
      {!loading && activeTab === 'accounts' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              待审核账号
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                {pendingAccounts.length}
              </span>
            </h2>
          </div>

          {pendingAccounts.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/50" />
              <h3 className="text-lg font-medium mb-2 text-slate-400">太棒了！</h3>
              <p className="text-slate-600">暂无待审核的账号</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-4 bg-dark-lighter rounded-xl hover:bg-dark-lighter/80 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.title}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span>卖家: {account.seller}</span>
                      <span className="text-primary font-medium">¥{account.price}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {account.createdAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/accounts/${account.id}`)}
                      className="p-2 text-slate-500 hover:text-white hover:bg-dark rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleVerify(account.id, true)}
                      disabled={actionLoading === account.id}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === account.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      通过
                    </button>
                    <button
                      onClick={() => handleVerify(account.id, false)}
                      disabled={actionLoading === account.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {!loading && activeTab === 'orders' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            订单管理
          </h2>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">订单管理功能</h3>
            <p className="text-slate-600 text-sm mb-6">完整的订单管理界面正在开发中</p>
            <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
              查看我的订单
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {!loading && activeTab === 'users' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            用户管理
          </h2>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">用户管理功能</h3>
            <p className="text-slate-600 text-sm">用户列表和封禁管理功能正在开发中</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
