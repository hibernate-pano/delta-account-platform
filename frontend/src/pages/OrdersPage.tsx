import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { OrderCardSkeleton } from '../components/ui/Skeleton';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { StarRating } from '../components/ui/StarRating';
import { ScrollToTop } from '../components/ui/ScrollToTop';
import { usePageTitle } from '../hooks/usePageTitle';
import { useMyOrders, usePayOrder, useCancelOrder, useCompleteOrder, useReviewOrder } from '../hooks/useQueries';
import {
  Package, ChevronRight, FileText, Clock, CheckCircle, XCircle,
  AlertCircle, ShoppingBag, CreditCard, RefreshCw,
  Calendar, Gamepad2, ZoomIn, ZoomOut, X, ExternalLink, Copy, MessageCircle,
  Shield, User, Star, Search, TrendingUp, TrendingDown, Sparkles
} from 'lucide-react';

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
    gameRank?: string;
    skinCount?: number;
    gameType?: string;
    sellerNickname?: string;
    sellerUsername?: string;
    sellerAvatar?: string;
    verificationStatus?: string;
    sellerCreditScore?: number;
  };
}

// Order progress steps
const BUY_STEPS = [
  { key: 'PENDING', label: '待支付', icon: CreditCard },
  { key: 'PAID', label: '已支付', icon: CheckCircle },
  { key: 'PROCESSING', label: '处理中', icon: RefreshCw },
  { key: 'COMPLETED', label: '已完成', icon: CheckCircle },
];

