import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authApi, accountApi } from '../api';
import { Users, Package, FileText, BarChart3, Shield } from 'lucide-react';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, accounts: 0, orders: 0 });
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      // Mock data for demo
      setStats({ users: 156, accounts: 89, orders: 234 });
      setPendingAccounts([
        { id: 1, title: '待审核账号1', sellerId: 2, price: 999, status: 'PENDING' },
        { id: 2, title: '待审核账号2', sellerId: 3, price: 1999, status: 'PENDING' },
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (accountId: number, approved: boolean) => {
    try {
      // In real app, call API
      alert(approved ? '已通过审核' : '已拒绝');
      setPendingAccounts(prev => prev.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Failed to verify account:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-gray-500">无权访问</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.users}</p>
            <p className="text-sm text-gray-500">用户总数</p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.accounts}</p>
            <p className="text-sm text-gray-500">账号总数</p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-sm text-gray-500">订单总数</p>
          </div>
        </div>
      </div>

      {/* Pending Accounts */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">待审核账号 ({pendingAccounts.length})</h2>
        {pendingAccounts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无待审核账号</p>
        ) : (
          <div className="space-y-4">
            {pendingAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-dark rounded-lg">
                <div>
                  <p className="font-medium">{account.title}</p>
                  <p className="text-sm text-gray-500">售价: ¥{account.price}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerify(account.id, true)}
                    className="px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => handleVerify(account.id, false)}
                    className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
