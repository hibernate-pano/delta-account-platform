import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { WalletSkeleton } from '../components/ui/Skeleton';
import { usePageTitle } from '../hooks/usePageTitle';
import { useWalletBalance, useWalletTransactions, useRecharge, useWithdraw } from '../hooks/useQueries';
import { formatRelativeTime } from '../utils/format';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Minus, CreditCard, BarChart3,
  RefreshCw, CheckCircle, XCircle, Clock, ArrowRightLeft, ExternalLink, X,
  ShoppingBag, ArrowUpRight, AlertCircle, Download, Lightbulb
} from 'lucide-react';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: string;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; positive: boolean; icon: React.ElementType; color: string; bg: string }> = {
  RECHARGE:  { label: '充值',       positive: true,  icon: Plus,             color: 'text-green-400', bg: 'bg-green-500/20'   },
  WITHDRAW:  { label: '提现',       positive: false, icon: Minus,            color: 'text-red-400',   bg: 'bg-red-500/20'     },
  BUY:       { label: '购买账号',    positive: false, icon: ShoppingBag,      color: 'text-red-400',   bg: 'bg-red-500/20'     },
  SELL:      { label: '出售账号',    positive: true,  icon: ArrowUpRight,    color: 'text-green-400', bg: 'bg-green-500/20'   },
  RENT:      { label: '租赁',        positive: false, icon: ArrowRightLeft,   color: 'text-red-400',   bg: 'bg-red-500/20'     },
  REFUND:    { label: '退款',        positive: true,  icon: CheckCircle,      color: 'text-green-400', bg: 'bg-green-500/20'   },
};

const txStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: '成功', color: 'text-green-400', bg: 'bg-green-500/20' },
  PENDING:   { label: '处理中', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  FAILED:    { label: '失败', color: 'text-red-400', bg: 'bg-red-500/20' },
  CANCELLED: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20' },
};

// Group transactions by date
const groupTransactionsByDate = (txs: Transaction[]) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: { label: string; items: Transaction[] }[] = [];
  const todayItems: Transaction[] = [], yesterdayItems: Transaction[] = [], olderItems: Transaction[] = [];
  txs.forEach((tx) => {
    const date = new Date(tx.createdAt).toDateString();
    if (date === today) todayItems.push(tx);
    else if (date === yesterday) yesterdayItems.push(tx);
    else olderItems.push(tx);
  });
  if (todayItems.length) groups.push({ label: '今天', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
  if (olderItems.length) groups.push({ label: '更早', items: olderItems });
  return groups;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  COMPLETED: { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  PENDING:   { label: '处理中', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  FAILED:    { label: '已失败', color: 'text-red-400',   bg: 'bg-red-500/20',   icon: XCircle   },
};

// SVG Sparkline for balance trend
const BalanceSparkline: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const data = useMemo(() => {
    if (transactions.length < 2) return null;
    const sorted = [...transactions].reverse().slice(-14);
    let balance = sorted[0]?.balanceBefore || 0;
    return sorted.map((t) => { balance = t.balanceAfter; return balance; });
  }, [transactions]);

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-500 gap-2">
        <BarChart3 className="w-5 h-5" />
        <span className="text-sm">暂无足够数据生成图表</span>
      </div>
    );
  }

  const W = 400, H = 80, P = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: P + (i / (data.length - 1)) * (W - P * 2),
    y: P + ((max - v) / range) * (H - P * 2),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const last = pts[pts.length - 1];
  const isUp = data[data.length - 1] >= data[0];

  return (
    <div className="mt-4 pt-4 border-t border-dark-border">
      <p className="text-xs text-slate-500 mb-3">余额趋势（近14笔交易）</p>
      <div className="overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#spark-fill)" />
          <path d={pathD} fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="3" fill={isUp ? '#22c55e' : '#ef4444'} />
          <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="5" fill={isUp ? '#22c55e' : '#ef4444'} opacity="0.3" />
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">¥{Math.min(...data).toFixed(2)}</span>
        <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? '↑' : '↓'} ¥{Math.abs(data[data.length - 1] - data[0]).toFixed(2)}
        </span>
        <span className="text-xs text-slate-600">¥{Math.max(...data).toFixed(2)}</span>
      </div>
    </div>
  );
};