const RENT_STEPS = [
  { key: 'PENDING', label: '待支付', icon: CreditCard },
  { key: 'PAID', label: '已支付', icon: CheckCircle },
  { key: 'PROCESSING', label: '使用中', icon: Gamepad2 },
  { key: 'COMPLETED', label: '已结束', icon: CheckCircle },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING: { label: '待支付', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  PAID: { label: '已支付', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: CheckCircle },
  PROCESSING: { label: '处理中', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: RefreshCw },
  COMPLETED: { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  CANCELLED: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: XCircle },
  REFUNDED: { label: '已退款', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
};

const getStepIndex = (status: string): number => {
  const idx = BUY_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatMonth = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
};

// Order Progress Stepper
const OrderStepper: React.FC<{ status: string; type: 'BUY' | 'RENT' }> = ({ status, type }) => {
  const steps = type === 'RENT' ? RENT_STEPS : BUY_STEPS;
  const currentIdx = getStepIndex(status);
  const isTerminal = ['CANCELLED', 'REFUNDED'].includes(status);

  if (isTerminal) return null;

  return (
    <div className="flex items-center gap-1 my-2">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const StepIcon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  done
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-dark-lighter text-slate-600'
                } ${active && !done ? 'ring-2 ring-primary/50 animate-pulse' : ''} ${done && active ? 'shadow-lg shadow-primary/50 ring-2 ring-primary/30' : ''}`}
              >
                <StepIcon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap ${done ? 'text-primary' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 rounded-full transition-all ${i < currentIdx ? 'bg-primary shadow-[0_0_6px_rgba(99,102,241,0.5)]' : 'bg-dark-lighter'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Order Detail Modal
const OrderDetailModal: React.FC<{ order: Order; onClose: () => void; onReview: (order: Order) => void }> = ({ order, onClose, onReview }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const payMutation = usePayOrder();
  const cancelMutation = useCancelOrder();
  const [pendingCancel, setPendingCancel] = useState(false);
  const isBuyer = user?.id === order.buyerId;
  const isSeller = user?.id === order.sellerId;
  const isTerminal = ['CANCELLED', 'REFUNDED'].includes(order.status);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopyOrderNo = () => {
    navigator.clipboard.writeText(order.orderNo);
    showToast('订单号已复制', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">订单详情</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono text-slate-500" title={`完整订单号: ${order.orderNo}`}>#{order.orderNo}</span>
              <button onClick={handleCopyOrderNo} className="text-slate-600 hover:text-white transition-colors" title="复制订单号">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.color} flex items-center gap-1`}>
              <span className="w-1.5 h-1.5 bg-current rounded-full" />
              {statusConfig[order.status]?.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Account Preview */}
          <div className="flex items-center gap-4 bg-dark rounded-xl p-4">
            <div className="w-20 h-14 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
              {order.account?.images?.[0] ? (
                <img src={order.account.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-700" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{order.account?.title || `账号 #${order.accountId}`}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                {order.account?.gameRank && <span className="badge badge-primary">{order.account.gameRank}</span>}
                {order.account?.skinCount && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400/70" /> {order.account.skinCount} 皮肤</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">¥{order.amount}</p>
              <p className="text-xs text-slate-500">{order.type === 'BUY' ? '购买' : '租赁'}</p>
            </div>
          </div>

          {/* Terminal State Badge for cancelled/refunded */}
          {isTerminal && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${statusConfig[order.status]?.bg}`}>
              {order.status === 'CANCELLED' ? (
                <XCircle className={`w-6 h-6 flex-shrink-0 ${statusConfig[order.status]?.color}`} />
              ) : (
                <AlertCircle className={`w-6 h-6 flex-shrink-0 ${statusConfig[order.status]?.color}`} />
              )}
              <div>
                <p className={`font-medium text-sm ${statusConfig[order.status]?.color}`}>
                  {statusConfig[order.status]?.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">该订单已{order.status === 'REFUNDED' ? '退款' : '取消'}，如有疑问请联系客服</p>
              </div>
            </div>
          )}

          {/* Progress Stepper */}
          {!isTerminal && (
            <div>
              <p className="text-xs text-slate-500 mb-3">订单进度</p>
              <OrderStepper status={order.status} type={order.type} />
            </div>
          )}

          {/* Order Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '订单类型', value: order.type === 'BUY' ? '购买账号' : '租赁使用' },
              { label: '下单时间', value: formatDate(order.createdAt) },
              { label: '交易对方', value: isBuyer ? '卖家' : '买家' },
              { label: '押金', value: order.deposit ? `¥${order.deposit}` : '无' },
              ...(order.type === 'RENT' ? [
                { label: '租期时长', value: order.rentHours ? `${order.rentHours} 小时` : '-' },
                { label: '开始时间', value: order.rentStart ? formatDate(order.rentStart) : '-' },
              ] : []),
            ].map((item) => (
              <div key={item.label} className="bg-dark rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-slate-200">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Seller info */}
          {(order.account?.sellerNickname || order.account?.sellerUsername) && (
            <div className="mt-3 p-3 bg-dark rounded-xl border border-dark-border">
              <p className="text-[10px] text-slate-600 mb-2">交易对方</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                  {order.account?.sellerAvatar ? (
                    <img src={order.account.sellerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {order.account?.sellerNickname || order.account?.sellerUsername}
                    </p>
                    {order.account?.verificationStatus === 'VERIFIED' && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> 已认证
                      </span>
                    )}
                    {order.account?.sellerCreditScore != null && (
                      <div className="flex-shrink-0 flex items-center gap-0.5">
                        <StarRating score={order.account!.sellerCreditScore || 50} size="xs" />
                        <span className="text-[10px] text-yellow-400/70 ml-0.5">{order.account.sellerCreditScore}分</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isBuyer ? '点击联系卖家' : '点击联系买家'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/messages?accountId=${order.accountId}`); }}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-primary text-xs font-medium transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  联系
                </button>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-dark rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-3">订单时间线</p>
            <div className="space-y-3">
              {(order.type === 'RENT'
                ? [
                    { label: '下单', time: order.createdAt, done: true },
                    { label: '支付', time: ['PAID', 'PROCESSING', 'COMPLETED'].includes(order.status) ? '—' : '待支付', done: ['PAID', 'PROCESSING', 'COMPLETED'].includes(order.status) },
                    { label: '使用中', time: order.status === 'PROCESSING' ? '—' : '—', done: ['PROCESSING', 'COMPLETED'].includes(order.status) },
                    { label: '完成', time: '—', done: order.status === 'COMPLETED' },
                  ]
                : [
                    { label: '下单', time: order.createdAt, done: true },
                    { label: '支付', time: order.status !== 'PENDING' ? '—' : '待支付', done: ['PAID', 'PROCESSING', 'COMPLETED'].includes(order.status) },
                    { label: '交付', time: ['PROCESSING', 'COMPLETED'].includes(order.status) ? '—' : '—', done: order.status === 'COMPLETED' },
                    { label: '完成', time: '—', done: order.status === 'COMPLETED' },
                  ]
              ).map((item, i) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-primary/20 text-primary shadow-[0_0_6px_rgba(99,102,241,0.4)]' : 'bg-dark-lighter text-slate-600'}`}>
                    {item.done ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${item.done ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</p>
                  </div>
                  <span className="text-xs text-slate-600">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link
              to={`/accounts/${order.accountId}`}
              onClick={onClose}
              className="btn-secondary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              查看账号
            </Link>
            {isBuyer && order.status === 'COMPLETED' && (
              <Link
                to={`/refunds?orderId=${order.id}`}
                onClick={onClose}
                className="btn-secondary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                申请退款
              </Link>
            )}
            {order.status === 'COMPLETED' && (
              <button
                onClick={() => { onClose(); onReview(order); }}
                className="btn-secondary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4 text-yellow-400" />
                评价
              </button>
            )}
            {order.status === 'PENDING' && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await payMutation.mutateAsync(order.id);
                    showToast('支付成功！', 'success');
                    onClose();
                  } catch (err: any) {
                    showToast(err.response?.data?.message || '支付失败', 'error');
                  }
                }}
                disabled={payMutation.isPending}
                className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {payMutation.isPending ? '支付中...' : '立即支付'}
              </button>
            )}
            {order.status === 'PENDING' && !pendingCancel && (
              <button
                onClick={(e) => { e.stopPropagation(); setPendingCancel(true); }}
                disabled={cancelMutation.isPending}
                className="btn-secondary !py-2.5 !px-3 text-sm text-slate-400 hover:text-red-400 disabled:opacity-50"
              >
                取消订单
              </button>
            )}
            {order.status === 'PENDING' && pendingCancel && (
              <ConfirmInline
                message="确定要取消该订单吗？"
                confirmLabel="确认取消"
                onConfirm={async (e: any) => {
                  e?.stopPropagation?.();
                  try {
                    await cancelMutation.mutateAsync(order.id);
                    showToast('订单已取消', 'success');
                    onClose();
                  } catch (err: any) {
                    showToast(err.response?.data?.message || '取消失败', 'error');
                  } finally {
                    setPendingCancel(false);
                  }
                }}
                onCancel={() => setPendingCancel(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Single Order Card
const OrderCard: React.FC<{ order: Order; onViewDetail: (order: Order) => void; onReview: (order: Order) => void }> = React.memo(({ order, onViewDetail, onReview }) => {
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [countdownUrgent, setCountdownUrgent] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState('');
  const [paymentRemainingMins, setPaymentRemainingMins] = useState<number | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const payMutation = usePayOrder();
  const cancelMutation = useCancelOrder();
  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const isTerminal = ['CANCELLED', 'REFUNDED'].includes(order.status);
  const isPending = order.status === 'PENDING';

  const handleToggleExpand = useCallback(() => setExpanded(v => !v), []);
  const handleViewDetail = useCallback(() => onViewDetail(order), [order, onViewDetail]);
  const handleReview = useCallback(() => onReview(order), [order, onReview]);
  const handleContact = useCallback(() => navigate(`/messages?accountId=${order.accountId}`), [navigate, order.accountId]);
  const handleViewAccount = useCallback(() => navigate(`/accounts/${order.accountId}`), [navigate, order.accountId]);
  const handlePay = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await payMutation.mutateAsync(order.id);
      showToast('支付成功！', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || '支付失败', 'error');
    }
  }, [order.id, payMutation, showToast]);

  // Live countdown for active rentals
  React.useEffect(() => {
    if (order.type !== 'RENT' || order.status !== 'PROCESSING' || !order.rentEnd) return;
    const update = () => {
      const remaining = new Date(order.rentEnd!).getTime() - Date.now();
      if (remaining <= 0) { setCountdown('已到期'); setCountdownUrgent(false); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setCountdown(h > 0 ? `剩余 ${h}小时${m}分` : `剩余 ${m}分钟`);
      setCountdownUrgent(h === 0); // urgent when < 1 hour
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [order.type, order.status, order.rentEnd]);

  // Payment deadline countdown for PENDING orders (30 min window)
  React.useEffect(() => {
    if (!isPending) return;
    const PAYMENT_WINDOW = 30 * 60 * 1000; // 30 minutes
    const update = () => {
      const elapsed = Date.now() - new Date(order.createdAt).getTime();
      const remaining = PAYMENT_WINDOW - elapsed;
      if (remaining <= 0) { setPaymentCountdown('已超时'); setPaymentRemainingMins(0); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setPaymentCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      setPaymentRemainingMins(m);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isPending, order.createdAt]);

  return (
    <div
      className={`card overflow-hidden transition-all duration-200 ${
        expanded ? 'border-primary/30 shadow-lg shadow-primary/5' : 'hover:border-slate-700'
      }`}
    >
      {/* Main row — always visible */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer group"
        onClick={handleToggleExpand}
      >
        {/* Account thumbnail — click to view account */}
        <div
          className="w-14 h-14 bg-dark rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer group/thumb"
          onClick={(e) => { e.stopPropagation(); handleViewAccount(); }}
          title="查看账号"
        >
          {order.account?.images?.[0] ? (
            <img src={order.account.images[0]} alt="" className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
          )}
          {/* Type badge */}
          <div className={`absolute -top-1 -left-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg ${
            order.type === 'BUY' ? 'bg-blue-500 text-white shadow-blue-500/30' : 'bg-purple-500 text-white shadow-purple-500/30'
          }`}>
            {order.type === 'BUY' ? '买' : '租'}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {order.account?.title || `账号 #${order.accountId}`}
            </p>
          </div>
          <p className="text-xs text-slate-500 font-mono">#{order.orderNo.slice(-8)}</p>
        </div>

        {/* Amount + Status */}
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-white">
            ¥{order.amount.toFixed(0)}
            {order.type === 'RENT' && order.deposit && order.deposit > 0 && (
              <span className="text-xs font-normal text-slate-500 ml-1">+押金¥{order.deposit}</span>
            )}
          </div>
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.color}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {statusConfig[order.status]?.label || order.status}
          </div>
          {isPending && paymentCountdown && (
            <div className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              paymentCountdown === '已超时' || (paymentRemainingMins !== null && paymentRemainingMins < 5)
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              <Clock className="w-2.5 h-2.5" />
              {paymentCountdown === '已超时' ? '支付超时' : paymentCountdown}
            </div>
          )}
          {countdown && !isPending && (
            <div className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              countdownUrgent ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-orange-500/20 text-orange-400'
            }`}>
              <Clock className="w-2.5 h-2.5" />
              {countdown}
            </div>
          )}
        </div>

        {/* Expand chevron */}
        <ChevronRight className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-dark-border px-4 pb-4 pt-2 animate-fade-in">
          {/* Progress stepper */}
          {!isTerminal && (
            <>
              <p className="text-xs text-slate-500 mb-1">订单进度</p>
              <OrderStepper status={order.status} type={order.type} />
            </>
          )}

          {/* Account details */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {order.account?.gameType && (
              <div className="bg-dark rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-500 mb-0.5">游戏</p>
                <p className="text-xs font-medium text-slate-300">{order.account.gameType}</p>
              </div>
            )}
            {order.account?.gameRank && (
              <div className="bg-dark rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-500 mb-0.5">段位</p>
                <p className="text-xs font-medium text-slate-300">{order.account.gameRank}</p>
              </div>
            )}
            {order.account?.skinCount && (
              <div className="bg-dark rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-500 mb-0.5">皮肤数</p>
                <p className="text-xs font-medium text-slate-300">{order.account.skinCount} 个</p>
              </div>
            )}
            <div className="bg-dark rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-500 mb-0.5">订单类型</p>
              <p className="text-xs font-medium text-slate-300">{order.type === 'BUY' ? '购买账号' : '租赁使用'}</p>
            </div>
            <div className="bg-dark rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-500 mb-0.5">下单时间</p>
              <p className="text-xs font-medium text-slate-300">{formatDate(order.createdAt)}</p>
            </div>
            {order.type === 'RENT' && order.rentHours && (
              <div className="bg-dark rounded-lg px-3 py-2 col-span-2">
                <p className="text-[10px] text-slate-500 mb-0.5">租期</p>
                <p className="text-xs font-medium text-slate-300">
                  {order.rentHours} 小时
                  {order.rentStart && ` · ${formatDate(order.rentStart)}`}
                  {order.rentEnd && ` ~ ${formatDate(order.rentEnd)}`}
                </p>
              </div>
            )}
            {order.deposit && order.deposit > 0 && (
              <div className="bg-dark rounded-lg px-3 py-2 col-span-2">
                <p className="text-[10px] text-slate-500 mb-0.5">押金</p>
                <p className="text-xs font-medium text-slate-300">
                  ¥{order.deposit}
                  <span className="text-slate-500 ml-1">(账号归还后全额退还)</span>
                </p>
              </div>
            )}
          </div>

          {/* Seller info for PAID/PROCESSING — buyer needs to know who to contact */}
          {(order.status === 'PAID' || order.status === 'PROCESSING') && (
            <div className="mt-3 p-3 bg-dark rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  {order.account?.sellerAvatar ? (
                    <img src={order.account.sellerAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white truncate">
                      {order.account?.sellerNickname || order.account?.sellerUsername || '卖家'}
                    </p>
                    {order.account?.verificationStatus === 'VERIFIED' && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> 已认证
                      </span>
                    )}
                    {order.account?.sellerCreditScore != null && (
                      <div className="flex-shrink-0 flex items-center gap-0.5">
                        <StarRating score={order.account!.sellerCreditScore || 50} size="xs" />
                        <span className="text-[10px] text-yellow-400/70 ml-0.5">{order.account.sellerCreditScore}分</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {order.status === 'PROCESSING' ? '账号交付中，请耐心等待' : '等待卖家交付账号，请保持在线'}
                  </p>
                </div>
                <button
                  onClick={handleContact}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-primary text-xs font-medium transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  联系
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleViewDetail}
              className="btn-secondary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              订单详情
            </button>
            <button
              onClick={handleViewAccount}
              className="btn-secondary !py-2 !px-3 text-xs flex items-center justify-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {isPending && (
              <button
                onClick={handlePay}
                disabled={payMutation.isPending}
                className="btn-primary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {payMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                {payMutation.isPending ? '支付中...' : '立即支付'}
              </button>
            )}
            {isPending && !pendingCancel && (
              <button
                onClick={() => setPendingCancel(true)}
                disabled={cancelMutation.isPending}
                className="btn-secondary !py-2 !px-2.5 text-xs text-slate-400 hover:text-red-400 disabled:opacity-50 flex items-center justify-center"
                title="取消订单"
              >
                {cancelMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {isPending && pendingCancel && (
              <div className="flex-1">
                <ConfirmInline
                  message="确定要取消该订单吗？"
                  confirmLabel="确认"
                  onConfirm={async () => {
                    try {
                      await cancelMutation.mutateAsync(order.id);
                      showToast('订单已取消', 'success');
                    } catch (err: any) {
                      showToast(err.response?.data?.message || '取消失败', 'error');
                    } finally {
                      setPendingCancel(false);
                    }
                  }}
                  onCancel={() => setPendingCancel(false)}
                  isPending={cancelMutation.isPending}
                />
              </div>
            )}
            {order.status === 'COMPLETED' && (
              <Link
                to={`/refunds?orderId=${order.id}`}
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                申请退款
              </Link>
            )}
            {order.status === 'COMPLETED' && (
              <button
                onClick={handleReview}
                className="btn-secondary !py-2 !px-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 text-yellow-400" />
              </button>
            )}
            {order.status === 'COMPLETED' && order.type === 'BUY' && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${order.accountId}`); }}
                className="btn-secondary !py-2 !px-2.5 text-xs flex items-center justify-center gap-1.5"
                title="再次购买此账号"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// Review Modal
const ReviewModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const reviewMutation = useReviewOrder();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const revieweeId = user?.id === order.buyerId ? order.sellerId : order.buyerId;

  const handleSubmit = async () => {
    if (rating === 0) { showToast('请选择评分', 'error'); return; }
    if (!content.trim()) { showToast('请输入评价内容', 'error'); return; }
    try {
      await reviewMutation.mutateAsync({ orderId: order.id, revieweeId, rating, content: content.trim() });
      showToast('评价成功，感谢您的反馈！', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || '评价失败，请重试', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            评价订单
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account info */}
        <div className="flex items-center gap-3 p-3 bg-dark rounded-xl mb-5 border border-dark-border">
          {order.account?.images?.[0] ? (
            <img src={order.account.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{order.account?.title || `订单 #${order.orderNo}`}</p>
            <p className="text-xs text-slate-500">交易金额 ¥{order.amount}</p>
          </div>
        </div>

        {/* Star rating */}
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-3">您的评分</p>
          <div
            role="radiogroup"
            aria-label="选择评分"
            className="flex items-center gap-1"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                setRating((r) => Math.min(r + 1, 5));
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                setRating((r) => Math.max(r - 1, 1));
              }
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                role="radio"
                aria-checked={star === rating}
                tabIndex={star === rating ? 0 : -1}
                onClick={() => setRating(star)}
                onMouseEnter={() => !reviewMutation.isPending && setHoverRating(star)}
                onMouseLeave={() => !reviewMutation.isPending && setHoverRating(0)}
                disabled={reviewMutation.isPending}
                className={`p-1 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded ${
                  reviewMutation.isPending ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
                }`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-700'
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm text-yellow-400 font-medium">
              {['', '极差', '较差', '一般', '满意', '非常满意'][rating]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-5">
          <label className="block text-sm text-slate-400 mb-2">评价内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享您的购买体验，帮助其他买家做出更好的选择..."
            rows={4}
            maxLength={500}
            className="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 resize-none transition-colors"
          />
          <p className="text-right text-xs text-slate-600 mt-1">{content.length}/500</p>
        </div>

        {/* Quick tags */}
        <div className="space-y-2 mb-5">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-slate-600 self-center mr-1">好评</span>
            {['账号真实', '交付快速', '服务态度好', '性价比高', '值得推荐'].map((tag) => (
              <button
                key={tag}
                onClick={() => setContent((c) => {
                  // Remove any negative tags first
                  const negTags = ['账号不符', '交付延迟', '态度恶劣', '信息虚假'];
                  let cleaned = c;
                  negTags.forEach(nt => { cleaned = cleaned.replace(nt + '，', '').replace(nt, ''); });
                  return cleaned.includes(tag) ? cleaned.replace(tag + '，', '').replace(tag, '') : cleaned + (cleaned ? '，' : '') + tag + '，';
                })}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border hover:scale-105 active:scale-95 ${
                  content.includes(tag)
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-dark border-dark-border text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-slate-600 self-center mr-1">差评</span>
            {['账号不符', '交付延迟', '态度恶劣', '信息虚假'].map((tag) => (
              <button
                key={tag}
                onClick={() => setContent((c) => {
                  // Remove positive tags first
                  const posTags = ['账号真实', '交付快速', '服务态度好', '性价比高', '值得推荐'];
                  let cleaned = c;
                  posTags.forEach(pt => { cleaned = cleaned.replace(pt + '，', '').replace(pt, ''); });
                  return cleaned.includes(tag) ? cleaned.replace(tag + '，', '').replace(tag, '') : cleaned + (cleaned ? '，' : '') + tag + '，';
                })}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border hover:scale-105 active:scale-95 ${
                  content.includes(tag)
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-dark border-dark-border text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={reviewMutation.isPending}
          className="w-full btn-primary !py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {reviewMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Star className="w-4 h-4" />
          )}
          {reviewMutation.isPending ? '提交中...' : '提交评价'}
        </button>

        {/* Pending overlay — prevents interaction during submission */}
        {reviewMutation.isPending && (
          <div className="absolute inset-0 bg-dark-card/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-slate-400">提交评价中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  usePageTitle('我的订单');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'>('all');
  const [activeType, setActiveType] = useState<'all' | 'BUY' | 'RENT'>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);

  const { data, isLoading, isError, refetch } = useMyOrders();
  const orders: Order[] = data?.data?.data?.records || [];

  const filteredOrders = useMemo(() => orders.filter(o => {
    const statusMatch =
      activeTab === 'all' ||
      (activeTab === 'PENDING' && o.status === 'PENDING') ||
      (activeTab === 'PROCESSING' && ['PAID', 'PROCESSING'].includes(o.status)) ||
      (activeTab === 'COMPLETED' && o.status === 'COMPLETED') ||
      (activeTab === 'CANCELLED' && ['CANCELLED', 'REFUNDED'].includes(o.status));
    const typeMatch = activeType === 'all' || o.type === activeType;
    const kw = keyword.trim().toLowerCase();
    const keywordMatch = !kw ||
      o.orderNo.toLowerCase().includes(kw) ||
      (o.account?.title?.toLowerCase().includes(kw) ?? false);
    return statusMatch && typeMatch && keywordMatch;
  }), [orders, activeTab, activeType, keyword]);

  // Auto-open order detail from URL param (deep-link from notifications)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const orderIdStr = searchParams.get('orderId');
    if (orderIdStr && !selectedOrder) {
      const id = parseInt(orderIdStr, 10);
      if (!isNaN(id)) {
        const found = orders.find(o => o.id === id);
        if (found) setSelectedOrder(found);
      }
    }
  }, [searchParams, orders, selectedOrder]);

  // Group by month
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    for (const order of filteredOrders) {
      const month = formatMonth(order.createdAt);
      if (!groups[month]) groups[month] = [];
      groups[month].push(order);
    }
    return groups;
  }, [filteredOrders]);
  const months = Object.keys(groupedOrders);

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => ['PAID', 'PROCESSING'].includes(o.status)).length,
    cancelled: orders.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status)).length,
    totalSpent: orders
      .filter(o => o.status === 'COMPLETED' && o.type === 'BUY')
      .reduce((sum, o) => sum + o.amount, 0),
  }), [orders]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <OrderCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">加载失败</h2>
        <p className="text-slate-500 mb-6">无法获取订单数据，请检查网络后重试</p>
        <button
          onClick={() => refetch()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的订单</h1>
        {stats.pending + stats.processing > 0 && (
          <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {stats.pending + stats.processing} 个订单待处理
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: '总订单', value: stats.total, icon: Package, color: 'text-white' },
          { label: '待支付', value: stats.pending, icon: CreditCard, color: 'text-yellow-400' },
          { label: '进行中', value: stats.processing, icon: Clock, color: 'text-blue-400' },
          { label: '已完成', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
          { label: '总消费', value: stats.totalSpent > 0 ? `¥${stats.totalSpent.toFixed(0)}` : '—', icon: TrendingUp, color: 'text-purple-400', small: stats.totalSpent > 0 },
        ].map((stat, idx) => (
          <div key={idx} className="card p-4 text-center cursor-pointer hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <div className={`font-bold ${stat.color} ${stat.small ? 'text-lg' : 'text-xl'}`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Order status distribution bar */}
      {stats.total > 0 && (
        <div className="mb-6 px-4 py-3 bg-dark-card border border-dark-border hover:border-slate-600 transition-all rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">订单状态分布</span>
            <span className="text-xs text-slate-600">{stats.total} 笔订单</span>
          </div>
          <div className="w-full h-2 bg-dark-lighter rounded-full overflow-hidden flex gap-0.5">
            {stats.pending > 0 && (
              <div
                className="h-full bg-yellow-500 rounded-full transition-all hover:brightness-110"
                style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                title={`待支付: ${stats.pending} 笔`}
              />
            )}
            {stats.processing > 0 && (
              <div
                className="h-full bg-blue-500 rounded-full transition-all hover:brightness-110"
                style={{ width: `${(stats.processing / stats.total) * 100}%` }}
                title={`进行中: ${stats.processing} 笔`}
              />
            )}
            {stats.completed > 0 && (
              <div
                className="h-full bg-green-500 rounded-full transition-all hover:brightness-110"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                title={`已完成: ${stats.completed} 笔`}
              />
            )}
            {stats.total - stats.pending - stats.processing - stats.completed > 0 && (
              <div
                className="h-full bg-slate-600 rounded-full transition-all"
                style={{ width: `${((stats.total - stats.pending - stats.processing - stats.completed) / stats.total) * 100}%` }}
                title={`其他: ${stats.total - stats.pending - stats.processing - stats.completed} 笔`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />待支付 {stats.pending}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />进行中 {stats.processing}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500" />已完成 {stats.completed}
            </span>
            {stats.totalSpent > 0 && (
              <span className="ml-auto text-[10px] text-slate-500">总消费 ¥{stats.totalSpent.toFixed(0)}</span>
            )}
          </div>
        </div>
      )}

      {/* Spending Overview */}
      {stats.total > 0 && (
        <div className="mb-6 space-y-3">
          <div className="card p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              收支概览
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-white">
                  ¥{orders
                    .filter(o => ['COMPLETED', 'PAID', 'PROCESSING'].includes(o.status))
                    .reduce((sum, o) => sum + (o.amount || 0), 0)
                    .toFixed(0)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">总交易额</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-400 flex items-center justify-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  ¥{orders
                    .filter(o => o.type === 'BUY' && ['COMPLETED', 'PAID', 'PROCESSING'].includes(o.status))
                    .reduce((sum, o) => sum + (o.amount || 0), 0)
                    .toFixed(0)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">购买支出</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-400 flex items-center justify-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  ¥{orders
                    .filter(o => o.type === 'RENT' && ['COMPLETED', 'PAID', 'PROCESSING'].includes(o.status))
                    .reduce((sum, o) => sum + (o.amount || 0), 0)
                    .toFixed(0)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">租赁支出</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-400">
                  {orders.filter(o => o.status === 'COMPLETED').length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">完成交易</p>
              </div>
            </div>

            {/* Monthly spending mini chart */}
            {(() => {
              const monthlyMap: Record<string, number> = {};
              orders
                .filter(o => ['COMPLETED', 'PAID', 'PROCESSING'].includes(o.status) && o.type === 'BUY')
                .forEach(o => {
                  const d = new Date(o.createdAt);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  monthlyMap[key] = (monthlyMap[key] || 0) + (o.amount || 0);
                });
              const sorted = Object.entries(monthlyMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6);
              if (sorted.length < 2) return null;
              const maxVal = Math.max(...sorted.map(([, v]) => v), 1);
              return (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    近{sorted.length}个月购买趋势
                  </p>
                  <div className="flex items-end gap-1.5 h-14">
                    {sorted.map(([key, amount]) => {
                      const pct = maxVal > 0 ? (amount / maxVal) * 100 : 0;
                      const [, month] = key.split('-');
                      const label = `${month}月`;
                      return (
                        <div key={key} className="flex-1 flex flex-col items-center gap-0.5 group">
                          <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            ¥{amount.toFixed(0)}
                          </span>
                          <div
                            className="w-full bg-gradient-to-t from-primary/70 to-primary rounded-t transition-all hover:from-primary"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                            title={`${key}: ¥${amount.toFixed(2)}`}
                          />
                          <span className="text-[9px] text-slate-600">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Active Rentals Alert */}
          {orders.filter(o => o.type === 'RENT' && ['PAID', 'PROCESSING'].includes(o.status) && o.rentEnd).length > 0 && (
            <div className="card p-4 border-l-4 border-l-orange-500 bg-orange-500/5 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-400">
                  有 {orders.filter(o => o.type === 'RENT' && ['PAID', 'PROCESSING'].includes(o.status)).length} 个租赁订单进行中
                </p>
                <p className="text-xs text-slate-500">请注意租赁到期时间，及时续费或归还</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search + Status + Type Filter */}
      <div className="mb-6 space-y-3">
        {/* Search input */}
        {orders.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索订单号或账号名称..."
              className="input w-full !pl-10 !pr-10 !py-2.5 !text-sm"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Status pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'all', label: '全部', count: stats.total, color: 'text-white' },
            { key: 'PENDING', label: '待支付', count: orders.filter(o => o.status === 'PENDING').length, color: 'text-yellow-400' },
            { key: 'PROCESSING', label: '进行中', count: orders.filter(o => ['PAID', 'PROCESSING'].includes(o.status)).length, color: 'text-blue-400' },
            { key: 'COMPLETED', label: '已完成', count: orders.filter(o => o.status === 'COMPLETED').length, color: 'text-green-400' },
            { key: 'CANCELLED', label: '已取消/退款', count: orders.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status)).length, color: 'text-slate-400' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-dark-lighter text-slate-400 hover:text-white hover:bg-dark-lighter/80'
              }`}
            >
              <span className={activeTab === tab.key ? '' : `text-xs ${tab.color}`}>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-dark'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        {/* Type quick-filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-600 self-center px-1">类型:</span>
          {([
            { key: 'all', label: '全部', icon: null },
            { key: 'BUY', label: '购买', icon: ShoppingBag },
            { key: 'RENT', label: '租赁', icon: Calendar },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key as typeof activeType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all hover:scale-105 active:scale-95 text-xs flex-shrink-0 ${
                activeType === tab.key
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-dark-lighter text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-700" />
          </div>
          {keyword ? (
            <>
              <h3 className="text-base font-medium mb-2 text-slate-400">
                未找到「{keyword}」相关订单
              </h3>
              <button
                onClick={() => setKeyword('')}
                className="text-sm text-primary hover:text-primary-light transition-colors"
              >
                清除搜索
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-medium mb-2 text-slate-400">
                {activeTab === 'all'
                  ? activeType === 'BUY' ? '暂无购买记录'
                  : activeType === 'RENT' ? '暂无租赁记录'
                  : '暂无订单'
                  : activeTab === 'PENDING' ? '暂无待支付订单'
                  : activeTab === 'PROCESSING' ? '暂无进行中订单'
                  : activeTab === 'COMPLETED' ? '暂无已完成订单'
                  : '暂无已取消/退款订单'
                }
              </h3>
              <p className="text-slate-600 text-xs mb-6">开始探索账号市场吧</p>
              {/* Quick action cards */}
              <div className="flex justify-center gap-3 mb-6">
                <Link to="/accounts" className="card p-4 text-left hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/60 active:scale-[0.98] transition-all duration-200 w-40 flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-slate-300">购买账号</p>
                  <p className="text-xs text-slate-600">浏览精选账号</p>
                </Link>
                <Link to="/accounts?rental=true" className="card p-4 text-left hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/60 active:scale-[0.98] transition-all duration-200 w-40 flex-shrink-0">
                  <Clock className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-slate-300">租赁账号</p>
                  <p className="text-xs text-slate-600">按小时计费</p>
                </Link>
                <Link to="/sell" className="card p-4 text-left hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/60 active:scale-[0.98] transition-all duration-200 w-40 flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-sm font-medium text-slate-300">发布账号</p>
                  <p className="text-xs text-slate-600">快速变现</p>
                </Link>
              </div>
              <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                去逛逛
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {months.map(month => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-medium text-slate-400">{month}</h3>
                <div className="flex-1 h-px bg-dark-border" />
                <span className="text-xs text-slate-600">{groupedOrders[month].length} 笔</span>
              </div>
              <div className="space-y-2">
                {groupedOrders[month].map(order => (
                  <OrderCard key={order.id} order={order} onViewDetail={setSelectedOrder} onReview={setReviewingOrder} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onReview={setReviewingOrder} />
      )}
      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal order={reviewingOrder} onClose={() => setReviewingOrder(null)} />
      )}
    <ScrollToTop />
    </div>
  );
};

export default OrdersPage;
