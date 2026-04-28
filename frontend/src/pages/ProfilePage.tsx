import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, accountApi, orderApi } from '../api';
import { useAuthStore } from '../store/auth';
import { User, Package, Settings, LogOut, FileText } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user, logout, setAuth } = useAuthStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('accounts');
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
      const [profileRes, accountsRes] = await Promise.all([
        authApi.getProfile(),
        accountApi.getList({ size: 100 })
      ]);
      setAccounts((accountsRes.data.data.records || []).filter((a: any) => a.sellerId === profileRes.data.data.id));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.nickname || user?.username}</h2>
              <p className="text-gray-500">@{user?.username}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">¥{user?.balance?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-500">账户余额</p>
          </div>
        </div>
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
          订单记录
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
              {accounts.map((account) => (
                <div key={account.id} className="card">
                  <h4 className="font-medium mb-2 line-clamp-1">{account.title}</h4>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>¥{account.price}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      account.status === 'ON_SALE' ? 'bg-green-500/20 text-green-500' :
                      account.status === 'SOLD' ? 'bg-gray-500/20 text-gray-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {account.status === 'ON_SALE' ? '出售中' : 
                       account.status === 'SOLD' ? '已出售' : account.status}
                    </span>
                  </div>
                </div>
              ))}
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
              {orders.map((order) => (
                <div key={order.id} className="card flex justify-between items-center">
                  <div>
                    <p className="font-medium">订单号: {order.orderNo}</p>
                    <p className="text-sm text-gray-500">
                      {order.type === 'BUY' ? '购买' : '租赁'} - ¥{order.amount}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                    order.status === 'PAID' ? 'bg-blue-500/20 text-blue-500' :
                    order.status === 'CANCELLED' ? 'bg-gray-500/20 text-gray-500' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {order.status === 'COMPLETED' ? '已完成' :
                     order.status === 'PAID' ? '已支付' :
                     order.status === 'CANCELLED' ? '已取消' : '待支付'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="mt-8 pt-6 border-t border-gray-800">
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