// SVG Donut chart for spending breakdown
const SpendingDonut: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions
      .filter((t) => ['BUY', 'RENT', 'WITHDRAW'].includes(t.type) && t.status === 'COMPLETED')
      .forEach((t) => { totals[t.type] = (totals[t.type] || 0) + t.amount; });
    return totals;
  }, [transactions]);

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = { BUY: '#3b82f6', RENT: '#a855f7', WITHDRAW: '#ef4444' };
  const labels: Record<string, string> = { BUY: '购买', RENT: '租赁', WITHDRAW: '提现' };

  const R = 24, C = 2 * Math.PI * R;
  let cumulative = 0;
  const segments = Object.entries(data).map(([type, amount]) => {
    const pct = amount / total;
    const dashArray = `${(pct * C).toFixed(2)} ${C.toFixed(2)}`;
    const rotation = (cumulative * 360 - 90);
    cumulative += pct;
    return { type, amount, pct, dashArray, rotation, color: colors[type], label: labels[type] };
  });

  return (
    <div className="mt-4 pt-4 border-t border-dark-border">
      <p className="text-xs text-slate-500 mb-3">支出分布</p>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${R * 2 + 4} ${R * 2 + 4}`} className="w-16 h-16 flex-shrink-0">
          <circle cx={R + 2} cy={R + 2} r={R} fill="none" stroke="#1e293b" strokeWidth="12" />
          {segments.map((s) => (
            <circle
              key={s.type} cx={R + 2} cy={R + 2} r={R}
              fill="none" stroke={s.color} strokeWidth="12"
              strokeDasharray={s.dashArray}
              strokeDashoffset={(-s.rotation * C / 360).toFixed(2)}
              strokeLinecap="round"
              transform={`rotate(${s.rotation} ${R + 2} ${R + 2})`}
            />
          ))}
        </svg>
        <div className="flex-1 space-y-1.5">
          {segments.map((s) => (
            <div key={s.type} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-slate-400">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium">¥{s.amount.toFixed(0)}</span>
                <span className="text-slate-600">{(s.pct * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs border-t border-dark-border pt-1.5 mt-1">
            <span className="text-slate-500">合计</span>
            <span className="text-slate-300 font-semibold">¥{total.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transaction Detail Modal
const TransactionDetailModal: React.FC<{ tx: Transaction; onClose: () => void }> = ({ tx, onClose }) => {
  const cfg = typeConfig[tx.type] || typeConfig.RECHARGE;
  const sCfg = statusConfig[tx.status] || statusConfig.PENDING;
  const TypeIcon = cfg.icon;
  const StatusIcon = sCfg.icon;
  const isUp = cfg.positive;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="px-6 py-5 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-lg font-bold">交易详情</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className={`text-center py-5 rounded-2xl ${isUp ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className={`text-4xl font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? '+' : '-'}¥{tx.amount.toFixed(2)}
            </p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium ${sCfg.bg} ${sCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {sCfg.label}
            </div>
          </div>

          {/* Info grid */}
          <div className="space-y-3">
            {[
              { label: '交易类型', value: cfg.label, icon: TypeIcon, iconColor: cfg.color, iconBg: cfg.bg },
              { label: '交易时间', value: new Date(tx.createdAt).toLocaleString('zh-CN') },
              { label: '交易前余额', value: `¥${tx.balanceBefore.toFixed(2)}` },
              { label: '交易后余额', value: `¥${tx.balanceAfter.toFixed(2)}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                <span className="text-sm text-slate-500">{row.label}</span>
                {'icon' in row && row.icon ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{row.value}</span>
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${row.iconBg}`}>
                      <row.icon className={`w-3.5 h-3.5 ${row.iconColor}`} />
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-medium">{row.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Description */}
          {tx.description && (
            <div className="bg-dark rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1.5">备注</p>
              <p className="text-sm text-slate-300">{tx.description}</p>
            </div>
          )}

          <button onClick={onClose} className="w-full btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// Format a raw numeric string for display (e.g. "1000" → "1,000.00")
const fmtAmt = (v: string) =>
  v && !isNaN(+v) ? (+v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

const WalletPage: React.FC = () => {
  usePageTitle('我的钱包');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'balance' | 'recharges' | 'withdrawals' | 'orders'>('balance');
  const [activeType, setActiveType] = useState<'ALL' | 'BUY' | 'SELL' | 'RENT' | 'REFUND'>('ALL');
  const [period, setPeriod] = useState<'all' | 'this-month' | 'last-month'>('all');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const pendingWithdrawals = useMemo(() =>
    transactions.filter((t) => t.type === 'WITHDRAW' && t.status === 'PENDING').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const availableBalance = useMemo(() => Math.max(0, balance - pendingWithdrawals), [balance, pendingWithdrawals]);
  const rechargeModalRef = useRef<HTMLDivElement>(null);
  const withdrawModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(rechargeModalRef, showRechargeModal);
  useFocusTrap(withdrawModalRef, showWithdrawModal);

  const { data: balanceData, isLoading: balanceLoading, isError: balanceError, refetch: refetchBalance } = useWalletBalance();
  const { data: transactionsData, isLoading: txLoading, isError: txError, refetch: refetchTx } = useWalletTransactions({ page: 1, size: 50 });

  const rechargeMutation = useRecharge();
  const withdrawMutation = useWithdraw();

  const balance = balanceData?.data?.data?.balance ?? 0;
  const transactions: Transaction[] = transactionsData?.data?.data?.records ?? [];

  if (!token) {
    navigate('/login');
    return null;
  }

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      showToast('请输入有效的充值金额', 'warning');
      return;
    }

    try {
      await rechargeMutation.mutateAsync({ amount: parseFloat(rechargeAmount) });
      showToast(`充值成功！¥${rechargeAmount}已到账`, 'success');
      setShowRechargeModal(false);
      setRechargeAmount('');
    } catch (err: any) {
      showToast(err.response?.data?.message || '充值失败，请重试', 'error');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast('请输入有效的提现金额', 'warning');
      return;
    }
    if (!accountNo || !accountName) {
      showToast('请填写完整的提现信息', 'warning');
      return;
    }
    if (parseFloat(withdrawAmount) > balance) {
      showToast('提现金额不能超过可用余额', 'error');
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        amount: parseFloat(withdrawAmount),
        accountNo,
        accountName,
        accountType: 'ALIPAY',
      });
      showToast(`提现申请已提交！¥${withdrawAmount}将在1-3个工作日到账`, 'success');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setAccountNo('');
      setAccountName('');
    } catch (err: any) {
      showToast(err.response?.data?.message || '提现失败，请重试', 'error');
    }
  };

  const stats = useMemo(() => {
    const getMonthTx = (monthOffset: number) => {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      return transactions.filter((t) => {
        const date = new Date(t.createdAt);
        return date.getMonth() === targetMonth.getMonth() && date.getFullYear() === targetMonth.getFullYear();
      });
    };
    const thisMonth = getMonthTx(0);
    const lastMonth = getMonthTx(1);
    const periodTx = period === 'last-month' ? lastMonth : period === 'this-month' ? thisMonth : transactions;
    const income = periodTx.filter((t) => ['RECHARGE', 'SELL', 'REFUND'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const expense = periodTx.filter((t) => ['BUY', 'WITHDRAW', 'RENT'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const monthlyIncome = thisMonth.filter((t) => ['RECHARGE', 'SELL', 'REFUND'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = thisMonth.filter((t) => ['BUY', 'WITHDRAW', 'RENT'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const lastMonthIncome = lastMonth.filter((t) => ['RECHARGE', 'SELL', 'REFUND'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const lastMonthExpense = lastMonth.filter((t) => ['BUY', 'WITHDRAW', 'RENT'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      monthlyIncome,
      monthlyExpense,
      lastMonthIncome,
      lastMonthExpense,
      periodIncome: period === 'last-month' ? lastMonthIncome : period === 'this-month' ? monthlyIncome : income,
      periodExpense: period === 'last-month' ? lastMonthExpense : period === 'this-month' ? monthlyExpense : expense,
    };
  }, [transactions, period]);

  // Period filter helper
  const isInPeriod = (txDate: Date) => {
    if (period === 'all') return true;
    const now = new Date();
    const txMonth = txDate.getMonth();
    const txYear = txDate.getFullYear();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();
    if (period === 'this-month') {
      return txMonth === nowMonth && txYear === nowYear;
    }
    // last month
    const lastMonth = nowMonth === 0 ? 11 : nowMonth - 1;
    const lastMonthYear = nowMonth === 0 ? nowYear - 1 : nowYear;
    return txMonth === lastMonth && txYear === lastMonthYear;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!isInPeriod(new Date(tx.createdAt))) return false;
    if (activeTab === 'recharges') return tx.type === 'RECHARGE';
    if (activeTab === 'withdrawals') return tx.type === 'WITHDRAW';
    if (activeTab === 'orders') return ['BUY', 'SELL', 'RENT', 'REFUND'].includes(tx.type);
    if (activeType !== 'ALL') return tx.type === activeType;
    return true;
  }).filter((tx) =>
    !txSearch.trim() ||
    tx.description.toLowerCase().includes(txSearch.toLowerCase()) ||
    (typeConfig[tx.type]?.label || '').includes(txSearch)
  );

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );

  if (balanceLoading && txLoading) {
    return <WalletSkeleton />;
  }

  if (balanceError || txError) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">加载失败</h2>
        <p className="text-slate-500 mb-6">无法获取钱包数据，请检查网络后重试</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => { refetchBalance?.(); refetchTx?.(); }} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
          <Link to="/profile" className="btn-secondary">返回个人中心</Link>
        </div>
      </div>
    );
  }

  const isSubmitting = rechargeMutation.isPending || withdrawMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">我的钱包</h1>

      {/* Balance Card */}
      <div className="card mb-6 bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-primary/30 rounded-2xl flex items-center justify-center animate-pulse-glow">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">账户余额</p>
              <p className="text-3xl font-bold text-white">¥{balance.toFixed(2)}</p>
              {pendingWithdrawals > 0 && (
                  <p className="text-xs text-yellow-400/80 mt-0.5">待提现 ¥{pendingWithdrawals.toFixed(2)} · 可用 ¥{availableBalance.toFixed(2)}</p>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-dark/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">总收入</span>
            </div>
            <p className="text-lg font-bold text-green-400">+¥{stats.income.toFixed(2)}</p>
          </div>
          <div className="bg-dark/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">总支出</span>
            </div>
            <p className="text-lg font-bold text-red-400">-¥{stats.expense.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowRechargeModal(true)}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            充值
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Minus className="w-5 h-5" />
            提现
          </button>
        </div>
      </div>

      {/* Balance Chart */}
      <div className="card mb-6">
        <h3 className="font-medium mb-4">财务概览</h3>
        {/* Net position bar */}
        {(() => {
          const net = stats.periodIncome - stats.periodExpense;
          const total = stats.periodIncome + stats.periodExpense;
          const incomePct = total > 0 ? (stats.periodIncome / total) * 100 : 50;
          const periodLabel = period === 'last-month' ? '上月' : period === 'this-month' ? '本月' : '全部';
          return (
            <div className={`mb-4 p-3 rounded-xl border ${
              net >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{periodLabel}净变化</span>
                <span className={`text-lg font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {net >= 0 ? '+' : ''}¥{net.toFixed(2)}
                </span>
              </div>
              {total > 0 && (
                <div className="w-full h-2 bg-dark rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${incomePct}%` }} />
                  <div className="h-full bg-red-400 transition-all" />
                </div>
              )}
            </div>
          );
        })()}
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
          <div>
            <p className="text-2xl font-bold text-green-400">¥{stats.periodIncome.toFixed(2)}</p>
            <p className="text-xs text-slate-500">
              {period === 'last-month' ? '上月' : period === 'this-month' ? '本月' : '总收入'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">¥{stats.periodExpense.toFixed(2)}</p>
            <p className="text-xs text-slate-500">
              {period === 'last-month' ? '上月' : period === 'this-month' ? '本月' : '总支出'}</p>
          </div>
        </div>
        <BalanceSparkline transactions={transactions} />
        {stats.periodExpense > 0 && <SpendingDonut transactions={transactions} />}
      </div>

      {/* Tab Filter */}
      <div className="mb-6 space-y-3">
        {/* Main type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide [-webkit-overflow-scrolling:touch]">
          {[
            { key: 'balance', label: '全部', icon: Wallet },
            { key: 'recharges', label: '充值', icon: Plus },
            { key: 'withdrawals', label: '提现', icon: Minus },
            { key: 'orders', label: '交易', icon: ShoppingBag },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as typeof activeTab); setActiveType('ALL'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-dark-lighter text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Period + Type Filter Row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide [-webkit-overflow-scrolling:touch]">
          {/* Period selector */}
          <div className="flex gap-1 bg-dark-lighter rounded-lg p-1 flex-shrink-0">
            {([
              { key: 'all', label: '全部' },
              { key: 'this-month', label: '本月' },
              { key: 'last-month', label: '上月' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  period === tab.key
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Transaction type chips */}
          {activeTab !== 'recharges' && activeTab !== 'withdrawals' && (
            <div className="flex gap-2 flex-shrink-0">
              {([
                { key: 'ALL', label: '全部', icon: null },
                { key: 'BUY', label: '购买', icon: ShoppingBag },
                { key: 'SELL', label: '出售', icon: ArrowUpRight },
                { key: 'RENT', label: '租赁', icon: ArrowRightLeft },
                { key: 'REFUND', label: '退款', icon: CheckCircle },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs ${
                    activeType === t.key
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-dark-lighter text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {t.icon && <t.icon className="w-3 h-3" />}
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

      {/* Transaction List */}
      <div className="card">
        {/* Search bar */}
        <div className="p-3 border-b border-dark-border">
          <div className="relative">
            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder="搜索交易记录..."
              className="w-full pl-9 pr-8 py-2 bg-dark rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {txSearch && (
              <button
                onClick={() => setTxSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {txLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
              <Wallet className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-slate-400">
              {txSearch ? '没有找到匹配的交易记录' : '暂无交易记录'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              {txSearch ? '换个关键词试试' : '开始交易后，这里会显示您的每一笔收支'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {txSearch ? (
                <button onClick={() => setTxSearch('')} className="btn-secondary text-sm">
                  清除搜索
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="btn-primary text-sm inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    充值
                  </button>
                  <Link to="/accounts" className="btn-secondary text-sm inline-flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    逛逛市场
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {groupedTransactions.map((group) => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="sticky top-0 bg-dark-card z-10 py-2 px-4">
                  <span className="text-xs text-slate-600 font-medium">{group.label}</span>
                </div>
                {group.items.map((tx) => {
                  const cfg = typeConfig[tx.type] || typeConfig.RECHARGE;
                  const TypeIcon = cfg.icon;
                  const statusCfg = txStatusConfig[tx.status] || txStatusConfig.COMPLETED;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="py-4 flex items-center justify-between hover:bg-dark/30 -mx-4 px-4 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                          <TypeIcon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cfg.label}</p>
                            {tx.status !== 'COMPLETED' && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color} ${tx.status === 'PENDING' ? 'animate-pulse' : ''}`}>
                                {statusCfg.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{formatRelativeTime(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div
                        className={`text-right font-medium ${
                          cfg.positive ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {cfg.positive ? '+' : '-'}¥{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {filteredTransactions.length > 0 && (
            <div className="px-4 pb-3">
              <button
                onClick={() => {
                  const headers = ['时间', '类型', '金额', '状态', '备注'];
                  const rows = filteredTransactions.map((tx) => [
                    new Date(tx.createdAt).toLocaleString('zh-CN'),
                    typeConfig[tx.type]?.label || tx.type,
                    `${typeConfig[tx.type]?.positive ? '+' : '-'}¥${tx.amount.toFixed(2)}`,
                    txStatusConfig[tx.status]?.label || tx.status,
                    tx.description || '-',
                  ]);
                  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `delta-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('交易记录已导出', 'success');
                }}
                className="text-xs text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5 mt-2"
              >
                <Download className="w-3.5 h-3.5" />
                导出 CSV
              </button>
            </div>
          )}
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowRechargeModal(false)}
        >
          <div className="card w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()} ref={rechargeModalRef}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              充值
            </h2>
            <form onSubmit={handleRecharge}>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">充值金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-500">¥</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fmtAmt(rechargeAmount)}
                    onChange={(e) => setRechargeAmount(e.target.value.replace(/,/g, '').replace(/[^\d.]/g, ''))}
                    className="input w-full pl-10 text-2xl font-bold"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max="100000"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setRechargeAmount(amount.toString())}
                    className={`py-2.5 rounded-xl font-medium transition-all ${
                      rechargeAmount === amount.toString()
                        ? 'bg-primary text-white'
                        : 'bg-dark-lighter text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-400 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>提示：充值金额将立即到账，支持支付宝、微信等支付方式</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !rechargeAmount}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? '处理中...' : '确认充值'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div className="card w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()} ref={withdrawModalRef}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Minus className="w-5 h-5 text-red-400" />
              </div>
              提现
            </h2>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-slate-400">提现金额</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableBalance.toFixed(2))}
                    className="text-xs text-primary hover:text-primary-light transition-colors"
                  >
                    全部提现
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-500">¥</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fmtAmt(withdrawAmount)}
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/,/g, '').replace(/[^\d.]/g, ''))}
                    className="input w-full pl-10 text-2xl font-bold"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max={balance}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  可用余额: <span className="text-primary font-medium">¥{availableBalance.toFixed(2)}</span>
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[50, 100, 200, 500].filter((a) => a <= availableBalance).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    className={`py-2.5 rounded-xl font-medium transition-all ${
                      withdrawAmount === amount.toString()
                        ? 'bg-primary text-white'
                        : 'bg-dark-lighter text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    ¥{amount}
                  </button>
                ))}
                {balance > 0 && [50, 100, 200, 500].filter((a) => a > balance).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance.toFixed(2))}
                    className={`py-2.5 rounded-xl font-medium transition-all text-xs ${
                      withdrawAmount === balance.toFixed(2)
                        ? 'bg-primary text-white'
                        : 'bg-dark-lighter text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    ¥{balance.toFixed(0)} 全部
                  </button>
                )}
                {[50, 100, 200, 500].filter((a) => a <= balance).length === 0 && balance > 0 && (
                  <p className="col-span-4 text-xs text-slate-500 text-center py-2">余额不足¥50，无法使用快捷金额</p>
                )}
                {balance === 0 && (
                  <p className="col-span-4 text-xs text-slate-500 text-center py-2">余额为0，无法提现</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">支付宝账号</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="input w-full focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="请输入支付宝账号"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">真实姓名</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="input w-full focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="请输入真实姓名"
                  required
                />
              </div>
              <div className="text-xs text-slate-400 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>提示：提现申请提交后，1-3个工作日内到账，节假日顺延</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !withdrawAmount || !accountNo || !accountName}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? '处理中...' : '确认提现'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Transaction Detail Modal */}
      {selectedTx && (
        <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
};

export default WalletPage;
