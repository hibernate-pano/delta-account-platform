import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Package, ChevronRight, FileText } from 'lucide-react';

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
    // In a real app, we'd fetch orders from the API
    // For now, show empty state
    setLoading(false);
  }, [token]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500 mb-4">暂无订单记录</p>
          <Link to="/accounts" className="btn-primary">
            浏览账号市场
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card flex items-center justify-between hover:border-primary"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-dark rounded flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">订单号: {order.orderNo}</p>
                  <p className="text-sm text-gray-500">
                    {order.type === 'BUY' ? '购买账号' : '租赁账号'} - ¥{order.amount}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded text-sm ${
                  order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                  order.status === 'PAID' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {order.status === 'COMPLETED' ? '已完成' :
                   order.status === 'PAID' ? '已支付' : '待支付'}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
