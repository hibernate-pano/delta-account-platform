import { useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { paymentApi, orderApi } from '../../api';
import { useToast } from '../ui/Toast';
import { X, Wallet, CreditCard, Loader2 } from 'lucide-react';

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

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  amount,
  orderTitle,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState('BALANCE');
  const [loading, setLoading] = useState(false);

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
        toast('success', '支付成功');
        onSuccess();
      } else {
        // 第三方支付（模拟）
        toast('info', '第三方支付功能待开通，请使用余额支付');
      }
    } catch (error: any) {
      toast('error', error.response?.data?.message || '支付失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-dark-card rounded-2xl w-full max-w-md border border-dark-border shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">确认支付</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-lighter">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Info */}
          <div className="mb-6 p-4 bg-dark rounded-xl">
            <p className="text-sm text-gray-400 mb-1">商品信息</p>
            <p className="text-white font-medium mb-2 line-clamp-2">{orderTitle}</p>
            <p className="text-2xl font-bold text-primary">¥{amount}</p>
          </div>

          {/* Balance Info */}
          <div className="mb-6 p-4 bg-dark rounded-xl flex items-center justify-between">
            <span className="text-gray-400">账户余额</span>
            <span className="text-white font-medium">¥{user?.balance || 0}</span>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-400 mb-2">选择支付方式</p>
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                disabled={method.id !== 'BALANCE'}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-border hover:border-gray-600'
                } ${method.id !== 'BALANCE' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === method.id ? 'bg-primary' : 'bg-dark-lighter'
                }`}>
                  <method.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{method.name}</p>
                  <p className="text-xs text-gray-400">{method.desc}</p>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={loading || selectedMethod !== 'BALANCE'}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                支付中...
              </>
            ) : (
              `立即支付 ¥${amount}`
            )}
          </button>

          {/* Tips */}
          <p className="text-center text-xs text-gray-500 mt-4">
            点击支付即表示您同意我们的服务条款
          </p>
        </div>
      </div>
    </div>
  );
};
