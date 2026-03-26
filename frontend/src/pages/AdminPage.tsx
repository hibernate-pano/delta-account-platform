import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAdminStats, useAdminAccounts, useAdminOrders, useAdminUsers, useVerifyAccount, useBanUser } from '../hooks/useQueries';
import {
  Users, Package, FileText, Shield, RefreshCw, Star,
  CheckCircle, XCircle, Clock, BarChart3, ArrowRight, Eye,
  TrendingDown, AlertTriangle, Ban, ChevronDown,
  Activity, Zap, ArrowUpRight
} from 'lucide-react';

interface PendingAccount {
  id: number; title: string; price: number; createdAt: string;
  gameType?: string;
  seller?: { username: string; nickname?: string };
}

// Donut chart component
const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[]; size?: number }> = ({
  segments, size = 160,
}) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="w-40 h-40 rounded-full bg-dark-lighter flex items-center justify-center text-slate-600 text-sm">暂无数据</div>;

  const cx = size / 2, cy = size / 2, r = size / 2 - 12;
  const circumference = 2 * Math.PI * r;
  let cumulativeOffset = 0;

  const paths = segments.map((seg, i) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = cumulativeOffset;
    cumulativeOffset += dash;
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={20}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        className="transition-all duration-700 hover:opacity-80"
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {paths}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-slate-500">总计</span>
      </div>
    </div>
  );
};

