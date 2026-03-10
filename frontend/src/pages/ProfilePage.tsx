import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accountApi, orderApi, authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Account, Order } from '../types';
import { User, Package, LogOut, FileText, Edit3, Save, X, Trash2, ToggleLeft, ToggleRight, Lock } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { ACCOUNT_STATUS, ORDER_STATUS, getStatusInfo } from '../constants/status';
import { ListSkeleton } from '../components/ui/Skeleton';

const ProfilePage: React.FC = () => {
  usePageTitle('个人中心');
  const navigate = useNavigate();
  const { user, logout, setAuth, token } = useAuthStore();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('accounts');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: '', email: '', phone: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, ordersRes] = await Promise.all([
        accountApi.getMy({ size: 50 }),
        orderApi.getMy({ size: 50 }),
      ]);
      setAccounts(accountsRes.data.data.records || []);
      setOrders(ordersRes.data.data.records || []);
    } catch (error: any) {
      toast('error', error.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startEditing = () => {
    setEditForm({
      nickname: user?.nickname || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await authApi.updateProfile(editForm);
      const profileRes = await authApi.getProfile();
      if (token) {
        setAuth(token, profileRes.data.data);
      }
      setEditing(false);
      toast('success', '资料已更新');
    } catch (error: any) {
      toast('error', error.response?.data?.message || '保存失败');
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (deletingId !== accountId) {
      setDeletingId(accountId);
      return;
    }
    setDeletingId(null);
    try {
      await accountApi.delete(accountId);
      setAccounts(prev => prev.filter(a => a.id !== accountId));
      toast('success', '账号已删除');
    } catch (error: any) {
      toast('error', error.response?.data?.message || '删除失败');
    }
  };

  const handleToggleOffline = async (accountId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'OFFLINE' ? 'ON_SALE' : 'OFFLINE';
    try {
      await accountApi.toggleStatus(accountId, newStatus);
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, status: newStatus } : a));
      toast('success', newStatus === 'OFFLINE' ? '已下架' : '已上架');
    } catch (error: any) {
      toast('error', error.response?.data?.message || '操作失败');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast('error', '请填写完整');
      return;
    }
    if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 20) {
      toast('error', '新密码长度需要6-20位');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('error', '两次输入的新密码不一致');
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast('success', '密码修改成功');
      setShowPasswordChange(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast('error', error.response?.data?.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <ListSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.nickname || user?.username}</h2>
              <p className="text-gray-500">@{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">¥{user?.balance?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-500">账户余额</p>
            </div>
            {!editing && (
              <button onClick={startEditing} className="p-2 text-gray-400 hover:text-primary transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        {editing && (
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">昵称</label>
              <input
                type="text"
                value={editForm.nickname}
                onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                className="input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">手机号</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="btn-secondary px-4 py-2 text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> 取消
              </button>
              <button onClick={handleSaveProfile} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
                <Save className="w-4 h-4" /> 保存
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'accounts' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          我的账号 ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          订单记录 ({orders.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'accounts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">发布的账号</h3>
            <Link to="/sell" className="btn-primary text-sm">发布新账号</Link>
          </div>
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无发布的账号</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {accounts.map((account) => {
                const status = getStatusInfo(ACCOUNT_STATUS, account.status);
                const canManage = account.status === 'ON_SALE' || account.status === 'OFFLINE';
                return (
                  <div key={account.id} className="card hover:border-primary transition-colors">
                    <Link to={`/accounts/${account.id}`}>
                      <h4 className="font-medium mb-2 line-clamp-1 hover:text-primary transition-colors">{account.title}</h4>
                    </Link>
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>¥{account.price}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {canManage && (
                      <div className="flex gap-2 border-t border-gray-800 pt-3">
                        <Link
                          to={`/accounts/${account.id}/edit`}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> 编辑
                        </Link>
                        <button
                          onClick={() => handleToggleOffline(account.id, account.status)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          {account.status === 'OFFLINE' ? (
                            <><ToggleRight className="w-3 h-3" /> 上架</>
                          ) : (
                            <><ToggleLeft className="w-3 h-3" /> 下架</>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-400 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          {deletingId === account.id ? '确认删除？' : '删除'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无订单记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = getStatusInfo(ORDER_STATUS, order.status);
                return (
                  <div key={order.id} className="card flex justify-between items-center">
                    <div>
                      <p className="font-medium">{order.accountTitle || `订单 #${order.orderNo?.slice(0, 8)}`}</p>
                      <p className="text-sm text-gray-500">
                        {order.type === 'BUY' ? '购买' : '租赁'} · ¥{order.amount}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Password Change */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <button
          onClick={() => setShowPasswordChange(!showPasswordChange)}
          className="flex items-center space-x-2 text-gray-400 hover:text-primary transition-colors"
        >
          <Lock className="w-5 h-5" />
          <span>修改密码</span>
        </button>
        {showPasswordChange && (
          <div className="mt-4 space-y-3 max-w-md">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">当前密码</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                className="input w-full"
                placeholder="输入当前密码"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">新密码</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="input w-full"
                placeholder="6-20位新密码"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">确认新密码</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="input w-full"
                placeholder="再次输入新密码"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="btn-primary px-4 py-2 text-sm"
              >
                {passwordLoading ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-500 hover:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
