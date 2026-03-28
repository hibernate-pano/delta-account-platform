import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { paymentApi, orderApi } from '../../api';
import { useToast } from '../ui/Toast';
import { X, Wallet, CreditCard, Loader2, AlertCircle, Zap, Clock } from 'lucide-react';

interface PaymentModalProps {
  orderId: number;
  amount: number;
  orderTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { id: 'BALANCE', name: '余额支付', icon: Wallet, desc: '使用账户余额支付' },
  { id: 'ALIPAY', name: '支付宝', icon: CreditCard, desc: '推荐支付宝用户使用' },
  { id: 'WECHAT', name: '微信支付', icon: CreditCard, desc: '推荐微信用户使用' },
];

const PAYMENT_TIMEOUT_SECONDS = 600; // 10 minutes
const URGENT_THRESHOLD_SECONDS = 120; // 2 minutes — red warning

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  amount,
  orderTitle,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState('BALANCE');
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(PAYMENT_TIMEOUT_SECONDS);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      showToast('支付超时，请重新下单', 'warning');
      onClose();
      return;
    }
    const timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, onClose, showToast]);

  // Keyboard dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const balance = user?.balance ?? 0;
  const insufficientBalance = selectedMethod === 'BALANCE' && balance < amount;
  const deficit = amount - balance;

  const handlePay = async () => {
    setLoading(true);
    try {
      // 创建支付记录
      const res = await paymentApi.create({
        orderId,
        paymentMethod: selectedMethod,
      });
      const paymentId = res.data.data.id;

      // 如果是余额支付，直接扣款
      if (selectedMethod === 'BALANCE') {
        await paymentApi.pay(paymentId);
        showToast('支付成功', 'success');
        onSuccess();
      } else {
        // 第三方支付（模拟）
        showToast('第三方支付功能待开通，请使用余额支付', 'info');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || '支付失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md" role="presentation" onClick={onClose} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="relative bg-dark-card rounded-2xl w-full max-w-md border border-dark-border shadow-2xl animate-slide-up hover:shadow-primary/10 transition-shadow duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 id="payment-modal-title" className="text-xl font-bold text-white">确认支付</h2>
          <button onClick={onClose} aria-label="关闭" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-lighter">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Info */}
          <div className="mb-6 p-4 bg-dark rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-sm text-slate-400">商品信息</p>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${
                timeRemaining <= URGENT_THRESHOLD_SECONDS
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-slate-500/20 text-slate-400'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
            </div>
            <p className="text-white font-medium mb-2 line-clamp-2">{orderTitle}</p>
            <p className="text-2xl font-bold text-primary">¥{amount}</p>
          </div>

          {/* Balance Info */}
          <div className="mb-4 p-4 bg-dark rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">账户余额</span>
              <span className={`font-medium ${insufficientBalance ? 'text-red-400' : 'text-white'}`}>
                ¥{balance.toFixed(2)}
              </span>
            </div>
            {insufficientBalance && (
              <button
                onClick={() => { onClose(); navigate('/wallet'); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Zap className="w-3 h-3" />
                去充值
              </button>
            )}
          </div>

          {/* Insufficient balance warning */}
          {insufficientBalance && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-medium">余额不足</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  还差 ¥{deficit.toFixed(2)}，请先充值后再支付
                </p>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3 mb-5">
            <p className="text-sm text-slate-400 mb-2">选择支付方式</p>
            {PAYMENT_METHODS.map((method) => {
              const isDisabled = method.id !== 'BALANCE';
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => !isDisabled && setSelectedMethod(method.id)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-border hover:border-slate-600'
                  } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary' : 'bg-dark-lighter'
                  }`}>
                    <method.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium flex items-center gap-2">
                      {method.name}
                      {isDisabled && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/30 text-slate-400 rounded">
                          即将上线
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isDisabled ? '暂不可用' : method.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pay Button */}
          <button
            onClick={insufficientBalance ? () => { onClose(); navigate('/wallet'); } : handlePay}
            disabled={loading || (selectedMethod !== 'BALANCE' && !insufficientBalance)}
            className={`w-full py-4 text-lg flex items-center justify-center gap-2 transition-all ${
              insufficientBalance
                ? 'btn-secondary border-red-500/30 text-red-400 hover:border-red-500/50'
                : 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                支付中...
              </>
            ) : insufficientBalance ? (
              <>余额不足，去充值</>
            ) : (
              <>立即支付 ¥{amount}</>
            )}
          </button>

          <div className="flex gap-3 mt-3">
            <button onClick={onClose} className="btn-secondary flex-1 !py-2.5 text-sm">
              取消
            </button>
          </div>

          {/* Tips */}
          <p className="text-center text-xs text-slate-500 mt-4">
            点击支付即表示您同意我们的服务条款
          </p>
        </div>
      </div>
    </div>
  );
};
