import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { useMyRefunds, useApplyRefund, useCancelRefund, useMyOrders } from '../hooks/useQueries';
import {
  ArrowLeft, Package, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, DollarSign, ChevronRight, Plus, X, Upload, FileText
} from 'lucide-react';

interface Refund {
  id: number;
  orderId: number;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  evidenceImages?: string[];
  createdAt: string;
  updatedAt?: string;
  order?: {
    account?: { title: string; images?: string[] };
    type: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING: { label: '处理中', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  APPROVED: { label: '已通过', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  REJECTED: { label: '已拒绝', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
  CANCELLED: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: XCircle },
};

const RefundsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'list' | 'apply'>('list');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');

  const { data: refundsData, isLoading } = useMyRefunds();
  const { data: ordersData } = useMyOrders();
  const applyMutation = useApplyRefund();
  const cancelMutation = useCancelRefund();

  const refunds: Refund[] = refundsData?.data?.data || [];
  const orders = ordersData?.data?.data?.records || [];

  // Orders eligible for refund (PAID or COMPLETED, no existing pending refund)
  const refundableOrders = orders.filter(
    (o: any) =>
      ['PAID', 'PROCESSING'].includes(o.status) &&
      !refunds.some((r) => r.orderId === o.id && r.status === 'PENDING')
  );

  if (!token) {
    navigate('/login');
    return null;
  }

  const handleOpenApply = (order?: any) => {
    if (order) {
      setSelectedOrder(order);
      setRefundAmount(order.amount?.toString() || '');
    }
    setShowApplyModal(true);
  };

  const handleApplyRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !refundAmount || !refundReason.trim()) {
      showToast('请填写完整的退款信息', 'warning');
      return;
    }
    try {
      await applyMutation.mutateAsync({
        orderId: selectedOrder.id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
        evidenceImages: evidenceImages.length > 0 ? evidenceImages : undefined,
      });
      showToast('退款申请已提交', 'success');
      setShowApplyModal(false);
      setRefundAmount('');
      setRefundReason('');
      setEvidenceImages([]);
      setSelectedOrder(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || '申请失败，请重试', 'error');
    }
  };

  const handleCancelRefund = async (refundId: number) => {
    if (!confirm('确定取消此退款申请？')) return;
    try {
      await cancelMutation.mutateAsync(refundId);
      showToast('已取消退款申请', 'success');
    } catch {
      showToast('取消失败', 'error');
    }
  };

  const addImage = () => {
    if (!newImage || evidenceImages.length >= 3) return;
    try {
      new URL(newImage);
      setEvidenceImages([...evidenceImages, newImage]);
      setNewImage('');
    } catch {
      showToast('请输入有效的图片URL', 'error');
    }
  };

  const pendingCount = refunds.filter((r) => r.status === 'PENDING').length;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-primary" />
            退款管理
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-400 mt-1">
              有 <span className="font-medium">{pendingCount}</span> 条退款申请处理中
            </p>
          )}
        </div>
        <button onClick={() => handleOpenApply()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          申请退款
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'list', label: '退款记录' },
          { key: 'apply', label: '可退款订单' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Refund List */}
      {activeTab === 'list' && (
        <div className="card">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 skeleton rounded-xl" />
              ))}
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-slate-400">暂无退款记录</h3>
              <p className="text-slate-600 text-sm mb-6">您的退款记录将显示在这里</p>
              <button onClick={() => setActiveTab('apply')} className="btn-primary inline-flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                申请退款
              </button>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {refunds.map((refund) => {
                const config = statusConfig[refund.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                return (
                  <div key={refund.id} className="py-4 px-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-sm text-slate-500 font-mono">#{refund.orderId}</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-1">{refund.reason}</p>
                        <p className="text-xs text-slate-600">{formatDate(refund.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-red-400">-¥{refund.amount.toFixed(2)}</p>
                        {refund.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelRefund(refund.id)}
                            disabled={cancelMutation.isPending}
                            className="text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50 mt-1"
                          >
                            取消申请
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
      )}

      {/* Refundable Orders */}
      {activeTab === 'apply' && (
        <div className="card">
          {refundableOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500/50" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-slate-400">没有可退款的订单</h3>
              <p className="text-slate-600 text-sm mb-6">已完成或已取消的订单无法申请退款</p>
              <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
                查看我的订单
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {refundableOrders.map((order: any) => (
                <div key={order.id} className="py-4 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.account?.title || `订单 #${order.orderNo.slice(-6)}`}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className={order.type === 'BUY' ? 'text-blue-400' : 'text-purple-400'}>
                          {order.type === 'BUY' ? '购买' : '租赁'}
                        </span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">¥{order.amount.toFixed(2)}</p>
                      <button
                        onClick={() => handleOpenApply(order)}
                        className="text-sm text-primary hover:text-primary-light transition-colors mt-1"
                      >
                        申请退款 →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Refund Modal */}
      {showApplyModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowApplyModal(false)}
        >
          <div className="card w-full max-w-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                申请退款
              </h2>
              <button onClick={() => setShowApplyModal(false)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyRefund} className="space-y-4">
              {selectedOrder && (
                <div className="p-3 bg-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedOrder.account?.title || `订单 #${selectedOrder.orderNo.slice(-6)}`}</p>
                      <p className="text-xs text-slate-500">订单金额 ¥{selectedOrder.amount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">退款金额 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">¥</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="input pl-10 text-xl font-bold w-full"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max={selectedOrder?.amount}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">最高可退 ¥{selectedOrder?.amount?.toFixed(2) || '0.00'}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">退款原因 <span className="text-red-400">*</span></label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="input h-24 resize-none w-full"
                  placeholder="请详细描述退款原因..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">凭证截图 <span className="text-slate-500">(可选，最多3张)</span></label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    className="input flex-1"
                    placeholder="输入图片URL"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={!newImage || evidenceImages.length >= 3}
                    className="btn-secondary px-3 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {evidenceImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {evidenceImages.map((img, i) => (
                      <div key={i} className="relative aspect-video bg-dark rounded overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEvidenceImages(evidenceImages.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 btn-secondary">
                  取消
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending || !refundAmount || !refundReason.trim()}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {applyMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {applyMutation.isPending ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundsPage;
