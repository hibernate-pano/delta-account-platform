import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { useAdminStats, useAdminAccounts, useVerifyAccount, useBanUser } from '../hooks/useQueries';
import {
  Users, Package, FileText, Shield, RefreshCw, DollarSign,
  CheckCircle, XCircle, Clock, BarChart3, ArrowRight, Eye, RefreshCcw
} from 'lucide-react';

interface PendingAccount {
  id: number;
  title: string;
  price: number;
  createdAt: string;
  seller?: { username: string; nickname?: string };
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'orders' | 'users'>('overview');

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: accountsData, isLoading: accountsLoading } = useAdminAccounts({ status: 'PENDING', size: 20 });
  const verifyMutation = useVerifyAccount();
  const banMutation = useBanUser();

  const stats = statsData?.data?.data;
  const pendingAccounts: PendingAccount[] = accountsData?.data?.data?.records || [];

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

  const StatCard = ({ icon: Icon, label, value, color, sublabel }: {
    icon: React.ElementType; label: string; value: string | number; color: string; sublabel?: string;
  }) => (
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
        <button
          onClick={() => refetchStats()}
          className="btn-ghost p-2"
          title="刷新数据"
        >
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
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card h-28">
                  <div className="h-10 w-10 skeleton rounded-xl mb-3" />
                  <div className="h-6 w-20 skeleton rounded mb-2" />
                  <div className="h-3 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={Users}
                  label="用户总数"
                  value={stats.totalUsers ?? 0}
                  color="bg-primary/20 text-primary"
                  sublabel={`活跃 ${stats.activeUsers ?? 0}`}
                />
                <StatCard
                  icon={Package}
                  label="账号总数"
                  value={stats.totalAccounts ?? 0}
                  color="bg-blue-500/20 text-blue-400"
                  sublabel={`待审 ${stats.pendingAccounts ?? 0}`}
                />
                <StatCard
                  icon={FileText}
                  label="订单总数"
                  value={stats.totalOrders ?? 0}
                  color="bg-green-500/20 text-green-400"
                  sublabel={`完成 ${stats.completedOrders ?? 0}`}
                />
                <StatCard
                  icon={DollarSign}
                  label="总收入"
                  value={`¥${(stats.totalRevenue ?? 0).toLocaleString()}`}
                  color="bg-emerald-500/20 text-emerald-400"
                  sublabel={`本月 ¥${(stats.monthlyRevenue ?? 0).toLocaleString()}`}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="card">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    账户状态分布
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: '已认证账号', value: stats.verifiedAccounts ?? 0, total: stats.totalAccounts ?? 1, color: 'bg-green-500' },
                      { label: '待审核账号', value: stats.pendingAccounts ?? 0, total: stats.totalAccounts ?? 1, color: 'bg-yellow-500' },
                      { label: '已售出账号', value: stats.soldAccounts ?? 0, total: stats.totalAccounts ?? 1, color: 'bg-blue-500' },
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
                      { label: '已完成', value: stats.completedOrders ?? 0, total: stats.totalOrders ?? 1, color: 'bg-green-500' },
                      { label: '进行中', value: (stats.totalOrders ?? 0) - (stats.completedOrders ?? 0) - (stats.cancelledOrders ?? 0), total: stats.totalOrders ?? 1, color: 'bg-blue-500' },
                      { label: '已取消', value: stats.cancelledOrders ?? 0, total: stats.totalOrders ?? 1, color: 'bg-slate-500' },
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
          ) : (
            <div className="card text-center py-12">
              <p className="text-slate-500">加载平台数据中...</p>
            </div>
          )}
        </>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
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

          {accountsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 skeleton rounded-xl" />
              ))}
            </div>
          ) : pendingAccounts.length === 0 ? (
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
                      <span>卖家: {account.seller?.nickname || account.seller?.username || '-'}</span>
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
                      onClick={() =>
                        verifyMutation.mutate(
                          { id: account.id, approved: true },
                          {
                            onSuccess: () => showToast('账号已通过审核', 'success'),
                            onError: () => showToast('操作失败', 'error'),
                          }
                        )
                      }
                      disabled={verifyMutation.isPending}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {verifyMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      通过
                    </button>
                    <button
                      onClick={() =>
                        verifyMutation.mutate(
                          { id: account.id, approved: false },
                          {
                            onSuccess: () => showToast('账号已拒绝', 'warning'),
                            onError: () => showToast('操作失败', 'error'),
                          }
                        )
                      }
                      disabled={verifyMutation.isPending}
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
      {activeTab === 'orders' && (
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
      {activeTab === 'users' && (
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
