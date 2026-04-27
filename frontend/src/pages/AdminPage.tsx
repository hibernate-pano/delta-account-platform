import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { adminApi, disputeApi, accountApi } from '../api';
import { useToast } from '../components/ui/Toast';
import AdminDashboard from '../components/admin/AdminDashboard';
import {
  Users, Package, FileText, Shield, RefreshCw, DollarSign,
  AlertTriangle, CheckCircle, XCircle, Eye, MessageSquare,
  ChevronLeft, ChevronRight, Filter, Search, ShieldCheck, Clock
} from 'lucide-react';
import type { Dispute } from '../types';

type TabType = 'dashboard' | 'accounts' | 'orders' | 'disputes' | 'users' | 'verification';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // 数据状态
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // 分页状态
  const [disputePage, setDisputePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  
  // 搜索/筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    loadData();
  }, [token, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPendingAccounts(),
        loadDisputes(),
        loadUsers(),
        loadAccounts()
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingAccounts = async () => {
    try {
      const res = await adminApi.getPendingAccounts({ size: 20 });
      setPendingAccounts(res.data.data?.records || []);
    } catch (error) {
      console.error('Failed to load pending accounts:', error);
    }
  };

  const loadDisputes = async () => {
    try {
      const res = await disputeApi.getAll({ page: disputePage, size: 10, status: filterStatus || undefined });
      setDisputes(res.data.data?.records || []);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers({ page: userPage, size: 20 });
      setUsers(res.data.data?.records || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await accountApi.getList({ size: 20 });
      setAccounts(res.data.data?.records || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  // 账号审核
  const handleVerifyAccount = async (accountId: number, approved: boolean, reason?: string) => {
    setActionLoading(accountId);
    try {
      await adminApi.verifyAccount(accountId, approved ? 'approve' : 'reject');
      toast('success', approved ? '账号已通过审核' : '账号已拒绝');
      setPendingAccounts(prev => prev.filter(a => a.id !== accountId));
    } catch (error) {
      toast('error', '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 纠纷处理
  const handleResolveDispute = async (disputeId: number, resolution: string) => {
    const reason = prompt('请输入处理备注（可选）：');
    
    setActionLoading(disputeId);
    try {
      await disputeApi.resolve(disputeId, { resolution, adminRemark: reason || '' });
      toast('success', '纠纷已处理');
      loadDisputes();
    } catch (error) {
      toast('error', '处理失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 用户管理
  const handleBanUser = async (userId: number) => {
    if (!confirm('确定要封禁该用户吗？')) return;
    
    try {
      await adminApi.banUser(userId);
      toast('success', '用户已封禁');
      loadUsers();
    } catch (error) {
      toast('error', '操作失败');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await adminApi.unbanUser(userId);
      toast('success', '用户已解封');
      loadUsers();
    } catch (error) {
      toast('error', '操作失败');
    }
  };

  // 工具方法
  const getReasonText = (reason: string) => {
    const reasons: Record<string, string> = {
      'ACCOUNT_NOT_AS_DESCRIBED': '账号与描述不符',
      'ACCOUNT_RECOVERY': '账号找回',
      'NOT_RECEIVED': '未收到账号',
      'FRAUD': '欺诈',
      'OTHER': '其他',
    };
    return reasons[reason] || reason;
  };

  const getStatusBadge = (status: string, type?: string) => {
    if (type === 'dispute') {
      const config: Record<string, { bg: string; text: string }> = {
        'OPEN': { bg: 'bg-yellow-500/20 text-yellow-500', text: '待处理' },
        'UNDER_REVIEW': { bg: 'bg-blue-500/20 text-blue-500', text: '审核中' },
        'MEDIATING': { bg: 'bg-purple-500/20 text-purple-500', text: '调解中' },
        'RESOLVED': { bg: 'bg-green-500/20 text-green-500', text: '已解决' },
        'REJECTED': { bg: 'bg-slate-500/20 text-slate-500', text: '已撤销' },
      };
      const item = config[status] || { bg: 'bg-slate-500/20', text: status };
      return <span className={`px-2 py-1 rounded text-xs ${item.bg}`}>{item.text}</span>;
    }
    if (type === 'user') {
      return status === 'ACTIVE' 
        ? <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">正常</span>
        : <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-500">已封禁</span>;
    }
    return <span className="px-2 py-1 rounded text-xs bg-slate-500/20 text-slate-500">{status}</span>;
  };

  const getVerificationBadge = (level: number) => {
    if (level === 0) return <span className="text-slate-500 text-xs">未验证</span>;
    if (level === 1) return <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">基础验证</span>;
    if (level === 2) return <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">高级验证</span>;
    if (level >= 3) return <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">深度验证</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-slate-500">无权访问管理后台</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">管理后台</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            欢迎，{user?.nickname || user?.username}
          </span>
          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'dashboard', label: '仪表盘', icon: Users },
          { key: 'accounts', label: '账号管理', icon: Package },
          { key: 'orders', label: '订单管理', icon: FileText },
          { key: 'disputes', label: '纠纷管理', icon: AlertTriangle },
          { key: 'users', label: '用户管理', icon: Shield },
          { key: 'verification', label: '验证审核', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-dark-lighter text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 仪表盘 */}
      {activeTab === 'dashboard' && <AdminDashboard />}

      {/* 账号管理 */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">所有账号</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-500">账号信息</th>
                    <th className="text-left py-3 px-4 text-slate-500">卖家</th>
                    <th className="text-left py-3 px-4 text-slate-500">价格</th>
                    <th className="text-left py-3 px-4 text-slate-500">状态</th>
                    <th className="text-left py-3 px-4 text-slate-500">验证</th>
                    <th className="text-left py-3 px-4 text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{account.title}</p>
                          <p className="text-xs text-slate-500">{account.gameRank} · {account.skinCount}皮肤</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">ID: {account.sellerId}</td>
                      <td className="py-3 px-4 text-primary font-medium">¥{account.price}</td>
                      <td className="py-3 px-4">{getStatusBadge(account.status)}</td>
                      <td className="py-3 px-4">{getVerificationBadge(account.verificationLevel)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/accounts/${account.id}`)}
                          className="text-primary hover:underline text-xs"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 订单管理 */}
      {activeTab === 'orders' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">订单管理</h2>
          <p className="text-slate-500 text-center py-8">
            订单列表功能开发中... <a href="/orders" className="text-primary hover:underline ml-2">查看用户订单</a>
          </p>
        </div>
      )}

      {/* 纠纷管理 */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {/* 筛选栏 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索纠纷编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark border border-slate-700 rounded-lg focus:border-primary outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); loadDisputes(); }}
              className="px-4 py-2 bg-dark border border-slate-700 rounded-lg focus:border-primary outline-none"
            >
              <option value="">全部状态</option>
              <option value="OPEN">待处理</option>
              <option value="UNDER_REVIEW">审核中</option>
              <option value="MEDIATING">调解中</option>
              <option value="RESOLVED">已解决</option>
            </select>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              纠纷列表 
              <span className="text-sm font-normal text-slate-500 ml-2">
                共 {disputes.length} 条
              </span>
            </h2>
            {disputes.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-slate-500">暂无纠纷记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="p-4 bg-dark-lighter rounded-lg border border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{dispute.disputeNo}</span>
                          {getStatusBadge(dispute.status, 'dispute')}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          订单 #{dispute.orderId} · {getReasonText(dispute.reason)}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          发起人: {dispute.initiatorId} · 被投诉: {dispute.respondentId} · {dispute.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-dark rounded-lg mb-3">
                      <p className="text-sm text-slate-400">{dispute.description}</p>
                    </div>

                    {dispute.adminRemark && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-3">
                        <p className="text-xs text-blue-400">处理备注: {dispute.adminRemark}</p>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    {['OPEN', 'UNDER_REVIEW', 'MEDIATING'].includes(dispute.status) && (
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'FULL_REFUND')}
                          disabled={actionLoading === dispute.id}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 disabled:opacity-50"
                        >
                          全额退款
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute.id, 'RELEASE_TO_SELLER')}
                          disabled={actionLoading === dispute.id}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                        >
                          打款卖家
                        </button>
                        <button
                          onClick={() => navigate(`/user/orders/${dispute.orderId}`)}
                          className="px-4 py-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-700"
                        >
                          查看订单
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">用户列表</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  className="p-2 text-slate-400 hover:text-white"
                  disabled={userPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-500">第 {userPage} 页</span>
                <button
                  onClick={() => setUserPage(p => p + 1)}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-500">用户</th>
                    <th className="text-left py-3 px-4 text-slate-500">角色</th>
                    <th className="text-left py-3 px-4 text-slate-500">余额</th>
                    <th className="text-left py-3 px-4 text-slate-500">信用分</th>
                    <th className="text-left py-3 px-4 text-slate-500">状态</th>
                    <th className="text-left py-3 px-4 text-slate-500">注册时间</th>
                    <th className="text-left py-3 px-4 text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-sm">{u.nickname?.[0] || u.username?.[0] || '?'}</span>
                          </div>
                          <div>
                            <p className="font-medium">{u.nickname || u.username}</p>
                            <p className="text-xs text-slate-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'ADMIN' 
                          ? <span className="text-primary">管理员</span>
                          : <span className="text-slate-400">用户</span>}
                      </td>
                      <td className="py-3 px-4 text-green-400">¥{u.balance || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`${u.creditScore >= 80 ? 'text-green-400' : u.creditScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {u.creditScore || 100}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(u.status, 'user')}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{u.createdAt}</td>
                      <td className="py-3 px-4">
                        {u.role !== 'ADMIN' && (
                          u.status === 'BANNED' 
                            ? <button onClick={() => handleUnbanUser(u.id)} className="text-green-400 hover:underline text-xs">解封</button>
                            : <button onClick={() => handleBanUser(u.id)} className="text-red-400 hover:underline text-xs">封禁</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 验证审核 */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              待审核账号 ({pendingAccounts.length})
            </h2>
            {pendingAccounts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-slate-500">暂无待审核账号</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-dark-lighter rounded-lg border border-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">{account.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">售价</p>
                            <p className="text-primary font-medium">¥{account.price}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">段位</p>
                            <p className="text-white">{account.gameRank || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">皮肤数</p>
                            <p className="text-white">{account.skinCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">卖家ID</p>
                            <p className="text-white">{account.sellerId}</p>
                          </div>
                        </div>
                        {account.description && (
                          <p className="text-sm text-slate-500 mt-3 line-clamp-2">{account.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleVerifyAccount(account.id, true)}
                          disabled={actionLoading === account.id}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('请输入拒绝原因：');
                            if (reason) handleVerifyAccount(account.id, false, reason);
                          }}
                          disabled={actionLoading === account.id}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝
                        </button>
                        <button
                          onClick={() => navigate(`/accounts/${account.id}`)}
                          className="px-4 py-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-700 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 验证等级说明 */}
          <div className="card bg-slate-800/50">
            <h2 className="text-lg font-semibold mb-4">验证等级说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-dark rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">0</div>
                  <span className="font-medium">未验证</span>
                </div>
                <p className="text-xs text-slate-500">仅有卖家声明，无任何验证</p>
              </div>
              <div className="p-4 bg-dark rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">1</div>
                  <span className="font-medium text-blue-400">基础验证</span>
                </div>
                <p className="text-xs text-slate-500">手机+实名认证</p>
              </div>
              <div className="p-4 bg-dark rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">2</div>
                  <span className="font-medium text-green-400">高级验证</span>
                </div>
                <p className="text-xs text-slate-500">人工抽检截图</p>
              </div>
              <div className="p-4 bg-dark rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400">3</div>
                  <span className="font-medium text-yellow-400">深度验证</span>
                </div>
                <p className="text-xs text-slate-500">平台托管登录验证</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;