import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { TransactionSkeleton } from '../components/ui/Skeleton';
import { useMyOrders } from '../hooks/useQueries';
import {
  Package, ChevronRight, FileText, Clock, CheckCircle, XCircle,
  AlertCircle, ShoppingBag, ArrowDownCircle, CreditCard, RefreshCw,
  Calendar, Gamepad2, ZoomIn, ZoomOut
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

// Single Order Card
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const isTerminal = ['CANCELLED', 'REFUNDED'].includes(order.status);
  const isPending = order.status === 'PENDING';

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
          <div className="text-base font-bold text-white">¥{order.amount.toFixed(0)}</div>
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.color}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {statusConfig[order.status]?.label || order.status}
          </div>
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
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${order.accountId}`); }}
              className="btn-secondary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              查看账号
            </button>
            {isPending && (
              <button
                onClick={(e) => { e.stopPropagation(); /* TODO: pay */ }}
                className="btn-primary flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
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
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'BUY' | 'RENT'>('all');

  const { data, isLoading } = useMyOrders();
  const orders: Order[] = data?.data?.data?.records || [];

  const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.type === activeTab);

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
    pending: orders.filter(o => ['PENDING', 'PROCESSING'].includes(o.status)).length,
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">我的订单</h1>
        {stats.pending > 0 && (
          <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {stats.pending} 个订单待处理
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: '全部', count: stats.total },
          { key: 'BUY', label: '购买', icon: ShoppingBag, count: orders.filter(o => o.type === 'BUY').length },
          { key: 'RENT', label: '租赁', icon: Calendar, count: orders.filter(o => o.type === 'RENT').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-dark-lighter text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-dark'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-slate-400">
            {activeTab === 'all' ? '暂无订单' : activeTab === 'BUY' ? '暂无购买记录' : '暂无租赁记录'}
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
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
