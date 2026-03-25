import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { orderApi } from '../api';
import { useToast } from '../components/ui/Toast';
import { TransactionSkeleton } from '../components/ui/Skeleton';
import { Package, ChevronRight, FileText, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, ShoppingBag, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface Order {
  id: number;
  orderNo: string;
  accountId: number;
  buyerId: number;
  sellerId: number;
  type: 'BUY' | 'RENT';
  amount: number;
  deposit?: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  rentStart?: string;
  rentEnd?: string;
  rentHours?: number;
  createdAt: string;
  account?: {
    title: string;
    images?: string[];
  };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING: { label: '待支付', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  PAID: { label: '已支付', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: CheckCircle },
  PROCESSING: { label: '处理中', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: RefreshCw },
  COMPLETED: { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  CANCELLED: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: XCircle },
  REFUNDED: { label: '已退款', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'BUY' | 'RENT'>('all');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders();
      setOrders(res.data.data.records || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      showToast('加载订单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.type === activeTab;
  });

  const stats = {
    total: orders.length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    pending: orders.filter((o) => ['PENDING', 'PROCESSING'].includes(o.status)).length,
    totalSpent: orders
      .filter((o) => o.status === 'COMPLETED' && o.type === 'BUY')
      .reduce((sum, o) => sum + o.amount, 0),
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>
        <div className="card">
          {[1, 2, 3, 4, 5].map((i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '总订单', value: stats.total, icon: Package, color: 'text-white' },
          { label: '已完成', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
          { label: '进行中', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
          { label: '累计消费', value: `¥${stats.totalSpent.toFixed(0)}`, icon: ArrowDownCircle, color: 'text-primary' },
        ].map((stat, idx) => (
          <div key={idx} className="card p-4 text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: '全部', count: stats.total },
          { key: 'BUY', label: '购买', icon: ShoppingBag, count: orders.filter((o) => o.type === 'BUY').length },
          { key: 'RENT', label: '租赁', icon: Clock, count: orders.filter((o) => o.type === 'RENT').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-dark-lighter text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-white/20' : 'bg-dark'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">
              {activeTab === 'all' ? '暂无订单' : activeTab === 'BUY' ? '暂无购买记录' : '暂无租赁记录'}
            </h3>
            <p className="text-slate-600 mb-6">开始探索账号市场吧</p>
            <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              去逛逛
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Clock;
            return (
              <div
                key={order.id}
                className="card flex items-center gap-4 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/accounts/${order.accountId}`)}
              >
                {/* Account Image */}
                <div className="w-16 h-16 bg-dark rounded-lg overflow-hidden flex-shrink-0">
                  {order.account?.images?.[0] ? (
                    <img
                      src={order.account.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      order.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {order.type === 'BUY' ? '购买' : '租赁'}
                    </span>
                    <span className="text-sm text-slate-500 font-mono">#{order.orderNo.slice(-8)}</span>
                  </div>
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {order.account?.title || `账号 #${order.accountId}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{formatDate(order.createdAt)}</span>
                    {order.type === 'RENT' && order.rentHours && (
                      <span>租期: {order.rentHours}小时</span>
                    )}
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold mb-1">
                    ¥{order.amount.toFixed(2)}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[order.status]?.label || order.status}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
