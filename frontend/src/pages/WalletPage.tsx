import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { WalletSkeleton, TransactionSkeleton } from '../components/ui/Skeleton';
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, CreditCard, RefreshCw, BarChart3, ArrowRight } from 'lucide-react';

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

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'recharges' | 'withdrawals' | 'transactions'>('balance');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [balanceRes, transRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({ page: 1, size: 50 })
      ]);
      setBalance(balanceRes.data.data.balance || 0);
      setTransactions(transRes.data.data.records || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      showToast('加载钱包数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      showToast('请输入有效的充值金额', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await walletApi.recharge({ amount: parseFloat(rechargeAmount) });
      showToast(`充值成功！¥${rechargeAmount}已到账`, 'success');
      setShowRechargeModal(false);
      setRechargeAmount('');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || '充值失败，请重试', 'error');
    } finally {
      setSubmitting(false);
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

    setSubmitting(true);
    try {
      await walletApi.withdraw({
        amount: parseFloat(withdrawAmount),
        accountNo,
        accountName,
        accountType: 'ALIPAY'
      });
      showToast(`提现申请已提交！¥${withdrawAmount}将在1-3个工作日到账`, 'success');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setAccountNo('');
      setAccountName('');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || '提现失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
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

  // Simple balance chart
  const BalanceChart: React.FC = () => {
    const chartData = useMemo(() => {
      if (transactions.length === 0) return [];
      const sorted = [...transactions].reverse().slice(-7);
      let runningBalance = sorted[0]?.balanceBefore || 0;
      return sorted.map((t) => {
        runningBalance = t.balanceAfter;
        return {
          date: new Date(t.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          balance: runningBalance
        };
      });
    }, [transactions]);

    if (chartData.length < 2) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500 gap-2">
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm">暂无足够数据生成图表</span>
        </div>
      );
    }

    const maxBalance = Math.max(...chartData.map((d) => d.balance));
    const minBalance = Math.min(...chartData.map((d) => d.balance));
    const range = maxBalance - minBalance || 1;
    const height = 120;

    return (
      <div className="mt-4 pt-4 border-t border-dark-border">
        <p className="text-xs text-gray-500 mb-3">余额趋势（近7笔交易）</p>
        <div className="flex items-end gap-2 h-32">
          {chartData.map((d, i) => {
            const barHeight = ((d.balance - minBalance) / range) * height + 10;
            const isUp = i > 0 && d.balance >= chartData[i - 1].balance;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">¥{d.balance.toFixed(0)}</span>
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 ${
                    isUp ? 'bg-green-500/60' : 'bg-red-500/60'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
                <span className="text-xs text-gray-600">{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECHARGE: '充值',
      WITHDRAW: '提现',
      BUY: '购买账号',
      SELL: '出售账号',
      RENT: '租赁',
      REFUND: '退款'
    };
    return labels[type] || type;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'recharges') return tx.type === 'RECHARGE';
    if (activeTab === 'withdrawals') return tx.type === 'WITHDRAW';
    if (activeTab === 'transactions') return true;
    return true;
  });

  if (loading) {
    return <WalletSkeleton />;
  }

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

        {/* Quick Stats */}
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
        <BalanceChart />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'balance', label: '全部', icon: Wallet },
          { key: 'recharges', label: '充值', icon: CreditCard },
          { key: 'withdrawals', label: '提现', icon: Minus },
          { key: 'transactions', label: '其他', icon: TrendingDown },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
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

      {/* Transaction List */}
      <div className="card">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500">暂无交易记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="py-4 flex items-center justify-between hover:bg-dark/30 -mx-4 px-4 transition-colors rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    tx.type === 'RECHARGE' || tx.type === 'SELL' || tx.type === 'REFUND'
                      ? 'bg-green-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {tx.type === 'RECHARGE' || tx.type === 'SELL' || tx.type === 'REFUND' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{getTypeLabel(tx.type)}</p>
                    <p className="text-sm text-slate-500">{tx.createdAt}</p>
                  </div>
                </div>
                <div className={`text-right font-medium ${
                  tx.type === 'RECHARGE' || tx.type === 'SELL' || tx.type === 'REFUND'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {tx.type === 'RECHARGE' || tx.type === 'SELL' || tx.type === 'REFUND' ? '+' : '-'}
                  ¥{tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRechargeModal(false)}>
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
                  disabled={submitting || !rechargeAmount}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? '处理中...' : '确认充值'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWithdrawModal(false)}>
          <div className="card w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Minus className="w-5 h-5 text-red-400" />
              </div>
              提现
            </h2>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">提现金额</label>
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
                <p className="text-sm text-slate-500 mt-1">可用余额: <span className="text-primary font-medium">¥{balance.toFixed(2)}</span></p>
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
                  disabled={submitting || !withdrawAmount || !accountNo || !accountName}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? '处理中...' : '确认提现'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
