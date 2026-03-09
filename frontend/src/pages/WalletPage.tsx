import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, CreditCard, ArrowRight, RefreshCw } from 'lucide-react';

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
        walletApi.getTransactions({ page: 1, size: 20 })
      ]);
      setBalance(balanceRes.data.data.balance || 0);
      setTransactions(transRes.data.data.records || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) return;
    
    setSubmitting(true);
    try {
      await walletApi.recharge({ amount: parseFloat(rechargeAmount) });
      alert('充值成功！');
      setShowRechargeModal(false);
      setRechargeAmount('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || '充值失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    if (!accountNo || !accountName) {
      alert('请填写完整的提现信息');
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
      alert('提现申请已提交！');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setAccountNo('');
      setAccountName('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || '提现失败');
    } finally {
      setSubmitting(false);
    }
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

  const getTypeColor = (type: string) => {
    if (type === 'RECHARGE' || type === 'SELL' || type === 'REFUND') {
      return 'text-green-500';
    }
    return 'text-red-500';
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">我的钱包</h1>

      {/* Balance Card */}
      <div className="card mb-6 bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/30 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">账户余额</p>
              <p className="text-3xl font-bold text-white">¥{balance.toFixed(2)}</p>
            </div>
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'balance', label: '交易明细', icon: TrendingUp },
          { key: 'recharges', label: '充值记录', icon: CreditCard },
          { key: 'withdrawals', label: '提现记录', icon: CreditCard },
          { key: 'transactions', label: '流水记录', icon: TrendingDown },
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
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500">暂无交易记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                  {tx.type === 'RECHARGE' || tx.type === 'SELL' || tx.type === 'REFUND' ? '+' : ''}
                  ¥{tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">充值</h2>
            <form onSubmit={handleRecharge}>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">充值金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="input w-full pl-10"
                    placeholder="请输入充值金额"
                    step="0.01"
                    min="1"
                    max="10000"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setRechargeAmount(amount.toString())}
                    className="py-2 bg-dark-lighter rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    ¥{amount}
                  </button>
                ))}
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
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '确认充值'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">提现</h2>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">提现金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input w-full pl-10"
                    placeholder="请输入提现金额"
                    step="0.01"
                    min="1"
                    max={balance}
                    required
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">可用余额: ¥{balance.toFixed(2)}</p>
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
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '确认提现'}
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
