import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useMyRefunds, useApplyRefund, useCancelRefund, useMyOrders } from '../hooks/useQueries';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { RefundCardSkeleton, RefundableOrderSkeleton } from '../components/ui/Skeleton';
import {
  ArrowLeft, Package, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, DollarSign, ChevronRight, Plus, X, Upload, FileText,
  ExternalLink, Eye, AlertCircle, Gamepad2
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

// Refund Detail Modal
const RefundDetailModal: React.FC<{ refund: Refund; onClose: () => void }> = ({ refund, onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cancelMutation = useCancelRefund();
  const StatusIcon = statusConfig[refund.status]?.icon || Clock;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const confirmCancel = async () => {
    try {
      await cancelMutation.mutateAsync(refund.id);
      showToast('退款申请已撤销', 'info');
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || '操作失败', 'error');
    }
  };

  const formatDate = (d: string) => d
    ? new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">退款详情</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">#{refund.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[refund.status]?.bg} ${statusConfig[refund.status]?.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig[refund.status]?.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="bg-dark rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">退款金额</p>
            <p className="text-3xl font-bold text-primary">¥{refund.amount}</p>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs text-slate-500 mb-2">退款原因</p>
            <p className="text-sm text-slate-200 bg-dark rounded-lg p-3 leading-relaxed">{refund.reason || '未填写'}</p>
          </div>

          {/* Evidence images */}
          {refund.evidenceImages && refund.evidenceImages.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">凭证图片 ({refund.evidenceImages.length})</p>
              <div className="flex gap-2 flex-wrap">
                {refund.evidenceImages.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer"
                    className="w-16 h-16 bg-dark rounded-lg overflow-hidden border border-dark-border hover:border-primary/50 transition-colors">
                    <img src={img} alt={`凭证 ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-dark rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-3">处理进度</p>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-dark-lighter" />
              {[
                { label: '提交申请', time: refund.createdAt, done: true },
                { label: '审核中', time: refund.status === 'PENDING' ? '进行中' : '已完成', done: refund.status !== 'PENDING', active: refund.status === 'PENDING' },
                { label: '退款完成', time: refund.status === 'APPROVED' ? refund.updatedAt : '-', done: refund.status === 'APPROVED' },
              ].map((item, i) => (
                <div key={item.label} className="relative flex items-start gap-3 pb-4 last:pb-0">
                  {/* Filled connector up to this step */}
                  <div
                    className="absolute left-[11px] top-0 w-0.5 -translate-y-full"
                    style={{ height: '12px', background: item.done ? 'rgba(168,85,247,0.3)' : 'transparent' }}
                  />
                  <div className={`relative w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                    item.done
                      ? 'bg-primary/20 text-primary'
                      : item.active
                      ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-400/30 animate-pulse'
                      : 'bg-dark-lighter text-slate-600'
                  }`}>
                    {item.done ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : item.active ? (
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm ${item.done ? 'text-slate-300' : item.active ? 'text-yellow-400 font-medium' : 'text-slate-600'}`}>{item.label}</p>
                    {item.active && <p className="text-[10px] text-yellow-400/70 mt-0.5">等待管理员处理中</p>}
                  </div>
                  <span className="text-xs text-slate-600 pt-0.5">{item.time === '进行中' ? '进行中' : item.time === '已完成' ? '已完成' : formatDate(item.time as string)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order info */}
          {refund.order && (
            <div className="bg-dark rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-3">关联订单</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-lighter rounded-lg overflow-hidden flex-shrink-0">
                  {refund.order.account?.images?.[0] ? (
                    <img src={refund.order.account.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{refund.order.account?.title || `订单 #${refund.orderId}`}</p>
                  <p className="text-xs text-slate-500">{refund.order.type === 'BUY' ? '购买账号' : '租赁使用'}</p>
                </div>
                <Link
                  to={`/orders${refund.orderId ? `?orderId=${refund.orderId}` : ''}`}
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-white hover:bg-dark rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              to={`/orders${refund.orderId ? `?orderId=${refund.orderId}` : ''}`}
              onClick={onClose}
              className="btn-secondary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              查看订单
            </Link>
            {refund.status === 'PENDING' && (
              <>
                {showCancelConfirm ? (
                  <div className="flex-1">
                    <ConfirmInline
                      message="确定要撤销此退款申请吗？"
                      onConfirm={confirmCancel}
                      onCancel={() => setShowCancelConfirm(false)}
                      confirmLabel="撤销"
                      isPending={cancelMutation.isPending}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={cancelMutation.isPending}
                    className="btn-ghost flex-1 !py-2.5 text-sm !text-red-400 !border-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {cancelMutation.isPending ? '撤销中...' : '撤销申请'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RefundsPage: React.FC = () => {
  usePageTitle('退款记录');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'list' | 'apply'>('list');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cancelRefundId, setCancelRefundId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [amountError, setAmountError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');

  const { data: refundsData, isLoading, isError, refetch, isFetching } = useMyRefunds();
  const { data: ordersData, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useMyOrders();
  const applyMutation = useApplyRefund();
  const cancelMutation = useCancelRefund();

  const refunds: Refund[] = refundsData?.data?.data || [];
  const orders = ordersData?.data?.data?.records || [];

  const refundStats = useMemo(() => {
    const totalRefunded = refunds
      .filter(r => r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = refunds
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + r.amount, 0);
    const successCount = refunds.filter(r => r.status === 'APPROVED').length;
    const totalProcessed = refunds.filter(r => ['APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status)).length;
    const successRate = totalProcessed > 0 ? Math.round((successCount / totalProcessed) * 100) : 0;
    return { totalRefunded, pendingAmount, successCount, successRate, totalCount: refunds.length };
  }, [refunds]);

  // Orders eligible for refund (PAID, PROCESSING or COMPLETED within window, no existing pending refund)
  const refundableOrders = orders.filter(
    (o: any) =>
      ['PAID', 'PROCESSING', 'COMPLETED'].includes(o.status) &&
      !refunds.some((r) => r.orderId === o.id && r.status === 'PENDING')
  );

  if (!token) {
    navigate('/login');
    return null;
  }

  const handleOpenApply = (order?: any) => {
    setAmountError('');
    setReasonError('');
    if (order) {
      setSelectedOrder(order);
      setRefundAmount(order.amount?.toString() || '');
    }
    setShowApplyModal(true);
  };

  const handleApplyRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');
    setReasonError('');
    let hasError = false;
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      setAmountError('请输入有效的退款金额');
      hasError = true;
    } else if (parseFloat(refundAmount) > (selectedOrder?.amount ?? 0)) {
      setAmountError(`金额不能超过 ¥${selectedOrder?.amount?.toFixed(2)}`);
      hasError = true;
    }
    if (!refundReason.trim()) {
      setReasonError('请填写退款原因');
      hasError = true;
    }
    if (hasError) return;
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

  const handleCancelRefund = (refundId: number) => {
    setCancelRefundId(refundId);
  };

  const confirmCancelRefund = async () => {
    if (cancelRefundId == null) return;
    try {
      await cancelMutation.mutateAsync(cancelRefundId);
      showToast('已取消退款申请', 'success');
      setCancelRefundId(null);
    } catch {
      showToast('取消失败', 'error');
      setCancelRefundId(null);
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

      {/* Refund stats summary */}
      {refunds.length > 0 && activeTab === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">总退款申请</p>
            <p className="text-xl font-bold text-white">{refundStats.totalCount}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">已退款总额</p>
            <p className="text-xl font-bold text-green-400">¥{refundStats.totalRefunded.toFixed(2)}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">待处理金额</p>
            <p className="text-xl font-bold text-yellow-400">¥{refundStats.pendingAmount.toFixed(2)}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">成功率</p>
            <p className="text-xl font-bold text-primary">{refundStats.successRate}%</p>
          </div>
        </div>
      )}

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
                <RefundCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-slate-400">加载失败</h3>
              <p className="text-slate-500 text-sm mb-4">无法获取退款记录</p>
              <button onClick={() => refetch()} className="btn-primary text-sm inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
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
            <div className="divide-y divide-dark-border relative">
              {/* Refetch shimmer overlay */}
              {isFetching && !isLoading && (
                <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
                  <div className="h-1 bg-dark-lighter overflow-hidden">
                    <div className="h-full bg-primary/30 animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
              {refunds.map((refund) => {
                const config = statusConfig[refund.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                return (
                  <div key={refund.id}
                    onClick={() => setSelectedRefund(refund)}
                    className="py-4 px-2 cursor-pointer hover:bg-dark-lighter/30 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color} ${refund.status === 'PENDING' ? 'animate-pulse' : ''}`}>
                            {config.label}
                          </span>
                          <span className="text-sm text-slate-500 font-mono">#{refund.orderId}</span>
                        </div>
                        {/* Visual 3-step timeline */}
                        <div className="flex items-center gap-0 mb-3">
                          {([
                            { label: '申请', icon: FileText, idx: 0 },
                            { label: '审核', icon: Clock, idx: 1 },
                            { label: refund.status === 'REFUNDED' ? '已退款' : refund.status === 'REJECTED' || refund.status === 'CANCELLED' ? '已拒绝' : '处理中', icon: refund.status === 'REJECTED' || refund.status === 'CANCELLED' ? XCircle : refund.status === 'REFUNDED' || refund.status === 'APPROVED' ? CheckCircle : Clock, idx: 2 },
                          ] as const).map(({ label, icon: Icon, idx }) => {
                            const statusOrder = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED'];
                            const refundIdx = statusOrder.indexOf(refund.status);
                            const isDone = idx < refundIdx && refund.status !== 'PENDING';
                            const isActive = (idx === refundIdx && refund.status === 'PENDING') || (refund.status === 'APPROVED' && idx < 2);
                            const isRejected = refund.status === 'REJECTED' || refund.status === 'CANCELLED';
                            const isSuccess = refund.status === 'REFUNDED';
                            const color = isSuccess ? 'text-green-400' : isRejected ? 'text-red-400' : isActive ? 'text-yellow-400' : 'text-slate-600';
                            const bg = isSuccess ? 'bg-green-400' : isRejected ? 'bg-red-400' : isActive ? 'bg-yellow-400' : 'bg-slate-700';
                            return (
                              <React.Fragment key={idx}>
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${bg} ${idx === 1 && refund.status === 'PENDING' ? 'animate-pulse' : ''}`}>
                                    <Icon className={`w-3 h-3 ${isActive || isDone || isSuccess || isRejected ? 'text-white' : 'text-slate-600'}`} />
                                  </div>
                                  <span className={`text-[9px] ${color}`}>{label}</span>
                                </div>
                                {idx < 2 && (
                                  <div className={`flex-1 h-0.5 mb-4 rounded-full ${
                                    isRejected ? (idx === 0 ? 'bg-red-500/50' : 'bg-slate-700') :
                                    idx === 0 && (isActive || isDone) ? 'bg-green-400/60' :
                                    idx === 0 && refund.status === 'APPROVED' ? 'bg-green-400/60' :
                                    isActive ? 'bg-yellow-400/60' : 'bg-slate-700'
                                  }`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        <p className="text-sm text-slate-300 mb-1">{refund.reason}</p>
                        <p className="text-xs text-slate-600">{formatDate(refund.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-red-400">-¥{refund.amount.toFixed(2)}</p>
                        {refund.status === 'PENDING' && (
                          cancelRefundId === refund.id ? (
                            <div className="mt-1">
                              <ConfirmInline
                                message="确定取消此退款申请？"
                                onConfirm={confirmCancelRefund}
                                onCancel={() => setCancelRefundId(null)}
                                confirmLabel="取消"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCancelRefund(refund.id)}
                              disabled={cancelMutation.isPending}
                              className="text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1 flex items-center gap-1"
                            >
                              {cancelMutation.isPending ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : null}
                              取消申请
                            </button>
                          )
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
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <RefundableOrderSkeleton key={i} />
              ))}
            </div>
          ) : ordersError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400/60" />
              <p className="text-slate-400 mb-4">加载订单失败</p>
              <button onClick={() => refetchOrders()} className="btn-primary text-sm px-6">
                重新加载
              </button>
            </div>
          ) : refundableOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500/50" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-slate-400">没有可退款的订单</h3>
              <p className="text-slate-600 text-sm mb-4">已完成或已取消的订单无法申请退款</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
                  查看我的订单
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/accounts" className="btn-secondary inline-flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  逛逛账号市场
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {refundableOrders.map((order: any) => (
                <div key={order.id} className="py-4 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {order.account?.images?.[0] ? (
                      <img
                        src={order.account.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Gamepad2 className="w-6 h-6 text-primary" />
                    )}
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
          onClick={() => {
            if (applyMutation.isPending) return;
            setAmountError('');
            setReasonError('');
            setShowApplyModal(false);
          }}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg overflow-hidden flex items-center justify-center">
                        {selectedOrder.account?.images?.[0] ? (
                          <img src={selectedOrder.account.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <Package className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{selectedOrder.account?.title || `订单 #${selectedOrder.orderNo.slice(-6)}`}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${selectedOrder.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {selectedOrder.type === 'BUY' ? '购买' : '租赁'}
                          </span>
                          <span className="text-[11px] text-slate-500">订单金额 ¥{selectedOrder.amount?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {selectedOrder.status && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        selectedOrder.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                        selectedOrder.status === 'PROCESSING' ? 'bg-yellow-500/20 text-yellow-400' :
                        selectedOrder.status === 'COMPLETED' ? 'bg-slate-500/20 text-slate-400' :
                        'bg-dark-lighter text-slate-500'
                      }`}>
                        {selectedOrder.status === 'PAID' ? '已支付' :
                         selectedOrder.status === 'PROCESSING' ? '处理中' :
                         selectedOrder.status === 'COMPLETED' ? '已完成' :
                         selectedOrder.status}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-slate-400">退款金额 <span className="text-red-400">*</span></label>
                  {selectedOrder && (
                    <button
                      type="button"
                      onClick={() => setRefundAmount(selectedOrder.amount?.toFixed(2) || '')}
                      className="text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      全部退款 ¥{selectedOrder.amount?.toFixed(2)}
                    </button>
                  )}
                </div>
                {/* Visual slider */}
                {selectedOrder && (
                  <div className="mb-3">
                    <input
                      type="range"
                      min={0}
                      max={selectedOrder.amount || 100}
                      step={0.01}
                      value={refundAmount || 0}
                      onChange={(e) => { setRefundAmount(e.target.value); setAmountError(''); }}
                      className="w-full h-1.5 bg-dark-lighter rounded-full appearance-none cursor-pointer accent-primary"
                      style={{
                        background: selectedOrder.amount > 0
                          ? `linear-gradient(to right, rgb(99,102,241) 0%, rgb(99,102,241) ${(parseFloat(refundAmount || '0') / selectedOrder.amount) * 100}%, #1e293b ${(parseFloat(refundAmount || '0') / selectedOrder.amount) * 100}%, #1e293b 100%)`
                          : undefined,
                      }}
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                      <span>¥0</span>
                      <span className={`font-medium ${parseFloat(refundAmount || '0') === selectedOrder.amount ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selectedOrder.amount > 0 ? ((parseFloat(refundAmount || '0') / selectedOrder.amount) * 100).toFixed(0) : 0}%
                        {parseFloat(refundAmount || '0') === selectedOrder.amount ? ' 全额' : ''}
                      </span>
                      <span>¥{selectedOrder.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">¥</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => { setRefundAmount(e.target.value); setAmountError(''); }}
                    className={`input pl-10 text-xl font-bold w-full ${amountError ? '!border-red-500/50' : ''}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max={selectedOrder?.amount}
                    required
                    autoFocus
                  />
                </div>
                {amountError ? (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{amountError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">最高可退 ¥{selectedOrder?.amount?.toFixed(2) || '0.00'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">退款原因 <span className="text-red-400">*</span></label>
                <textarea
                  value={refundReason}
                  onChange={(e) => { setRefundReason(e.target.value); setReasonError(''); }}
                  className={`input h-24 resize-none w-full ${reasonError ? '!border-red-500/50' : ''}`}
                  placeholder="请详细描述退款原因..."
                  required
                />
                {reasonError ? (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{reasonError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
                    <span className={refundReason.length > 450 ? 'text-yellow-400' : refundReason.length >= 500 ? 'text-red-400' : 'text-slate-600'}>
                      {refundReason.length}
                    </span><span className="text-slate-700">/500</span>
                  </p>
                )}
                {/* Quick reason templates */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {['账号与描述不符', '卖家无法交付', '临时不想买了', '其他原因'].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRefundReason(reason)}
                      className={`px-3 py-1 rounded-full text-xs transition-all border ${
                        refundReason === reason
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-dark border-dark-border text-slate-500 hover:text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
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
      {/* Refund Detail Modal */}
      {selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
        />
      )}
    </div>
  );
};

export default RefundsPage;
