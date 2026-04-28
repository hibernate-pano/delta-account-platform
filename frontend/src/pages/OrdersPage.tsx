import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { orderApi } from '../api';
import { Package, ChevronRight, FileText, RefreshCw } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 mb-4">暂无订单记录</p>
          <Link to="/accounts" className="btn-primary">
            浏览账号市场
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card flex items-center justify-between hover:border-primary transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-dark rounded flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium">订单号: {order.orderNo}</p>
                  <p className="text-sm text-slate-500">
                    {order.type === 'BUY' ? '购买账号' : '租赁账号'} - ¥{order.amount}
                  </p>
                  <p className="text-xs text-slate-600">{order.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded text-sm ${
                  order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                  order.status === 'PAID' ? 'bg-blue-500/20 text-blue-500' :
                  order.status === 'CANCELLED' ? 'bg-slate-500/20 text-slate-500' :
                  order.status === 'REFUNDED' ? 'bg-red-500/20 text-red-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {order.status === 'COMPLETED' ? '已完成' :
                   order.status === 'PAID' ? '已支付' :
                   order.status === 'CANCELLED' ? '已取消' :
                   order.status === 'REFUNDED' ? '已退款' : '待支付'}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
