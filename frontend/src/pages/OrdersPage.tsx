import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { TransactionSkeleton } from '../components/ui/Skeleton';
import { usePageTitle } from '../hooks/usePageTitle';
import { useMyOrders, usePayOrder, useCancelOrder, useCompleteOrder, useReviewOrder } from '../hooks/useQueries';
import {
  Package, ChevronRight, FileText, Clock, CheckCircle, XCircle,
  AlertCircle, ShoppingBag, CreditCard, RefreshCw,
  Calendar, Gamepad2, ZoomIn, ZoomOut, X, ExternalLink, Copy, MessageCircle,
  Shield, User, Star, Search
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
                } ${active ? 'ring-2 ring-primary/50' : ''}`}
              >
                <StepIcon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap ${done ? 'text-primary' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 rounded-full transition-all ${i < currentIdx ? 'bg-primary' : 'bg-dark-lighter'}`} />
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
              <span className="text-xs font-mono text-slate-500">#{order.orderNo.slice(-12)}</span>
              <button onClick={handleCopyOrderNo} className="text-slate-600 hover:text-white transition-colors">
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
                {order.account?.skinCount && <span>🎨 {order.account.skinCount} 皮肤</span>}
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
                      <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] text-yellow-400">
                        <Star className="w-2.5 h-2.5 fill-yellow-400" />
                        {(order.account.sellerCreditScore / 20).toFixed(1)}
                      </span>
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
              {[
                { label: '下单', time: order.createdAt, done: true },
                { label: '支付', time: order.status !== 'PENDING' ? '—' : '待支付', done: ['PAID', 'PROCESSING', 'COMPLETED'].includes(order.status) },
                { label: '交付', time: ['PROCESSING', 'COMPLETED'].includes(order.status) ? '—' : '—', done: order.status === 'COMPLETED' },
                { label: '完成', time: order.status === 'COMPLETED' ? '—' : '—', done: order.status === 'COMPLETED' },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-primary/20 text-primary' : 'bg-dark-lighter text-slate-600'
                  }`}>
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
                className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                立即支付
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Single Order Card
const OrderCard: React.FC<{ order: Order; onViewDetail: (order: Order) => void; onReview: (order: Order) => void }> = ({ order, onViewDetail, onReview }) => {
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [paymentCountdown, setPaymentCountdown] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const payMutation = usePayOrder();
  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const isTerminal = ['CANCELLED', 'REFUNDED'].includes(order.status);
  const isPending = order.status === 'PENDING';

  // Live countdown for active rentals
  React.useEffect(() => {
    if (order.type !== 'RENT' || order.status !== 'PROCESSING' || !order.rentEnd) return;
    const update = () => {
      const remaining = new Date(order.rentEnd!).getTime() - Date.now();
      if (remaining <= 0) { setCountdown('已到期'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setCountdown(h > 0 ? `剩余 ${h}小时${m}分` : `剩余 ${m}分钟`);
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
      if (remaining <= 0) { setPaymentCountdown('已超时'); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setPaymentCountdown(`${m}:${s.toString().padStart(2, '0')}`);
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
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Account thumbnail */}
        <div className="w-14 h-14 bg-dark rounded-lg overflow-hidden flex-shrink-0 relative">
          {order.account?.images?.[0] ? (
            <img src={order.account.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
          )}
          {/* Type badge */}
          <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
            order.type === 'BUY' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
          }`}>
            {order.type === 'BUY' ? '买' : '租'}
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
            <div className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              paymentCountdown === '已超时' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              <Clock className="w-2.5 h-2.5" />
              {paymentCountdown === '已超时' ? '支付超时' : paymentCountdown}
            </div>
          )}
          {countdown && !isPending && (
            <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 font-medium">
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
                      <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] text-yellow-400">
                        <Star className="w-2.5 h-2.5 fill-yellow-400" />
                        {(order.account.sellerCreditScore / 20).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {order.status === 'PROCESSING' ? '账号交付中，请耐心等待' : '等待卖家交付账号，请保持在线'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/messages?accountId=${order.accountId}`); }}
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
              onClick={(e) => { e.stopPropagation(); onViewDetail(order); }}
              className="btn-secondary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              订单详情
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${order.accountId}`); }}
              className="btn-secondary !py-2 !px-3 text-xs flex items-center justify-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {isPending && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await payMutation.mutateAsync(order.id);
                    showToast('支付成功！', 'success');
                  } catch (err: any) {
                    showToast(err.response?.data?.message || '支付失败', 'error');
                  }
                }}
                disabled={payMutation.isPending}
                className="btn-primary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CreditCard className="w-3.5 h-3.5" />
                立即支付
              </button>
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
                onClick={(e) => { e.stopPropagation(); onReview(order); }}
                className="btn-secondary !py-2 !px-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 text-yellow-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-700 hover:text-yellow-500'
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
        <div className="flex flex-wrap gap-2 mb-5">
          {['账号真实', '交付快速', '服务态度好', '性价比高', '值得推荐'].map((tag) => (
            <button
              key={tag}
              onClick={() => setContent((c) => c.includes(tag) ? c.replace(tag + '，', '').replace(tag, '') : c + (c ? '，' : '') + tag + '，')}
              className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                content.includes(tag)
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-dark border-dark-border text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              {tag}
            </button>
          ))}
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

  const filteredOrders = orders.filter(o => {
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
  });

  // Group by month
  const groupedOrders: Record<string, Order[]> = {};
  for (const order of filteredOrders) {
    const month = formatMonth(order.createdAt);
    if (!groupedOrders[month]) groupedOrders[month] = [];
    groupedOrders[month].push(order);
  }
  const months = Object.keys(groupedOrders);

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => ['PAID', 'PROCESSING'].includes(o.status)).length,
    cancelled: orders.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status)).length,
    totalSpent: orders
      .filter(o => o.status === 'COMPLETED' && o.type === 'BUY')
      .reduce((sum, o) => sum + o.amount, 0),
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>
        <div className="card">
          {[1, 2, 3].map(i => <TransactionSkeleton key={i} />)}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '总订单', value: stats.total, icon: Package, color: 'text-white' },
          { label: '待支付', value: stats.pending, icon: CreditCard, color: 'text-yellow-400' },
          { label: '进行中', value: stats.processing, icon: Clock, color: 'text-blue-400' },
          { label: '已完成', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
        ].map((stat, idx) => (
          <div key={idx} className="card p-4 text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs flex-shrink-0 ${
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
        <div className="card text-center py-20">
          <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-slate-400">
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
          <p className="text-slate-600 text-sm mb-6">开始探索账号市场吧</p>
          <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            去逛逛
          </Link>
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
    </div>
  );
};

export default OrdersPage;
