import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { WalletSkeleton } from '../components/ui/Skeleton';
import { useWalletBalance, useWalletTransactions, useRecharge, useWithdraw } from '../hooks/useQueries';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Minus, CreditCard, BarChart3,
  RefreshCw, CheckCircle, XCircle, Clock, ArrowRightLeft, ExternalLink, X,
  ShoppingBag, ArrowUpRight
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

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(diff / 86400000);
  if (d < 7) return `${d}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
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
      <div className="flex items-center justify-center h-24 text-gray-500 gap-2">
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
      <p className="text-xs text-gray-500 mb-3">余额趋势（近14笔交易）</p>
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
        <span className="text-xs text-gray-600">¥{Math.min(...data).toFixed(2)}</span>
        <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? '↑' : '↓'} ¥{Math.abs(data[data.length - 1] - data[0]).toFixed(2)}
        </span>
        <span className="text-xs text-gray-600">¥{Math.max(...data).toFixed(2)}</span>
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

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'balance' | 'recharges' | 'withdrawals' | 'orders'>('balance');
  const [activeType, setActiveType] = useState<'ALL' | 'BUY' | 'SELL' | 'RENT' | 'REFUND'>('ALL');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');

  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance();
  const { data: transactionsData, isLoading: txLoading } = useWalletTransactions({ page: 1, size: 50 });

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
    const income = transactions
      .filter((t) => ['RECHARGE', 'SELL', 'REFUND'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => ['BUY', 'WITHDRAW', 'RENT'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    const thisMonth = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const monthlyIncome = thisMonth
      .filter((t) => ['RECHARGE', 'SELL', 'REFUND'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = thisMonth
      .filter((t) => ['BUY', 'WITHDRAW', 'RENT'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, monthlyIncome, monthlyExpense };
  }, [transactions]);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'recharges') return tx.type === 'RECHARGE';
    if (activeTab === 'withdrawals') return tx.type === 'WITHDRAW';
    if (activeTab === 'orders') return ['BUY', 'SELL', 'RENT', 'REFUND'].includes(tx.type);
    // balance tab: filter by type chip
    if (activeType !== 'ALL') return tx.type === activeType;
    return true;
  });

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );

  if (balanceLoading && txLoading) {
    return <WalletSkeleton />;
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
        <h3 className="font-medium mb-2">财务概览</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">¥{stats.monthlyIncome.toFixed(2)}</p>
            <p className="text-xs text-gray-500">本月收入</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">¥{stats.monthlyExpense.toFixed(2)}</p>
            <p className="text-xs text-gray-500">本月支出</p>
          </div>
        </div>
        <BalanceSparkline transactions={transactions} />
      </div>

      {/* Tab Filter */}
      <div className="mb-6 space-y-3">
        {/* Main type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
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
        {/* Transaction type chips (show for balance/orders tabs) */}
        {activeTab !== 'recharges' && activeTab !== 'withdrawals' && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-600 self-center px-1 flex-shrink-0">类型:</span>
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs flex-shrink-0 ${
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
        {txLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500">暂无交易记录</p>
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
                          <p className="font-medium">{cfg.label}</p>
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
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowRechargeModal(false)}
        >
          <div className="card w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
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
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
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
                        : 'bg-dark-lighter text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mb-4 p-3 bg-dark/50 rounded-lg">
                💡 提示：充值金额将立即到账，支持支付宝、微信等支付方式
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
          <div className="card w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
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
                    onClick={() => setWithdrawAmount(balance.toFixed(2))}
                    className="text-xs text-primary hover:text-primary-light transition-colors"
                  >
                    全部提现
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-500">¥</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
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
                  可用余额: <span className="text-primary font-medium">¥{balance.toFixed(2)}</span>
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setWithdrawAmount(Math.min(amount, balance).toString())}
                    className={`py-2.5 rounded-xl font-medium transition-all ${
                      withdrawAmount === Math.min(amount, balance).toFixed(2)
                        ? 'bg-primary text-white'
                        : 'bg-dark-lighter text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">支付宝账号</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="input w-full"
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
                  className="input w-full"
                  placeholder="请输入真实姓名"
                  required
                />
              </div>
              <div className="text-xs text-slate-500 mb-4 p-3 bg-dark/50 rounded-lg">
                💡 提示：提现申请提交后，1-3个工作日内到账，节假日顺延
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