// Platform health indicator
const HealthCard: React.FC<{ stats: any }> = ({ stats }) => {
  const issues = [];
  if ((stats?.pendingAccounts ?? 0) > 5) issues.push({ icon: Clock, label: '待审核积压', color: 'text-yellow-400', bg: 'bg-yellow-500/20' });
  if ((stats?.alertAccounts ?? 0) > 0) issues.push({ icon: AlertTriangle, label: '异常账号', color: 'text-red-400', bg: 'bg-red-500/20' });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-green-400" />
        <span className="font-medium text-sm text-slate-300">平台健康</span>
        <span className="ml-auto text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          运行正常
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '系统可用性', value: '99.9%', color: 'text-green-400' },
          { label: '平均响应', value: '<200ms', color: 'text-blue-400' },
          { label: '在线用户', value: stats?.onlineUsers ?? '-', color: 'text-primary' },
        ].map((item) => (
          <div key={item.label} className="text-center bg-dark rounded-lg p-2.5">
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
      {issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dark-border space-y-1.5">
          {issues.map((issue, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs ${issue.color}`}>
              <issue.icon className="w-3.5 h-3.5" />
              <span>{issue.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Quick stats card
const TrendCard: React.FC<{
  label: string; value: number | string; change?: number; icon: React.ElementType; color: string;
}> = ({ label, value, change, icon: Icon, color }) => (
  <div className="card hover:border-primary/20 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {change !== undefined && (
        <div className={`text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
          change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const AdminPage: React.FC = () => {
  usePageTitle('管理后台');
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'orders' | 'users'>('overview');
  const [accountFilter, setAccountFilter] = useState<'PENDING' | 'VERIFIED' | 'BANNED' | 'ALL'>('PENDING');
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useAdminStats();
  const { data: accountsData, isLoading: accountsLoading, isError: accountsError, refetch: refetchAccounts } = useAdminAccounts({ status: accountFilter, size: 50 });
  const { data: ordersData, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useAdminOrders({ page: orderPage, size: 20 });
  const { data: usersData, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useAdminUsers({ page: userPage, size: 20 });
  const verifyMutation = useVerifyAccount();
  const banMutation = useBanUser();

  const stats = statsData?.data?.data;
  const pendingAccounts: PendingAccount[] = accountsData?.data?.data?.records || [];

  const handleVerify = (id: number, approved: boolean, label: string) => {
    verifyMutation.mutate({ id, approved }, {
      onSuccess: () => {
        showToast(label, approved ? 'success' : 'warning');
        refetchAccounts();
        refetchStats();
      },
      onError: () => showToast('操作失败', 'error'),
    });
  };

  const handleBan = (id: number) => {
    if (!confirm('确定要封禁此用户吗？')) return;
    banMutation.mutate({ id, banned: true }, {
      onSuccess: () => { showToast('用户已被封禁', 'warning'); refetchUsers(); refetchStats(); },
      onError: () => showToast('操作失败', 'error'),
    });
  };

  if (!token || user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">权限不足</h2>
        <p className="text-slate-500 mb-6">您没有权限访问管理后台</p>
        <button onClick={() => navigate('/')} className="btn-primary">返回首页</button>
      </div>
    );
  }

  const orderSegments = [
    { label: '已完成', value: stats?.completedOrders ?? 0, color: '#22c55e' },
    { label: '进行中', value: Math.max(0, (stats?.totalOrders ?? 0) - (stats?.completedOrders ?? 0) - (stats?.cancelledOrders ?? 0)), color: '#8b5cf6' },
    { label: '已取消', value: stats?.cancelledOrders ?? 0, color: '#64748b' },
  ];

  const orderTypeSegments = [
    { label: '购买', value: stats?.ordersByType?.BUY ?? 0, color: '#3b82f6' },
    { label: '租赁', value: stats?.ordersByType?.RENT ?? 0, color: '#8b5cf6' },
  ];

  const accountSegments = [
    { label: '已认证', value: stats?.verifiedAccounts ?? 0, color: '#22c55e' },
    { label: '待审核', value: stats?.pendingAccounts ?? 0, color: '#eab308' },
    { label: '已售出', value: stats?.soldAccounts ?? 0, color: '#3b82f6' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            管理后台
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            欢迎回来，{user?.username} · {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { refetchStats(); refetchAccounts(); }} className="btn-ghost p-2" title="刷新">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'overview', label: '数据概览', icon: BarChart3 },
          { key: 'accounts', label: '账号审核', icon: Package },
          { key: 'orders', label: '订单管理', icon: FileText },
          { key: 'users', label: '用户管理', icon: Users },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Trend Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="card h-28 skeleton" />)}
            </div>
          ) : statsError ? (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500/60" />
              <p className="text-slate-400 mb-4">数据加载失败</p>
              <button onClick={() => refetchStats()} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> 重试
              </button>
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <TrendCard label="用户总数" value={stats.totalUsers ?? 0} icon={Users} color="bg-primary/20 text-primary" />
                <TrendCard label="账号总数" value={stats.totalAccounts ?? 0} icon={Package} color="bg-blue-500/20 text-blue-400" />
                <TrendCard label="待处理订单" value={stats.pendingOrders ?? 0} icon={Clock} color="bg-yellow-500/20 text-yellow-400" />
                <TrendCard label="平均评分" value={(stats.averageRating ?? 0).toFixed(1)} icon={Star} color="bg-amber-500/20 text-amber-400" />
                <TrendCard label="订单总数" value={stats.totalOrders ?? 0} icon={FileText} color="bg-green-500/20 text-green-400" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Account donut */}
                <div className="card">
                  <h3 className="font-medium text-sm text-slate-300 mb-4">账号分布</h3>
                  <div className="flex items-center gap-4">
                    <DonutChart segments={accountSegments} size={140} />
                    <div className="space-y-2">
                      {accountSegments.map((seg, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                          <span className="text-slate-400">{seg.label}</span>
                          <span className="ml-auto text-slate-300 font-medium">{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order donut */}
                <div className="card">
                  <h3 className="font-medium text-sm text-slate-300 mb-4">订单分布</h3>
                  <div className="flex items-center gap-4">
                    <DonutChart segments={orderSegments} size={140} />
                    <div className="space-y-2">
                      {orderSegments.map((seg, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                          <span className="text-slate-400">{seg.label}</span>
                          <span className="ml-auto text-slate-300 font-medium">{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Health */}
                <HealthCard stats={stats} />
              </div>

              {/* Order type donut */}
              <div className="card">
                <h3 className="font-medium text-sm text-slate-300 mb-4">订单类型分布</h3>
                <div className="flex items-center gap-4">
                  <DonutChart segments={orderTypeSegments} size={140} />
                  <div className="space-y-2">
                    {orderTypeSegments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                        <span className="text-slate-400">{seg.label}</span>
                        <span className="ml-auto text-slate-300 font-medium">{seg.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs pt-2 border-t border-dark-border">
                      <span className="text-slate-600">总计</span>
                      <span className="ml-auto text-slate-400 font-medium">
                        {orderTypeSegments.reduce((s, seg) => s + seg.value, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent pending alerts */}
              {(stats.pendingAccounts ?? 0) > 0 && (
                <div className="card border-l-4 border-l-yellow-500 bg-yellow-500/5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">有待审核账号</p>
                      <p className="text-xs text-slate-500 mt-0.5">当前有 {stats.pendingAccounts} 个账号待审核，建议尽快处理</p>
                    </div>
                    <button onClick={() => setActiveTab('accounts')}
                      className="ml-auto btn-secondary !py-1.5 !px-3 text-xs">
                      去审核 <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== ACCOUNTS ===== */}
      {activeTab === 'accounts' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-dark-lighter rounded-lg p-1">
              {(['PENDING', 'VERIFIED', 'BANNED', 'ALL'] as const).map((f) => (
                <button key={f} onClick={() => setAccountFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    accountFilter === f ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  {f === 'PENDING' ? '待审核' : f === 'VERIFIED' ? '已认证' : f === 'BANNED' ? '已封禁' : '全部'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">{pendingAccounts.length} 条结果</span>
          </div>

          {accountsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
          ) : accountsError ? (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500/60" />
              <p className="text-slate-400 mb-4">加载失败</p>
              <button onClick={() => refetchAccounts()} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> 重试
              </button>
            </div>
          ) : pendingAccounts.length === 0 ? (
            <div className="card text-center py-16">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/50" />
              <h3 className="text-lg font-medium mb-2 text-slate-400">太棒了！</h3>
              <p className="text-slate-600">暂无{accountFilter === 'PENDING' ? '待审核' : accountFilter === 'VERIFIED' ? '已认证' : '已封禁'}的账号</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingAccounts.map((account) => (
                <div key={account.id}
                  className="card flex items-center gap-4 p-4 hover:border-slate-700 transition-all group">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {account.gameType && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px]">{account.gameType}</span>
                      )}
                      <span>卖家: {account.seller?.nickname || account.seller?.username || '-'}</span>
                      <span className="text-primary font-medium">¥{account.price}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{account.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigate(`/accounts/${account.id}`)}
                      className="p-2 text-slate-500 hover:text-white hover:bg-dark rounded-lg transition-colors" title="查看">
                      <Eye className="w-4 h-4" />
                    </button>
                    {accountFilter === 'PENDING' && (
                      <>
                        <button onClick={() => handleVerify(account.id, true, '账号已通过审核')}
                          disabled={verifyMutation.isPending}
                          className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />通过
                        </button>
                        <button onClick={() => handleVerify(account.id, false, '账号已拒绝')}
                          disabled={verifyMutation.isPending}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs">
                          <XCircle className="w-3.5 h-3.5" />拒绝
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ORDERS ===== */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '总订单', value: stats.totalOrders ?? 0, color: 'text-white' },
                { label: '已完成', value: stats.completedOrders ?? 0, color: 'text-green-400' },
                { label: '收入总额', value: `¥${(stats.totalRevenue ?? 0).toFixed(2)}`, color: 'text-primary' },
              ].map(item => (
                <div key={item.label} className="card py-4 text-center">
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {ordersLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
          ) : ordersError ? (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500/60" />
              <p className="text-slate-400 mb-4">加载失败</p>
              <button onClick={() => refetchOrders()} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> 重试
              </button>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-border text-left">
                        {['订单号', '类型', '金额', '状态', '买家', '卖家', '时间'].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {(ordersData?.data?.data?.records || []).map((order: any) => {
                        const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                          PENDING: { label: '待支付', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                          PAID: { label: '已支付', color: 'text-blue-400', bg: 'bg-blue-500/20' },
                          PROCESSING: { label: '处理中', color: 'text-purple-400', bg: 'bg-purple-500/20' },
                          COMPLETED: { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/20' },
                          CANCELLED: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20' },
                        };
                        const st = statusMap[order.status] || statusMap.PENDING;
                        return (
                          <tr key={order.id} className="hover:bg-dark-lighter/40 transition-colors cursor-pointer"
                            onClick={() => navigate(`/orders`)}>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">#{order.id}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                order.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {order.type === 'BUY' ? '买' : '租'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-primary font-medium">¥{order.amount}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${st.bg} ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{order.buyerUsername || '-'}</td>
                            <td className="px-4 py-3 text-slate-400">{order.sellerUsername || '-'}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {(ordersData?.data?.data?.records || []).length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">暂无订单记录</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {ordersData?.data?.data && (ordersData.data.data.totalPages > 1 || ordersData.data.data.total > 0) && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    共 {ordersData.data.data.total ?? 0} 条，第 {ordersData.data.data.current ?? 1} / {ordersData.data.data.pages ?? 1} 页
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                      disabled={orderPage <= 1} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">上一页</button>
                    <button onClick={() => setOrderPage(p => p + 1)}
                      disabled={orderPage >= (ordersData.data.data.pages ?? 1)} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">下一页</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== USERS ===== */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '总用户', value: stats.totalUsers ?? 0 },
                { label: '活跃用户', value: stats.activeUsers ?? (stats.totalUsers ?? 0) },
                { label: '平均积分', value: stats.avgCreditScore ?? '100' },
              ].map(item => (
                <div key={item.label} className="card py-4 text-center">
                  <p className="text-xl font-bold text-white">{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {usersLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
          ) : usersError ? (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500/60" />
              <p className="text-slate-400 mb-4">加载失败</p>
              <button onClick={() => refetchUsers()} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> 重试
              </button>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-border text-left">
                        {['ID', '用户名', '昵称', '角色', '状态', '积分', '注册时间', '操作'].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {(usersData?.data?.data?.records || []).map((user: any) => {
                        const roleMap: Record<string, { label: string; color: string; bg: string }> = {
                          ADMIN: { label: '管理员', color: 'text-red-400', bg: 'bg-red-500/20' },
                          SELLER: { label: '卖家', color: 'text-blue-400', bg: 'bg-blue-500/20' },
                          BUYER: { label: '买家', color: 'text-slate-400', bg: 'bg-slate-500/20' },
                        };
                        const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                          ACTIVE: { label: '正常', color: 'text-green-400', bg: 'bg-green-500/20' },
                          BANNED: { label: '已封禁', color: 'text-red-400', bg: 'bg-red-500/20' },
                          INACTIVE: { label: '未激活', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                        };
                        const roleBadge = roleMap[user.role] || { label: user.role as string, color: 'text-slate-400', bg: 'bg-slate-500/20' };
                        const statusBadge = statusMap[user.status] || { label: (user.status as string) || '正常', color: 'text-slate-400', bg: 'bg-slate-500/20' };
                        return (
                          <tr key={user.id} className="hover:bg-dark-lighter/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">#{user.id}</td>
                            <td className="px-4 py-3 font-medium">{user.username}</td>
                            <td className="px-4 py-3 text-slate-400">{user.nickname || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${roleBadge.bg} ${roleBadge.color}`}>{roleBadge.label}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${statusBadge.bg} ${statusBadge.color}`}>{statusBadge.label}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${(user.creditScore ?? 100) >= 80 ? 'text-green-400' : (user.creditScore ?? 100) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {user.creditScore ?? 100}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {user.role !== 'ADMIN' && (
                                <div className="flex gap-1">
                                  <button onClick={() => navigate(`/profile?userId=${user.id}`)}
                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-dark rounded transition-colors" title="查看">
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {user.status === 'BANNED' ? (
                                    <button onClick={() => {
                                      if (!confirm(`确定要解封用户 ${user.username} 吗？`)) return;
                                      banMutation.mutate({ id: user.id, banned: false }, {
                                        onSuccess: () => { showToast('用户已解封', 'success'); refetchUsers(); },
                                        onError: () => showToast('操作失败', 'error'),
                                      });
                                    }}
                                      disabled={banMutation.isPending}
                                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 disabled:opacity-50 transition-colors">
                                      解封
                                    </button>
                                  ) : (
                                    <button onClick={() => {
                                      if (!confirm(`确定要封禁用户 ${user.username} 吗？`)) return;
                                      banMutation.mutate({ id: user.id, banned: true }, {
                                        onSuccess: () => { showToast('用户已封禁', 'warning'); refetchUsers(); },
                                        onError: () => showToast('操作失败', 'error'),
                                      });
                                    }}
                                      disabled={banMutation.isPending}
                                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 disabled:opacity-50 transition-colors">
                                      封禁
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(usersData?.data?.data?.records || []).length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">暂无用户记录</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {usersData?.data?.data && (usersData.data.data.totalPages > 1 || usersData.data.data.total > 0) && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    共 {usersData.data.data.total ?? 0} 条，第 {usersData.data.data.current ?? 1} / {usersData.data.data.pages ?? 1} 页
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage <= 1} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">上一页</button>
                    <button onClick={() => setUserPage(p => p + 1)}
                      disabled={userPage >= (usersData.data.data.pages ?? 1)} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">下一页</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
