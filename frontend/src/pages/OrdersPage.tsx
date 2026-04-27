import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { orderApi } from '../api';
import type { Order } from '../types';
import { Package, ChevronRight, FileText, RefreshCw, AlertTriangle, Clock, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
      toast('error', '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  // 确认收货
  const handleConfirmReceived = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await orderApi.confirm(orderId);
      toast('success', '已确认收货');
      fetchOrders();
    } catch (error: unknown) {
      const msg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '确认收货失败';
      toast('error', msg || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 取消订单
  const handleCancel = async (orderId: number) => {
    if (!confirm('确定要取消此订单吗？')) return;
    setActionLoading(orderId);
    try {
      await orderApi.cancel(orderId);
      toast('success', '订单已取消');
      fetchOrders();
    } catch (error: unknown) {
      const msg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '取消失败';
      toast('error', msg || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 获取托管状态显示
  const getEscrowBadge = (order: Order) => {
    if (!order.escrowStatus) return null;
    
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'PENDING_RECEIVE': { bg: 'bg-yellow-500/20', text: 'text-yellow-500', icon: <Clock className="w-3 h-3" /> },
      'IN_ESCROW': { bg: 'bg-blue-500/20', text: 'text-blue-500', icon: <Shield className="w-3 h-3" /> },
      'RELEASED': { bg: 'bg-green-500/20', text: 'text-green-500', icon: <CheckCircle className="w-3 h-3" /> },
      'DISPUTED': { bg: 'bg-red-500/20', text: 'text-red-500', icon: <AlertTriangle className="w-3 h-3" /> },
      'REFUNDED': { bg: 'bg-slate-500/20', text: 'text-slate-500', icon: <FileText className="w-3 h-3" /> },
    };
    
    const config = statusConfig[order.escrowStatus];
    if (!config) return null;

    const statusText: Record<string, string> = {
      'PENDING_RECEIVE': '待确认收货',
      'IN_ESCROW': '资金托管中',
      'RELEASED': '已释放',
      'DISPUTED': '争议处理中',
      'REFUNDED': '已退款',
    };

    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}>
        {config.icon}
        {statusText[order.escrowStatus]}
      </span>
    );
  };

  // 获取主状态显示
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; bg: string }> = {
      'PENDING': { text: '待支付', bg: 'bg-yellow-500/20 text-yellow-500' },
      'PAID': { text: '已支付', bg: 'bg-blue-500/20 text-blue-500' },
      'PROCESSING': { text: '处理中', bg: 'bg-blue-500/20 text-blue-500' },
      'COMPLETED': { text: '已完成', bg: 'bg-green-500/20 text-green-500' },
      'CANCELLED': { text: '已取消', bg: 'bg-slate-500/20 text-slate-500' },
      'REFUNDED': { text: '已退款', bg: 'bg-red-500/20 text-red-500' },
    };
    const config = statusMap[status] || { text: status, bg: 'bg-slate-500/20 text-slate-500' };
    return <span className={`px-2 py-1 rounded text-sm ${config.bg}`}>{config.text}</span>;
  };

  // 计算冻结期剩余时间
  const getFreezeTimeRemaining = (order: Order) => {
    if (!order.escrowReleaseAt || order.escrowStatus !== 'IN_ESCROW') return null;
    const releaseTime = new Date(order.escrowReleaseAt).getTime();
    const now = Date.now();
    if (releaseTime <= now) return null;
    
    const hours = Math.ceil((releaseTime - now) / (1000 * 60 * 60));
    return hours;
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
    <div className="max-w-5xl mx-auto">
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
          {orders.map((order) => {
            const isBuyer = user?.id === order.buyerId;
            const freezeHours = getFreezeTimeRemaining(order);
            
            return (
              <div
                key={order.id}
                className="card hover:border-primary/50 transition-colors"
              >
                {/* 订单主体 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dark-darker rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{order.accountTitle || `订单 #${order.id}`}</p>
                        {getEscrowBadge(order)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {order.type === 'BUY' ? '购买账号' : '租赁账号'}
                        <span className="mx-2">·</span>
                        <span className="text-primary font-medium">¥{order.amount}</span>
                        {order.escrowAmount && order.escrowAmount !== order.amount && (
                          <span className="text-xs text-slate-600 ml-2">(托管: ¥{order.escrowAmount})</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        订单号: {order.orderNo}
                        <span className="mx-2">·</span>
                        {order.createdAt}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <button 
                      onClick={() => navigate(`/user/orders/${order.id}`)}
                      className="btn-ghost text-sm py-2"
                    >
                      查看详情
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>

                {/* 托管状态信息 */}
                {order.escrowStatus === 'IN_ESCROW' && freezeHours !== null && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">资金托管中</span>
                      </div>
                      <span className="text-sm text-blue-300">
                        {freezeHours > 0 ? `冻结期剩余 ${freezeHours} 小时` : '冻结期即将结束'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      冻结期结束后资金将自动打款给卖家，期间如有问题可发起纠纷
                    </p>
                  </div>
                )}

                {/* 操作按钮区 */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {isBuyer ? '作为买家' : '作为卖家'}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 买家操作 */}
                    {isBuyer && order.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={actionLoading === order.id}
                        className="btn-ghost text-sm py-1.5 text-slate-400"
                      >
                        取消订单
                      </button>
                    )}
                    
                    {/* 支付按钮 */}
                    {order.status === 'PENDING' && isBuyer && (
                      <button
                        onClick={() => navigate(`/user/orders/${order.id}?action=pay`)}
                        className="btn-primary text-sm py-1.5"
                      >
                        去支付
                      </button>
                    )}

                    {/* 确认收货按钮 - 买家已支付但未确认 */}
                    {isBuyer && order.status === 'PAID' && 
                     (order.escrowStatus === 'PENDING_RECEIVE' || order.escrowStatus === 'IN_ESCROW') && (
                      <button
                        onClick={() => handleConfirmReceived(order.id)}
                        disabled={actionLoading === order.id}
                        className="btn-primary text-sm py-1.5"
                      >
                        {actionLoading === order.id ? '处理中...' : '确认收货'}
                      </button>
                    )}

                    {/* 发起纠纷按钮 - 托管中或待确认状态 */}
                    {(order.escrowStatus === 'IN_ESCROW' || order.escrowStatus === 'PENDING_RECEIVE') && 
                     (order.status === 'PAID' || order.status === 'PROCESSING') && (
                      <button
                        onClick={() => navigate(`/user/orders/${order.id}?action=dispute`)}
                        className="btn-ghost text-sm py-1.5 text-red-400 border border-red-500/30 hover:bg-red-500/10"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1 inline" />
                        发起纠纷
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;