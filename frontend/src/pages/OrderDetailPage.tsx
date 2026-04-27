import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { orderApi, disputeApi } from '../api';
import type { Order, Dispute } from '../types';
import { useToast } from '../components/ui/Toast';
import {
  ArrowLeft, Package, Clock, Shield, AlertTriangle, CheckCircle,
  CreditCard, RefreshCw, X, Upload, MessageSquare, User
} from 'lucide-react';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [existingDispute, setExistingDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 纠纷表单状态
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeImages, setDisputeImages] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (searchParams.get('action') === 'dispute') {
      setShowDisputeForm(true);
    }
    fetchOrderDetail();
    fetchExistingDispute();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const res = await orderApi.getById(Number(id));
      setOrder(res.data.data.order || res.data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast('error', '加载订单详情失败');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingDispute = async () => {
    try {
      const res = await disputeApi.getByOrderId(Number(id));
      if (res.data.data) {
        setExistingDispute(res.data.data);
      }
    } catch (error) {
      // 没有纠纷记录是正常的
    }
  };

  const handleConfirmReceived = async () => {
    if (!confirm('确认已收到账号？确认后资金将进入冻结期，冻结期结束后自动打款给卖家。')) return;
    setActionLoading(true);
    try {
      await orderApi.confirm(Number(id));
      toast('success', '已确认收货');
      fetchOrderDetail();
    } catch (error: unknown) {
      const msg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '操作失败';
      toast('error', msg || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await orderApi.pay(Number(id));
      toast('success', '支付成功，资金已进入托管');
      fetchOrderDetail();
    } catch (error: unknown) {
      const msg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '支付失败';
      toast('error', msg || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消此订单吗？')) return;
    setActionLoading(true);
    try {
      await orderApi.cancel(Number(id));
      toast('success', '订单已取消');
      navigate('/orders');
    } catch (error: unknown) {
      const msg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '取消失败';
      toast('error', msg || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason) {
      toast('error', '请选择纠纷原因');
      return;
    }
    if (!disputeDescription || disputeDescription.length < 10) {
      toast('error', '请详细描述问题（至少10个字）');
      return;
    }

    setActionLoading(true);
    try {
      await disputeApi.create({
        orderId: Number(id),
        reason: disputeReason,
        description: disputeDescription,
        evidenceImages: disputeImages.length > 0 ? disputeImages : undefined,
      });
      toast('success', '纠纷已提交，平台将尽快处理');
      setShowDisputeForm(false);
      fetchExistingDispute();
      fetchOrderDetail();
    } catch (error: unknown) {
      const msg = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : '提交失败';
      toast('error', msg || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 获取托管状态信息
  const getEscrowInfo = (order: Order) => {
    if (!order.escrowStatus) return null;

    const statusConfig: Record<string, { title: string; desc: string; color: string; icon: React.ReactNode }> = {
      'PENDING_RECEIVE': {
        title: '等待确认收货',
        desc: '请确认您已收到账号后再点击确认收货',
        color: 'text-yellow-500',
        icon: <Clock className="w-5 h-5" />
      },
      'IN_ESCROW': {
        title: '资金托管中',
        desc: order.escrowReleaseAt ? `冻结期至 ${new Date(order.escrowReleaseAt).toLocaleString()}` : '冻结期24小时',
        color: 'text-blue-500',
        icon: <Shield className="w-5 h-5" />
      },
      'RELEASED': {
        title: '已释放',
        desc: '资金已打给卖家，交易完成',
        color: 'text-green-500',
        icon: <CheckCircle className="w-5 h-5" />
      },
      'DISPUTED': {
        title: '争议处理中',
        desc: '平台正在处理此订单的争议',
        color: 'text-red-500',
        icon: <AlertTriangle className="w-5 h-5" />
      },
      'REFUNDED': {
        title: '已退款',
        desc: '资金已退回买家',
        color: 'text-slate-500',
        icon: <X className="w-5 h-5" />
      },
    };

    return statusConfig[order.escrowStatus] || null;
  };

  // 计算冻结期剩余
  const getFreezeRemaining = (order: Order) => {
    if (!order.escrowReleaseAt || order.escrowStatus !== 'IN_ESCROW') return null;
    const releaseTime = new Date(order.escrowReleaseAt).getTime();
    const now = Date.now();
    if (releaseTime <= now) return '冻结期即将结束';
    const hours = Math.ceil((releaseTime - now) / (1000 * 60 * 60));
    return `冻结期剩余 ${hours} 小时`;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">订单不存在</p>
        <Link to="/orders" className="btn-primary mt-4">返回订单列表</Link>
      </div>
    );
  }

  const isBuyer = user?.id === order.buyerId;
  const escrowInfo = getEscrowInfo(order);
  const freezeRemaining = getFreezeRemaining(order);

  return (
    <div className="max-w-3xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回订单列表
      </button>

      {/* 订单头部 */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold mb-2">{order.accountTitle || `订单 #${order.id}`}</h1>
            <p className="text-sm text-slate-500">订单号: {order.orderNo}</p>
          </div>
          <span className={`px-3 py-1 rounded text-sm ${
            order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
            order.status === 'PAID' ? 'bg-blue-500/20 text-blue-500' :
            order.status === 'CANCELLED' ? 'bg-slate-500/20 text-slate-500' :
            'bg-yellow-500/20 text-yellow-500'
          }`}>
            {order.status === 'COMPLETED' ? '已完成' :
             order.status === 'PAID' ? '已支付' :
             order.status === 'CANCELLED' ? '已取消' :
             order.status === 'REFUNDED' ? '已退款' : '待支付'}
          </span>
        </div>
      </div>

      {/* 托管状态卡片 */}
      {escrowInfo && (
        <div className={`card mb-6 border ${
          order.escrowStatus === 'IN_ESCROW' ? 'border-blue-500/30 bg-blue-500/5' :
          order.escrowStatus === 'DISPUTED' ? 'border-red-500/30 bg-red-500/5' :
          'border-slate-700'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${order.escrowStatus === 'IN_ESCROW' ? 'bg-blue-500/20' : order.escrowStatus === 'DISPUTED' ? 'bg-red-500/20' : 'bg-slate-800'}`}>
              <span className={escrowInfo.color}>{escrowInfo.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${escrowInfo.color}`}>{escrowInfo.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{escrowInfo.desc}</p>
              {freezeRemaining && (
                <p className="text-sm text-blue-400 mt-2 font-medium">{freezeRemaining}</p>
              )}
              {order.escrowAmount && (
                <p className="text-sm text-slate-600 mt-1">
                  托管金额: ¥{order.escrowAmount}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 已有纠纷提示 */}
      {existingDispute && (
        <div className="card mb-6 border border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-400">存在进行中的纠纷</h3>
              <p className="text-sm text-slate-500 mt-1">
                纠纷编号: {existingDispute.disputeNo} · 状态: {existingDispute.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 订单详情 */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">订单信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">交易类型</p>
            <p className="font-medium">{order.type === 'BUY' ? '购买账号' : '租赁账号'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">订单金额</p>
            <p className="font-medium text-primary text-xl">¥{order.amount}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{isBuyer ? '卖家' : '买家'}</p>
            <p className="font-medium">{isBuyer ? order.seller?.nickname || `用户 #${order.sellerId}` : order.buyer?.nickname || `用户 #${order.buyerId}`}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">下单时间</p>
            <p className="font-medium">{order.createdAt}</p>
          </div>
        </div>
      </div>

      {/* 操作区域 */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">操作</h2>
        <div className="space-y-3">
          {/* 待支付 */}
          {order.status === 'PENDING' && isBuyer && (
            <>
              <button
                onClick={handlePay}
                disabled={actionLoading}
                className="btn-primary w-full py-3"
              >
                <CreditCard className="w-4 h-4 mr-2 inline" />
                {actionLoading ? '处理中...' : '支付（资金托管）'}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn-ghost w-full py-2 text-slate-400"
              >
                取消订单
              </button>
            </>
          )}

          {/* 已支付 - 买家确认收货 */}
          {order.status === 'PAID' && isBuyer && 
           (order.escrowStatus === 'PENDING_RECEIVE' || order.escrowStatus === 'IN_ESCROW') && !existingDispute && (
            <button
              onClick={handleConfirmReceived}
              disabled={actionLoading}
              className="btn-primary w-full py-3"
            >
              <CheckCircle className="w-4 h-4 mr-2 inline" />
              {actionLoading ? '处理中...' : '确认收货'}
            </button>
          )}

          {/* 发起纠纷按钮 - 托管中状态 */}
          {(order.escrowStatus === 'IN_ESCROW' || order.escrowStatus === 'PENDING_RECEIVE') && 
           (order.status === 'PAID' || order.status === 'PROCESSING') && !existingDispute && (
            <button
              onClick={() => setShowDisputeForm(true)}
              className="btn-ghost w-full py-3 text-red-400 border border-red-500/30 hover:bg-red-500/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2 inline" />
              发起纠纷
            </button>
          )}

          {/* 查看纠纷 */}
          {existingDispute && (
            <Link
              to="/disputes"
              className="btn-ghost w-full py-3 text-center block"
            >
              <MessageSquare className="w-4 h-4 mr-2 inline" />
              查看我的纠纷
            </Link>
          )}
        </div>

        {order.escrowStatus === 'IN_ESCROW' && (
          <p className="text-xs text-slate-500 mt-4 text-center">
            冻结期结束后资金将自动打款给卖家，如有问题可在冻结期内发起纠纷
          </p>
        )}
      </div>

      {/* 纠纷表单 */}
      {showDisputeForm && !existingDispute && (
        <div className="card mb-6 border border-red-500/30">
          <h2 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            发起纠纷
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">纠纷原因 *</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-4 py-2 bg-dark border border-slate-700 rounded-lg focus:border-primary outline-none"
              >
                <option value="">请选择</option>
                <option value="ACCOUNT_NOT_AS_DESCRIBED">账号与描述不符</option>
                <option value="NOT_RECEIVED">未收到账号</option>
                <option value="ACCOUNT_RECOVERY">账号找回（卖家恶意找回）</option>
                <option value="FRAUD">欺诈行为</option>
                <option value="OTHER">其他问题</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">详细描述 *</label>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题（至少10个字）..."
                rows={4}
                className="w-full px-4 py-2 bg-dark border border-slate-700 rounded-lg focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">证据图片（可选）</label>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-slate-600 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-sm text-slate-500">点击上传证据图片</p>
                <p className="text-xs text-slate-600 mt-1">支持 PNG, JPG 格式</p>
              </div>
              {disputeImages.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {disputeImages.map((img, idx) => (
                    <span key={idx} className="text-xs bg-slate-800 px-2 py-1 rounded">{img}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSubmitDispute}
                disabled={actionLoading}
                className="btn-primary py-2 flex-1"
              >
                {actionLoading ? '提交中...' : '提交纠纷'}
              </button>
              <button
                onClick={() => setShowDisputeForm(false)}
                className="btn-ghost py-2 flex-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 交易保护说明 */}
      <div className="card bg-slate-800/50">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-1" />
          <div>
            <h3 className="font-medium text-blue-400">交易保护</h3>
            <ul className="text-sm text-slate-500 mt-2 space-y-1">
              <li>• 支付后资金进入平台托管账户</li>
              <li>• 您确认收货后进入24小时冻结期</li>
              <li>• 冻结期内如有问题可发起纠纷</li>
              <li>• 纠纷由平台客服仲裁处理</li>
              <li>• 冻结期结束后资金自动打款给卖家</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;