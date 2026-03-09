import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountApi, orderApi } from '../api';
import { Account } from '../types';
import { useAuthStore } from '../store/auth';
import { Gamepad2, Shield, Clock, User, Star, AlertCircle, CheckCircle } from 'lucide-react';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [renting, setRenting] = useState(false);
  const [rentHours, setRentHours] = useState(1);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await accountApi.getById(Number(id));
        setAccount(res.data.data);
      } catch (error) {
        console.error('Failed to fetch account:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [id]);

  const handleBuy = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setBuying(true);
    try {
      const res = await orderApi.create({ accountId: Number(id), type: 'BUY' });
      const orderId = res.data.data.id;
      await orderApi.pay(orderId);
      alert('购买成功！');
      navigate('/orders');
    } catch (error: any) {
      alert(error.response?.data?.message || '购买失败');
    } finally {
      setBuying(false);
    }
  };

  const handleRent = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setRenting(true);
    try {
      const res = await orderApi.create({
        accountId: Number(id),
        type: 'RENT',
        rentHours
      });
      const orderId = res.data.data.id;
      await orderApi.pay(orderId);
      alert('租赁成功！');
      navigate('/orders');
    } catch (error: any) {
      alert(error.response?.data?.message || '租赁失败');
    } finally {
      setRenting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">加载中...</div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-gray-500">账号不存在</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-video bg-dark rounded-xl overflow-hidden mb-4">
            {account.images && account.images.length > 0 ? (
              <img
                src={account.images[0]}
                alt={account.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad2 className="w-20 h-20 text-gray-700" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{account.title}</h1>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
              {account.gameRank || '暂无段位'}
            </span>
            <span className="px-3 py-1 bg-dark-lighter text-gray-400 rounded-full text-sm">
              {account.skinCount} 皮肤
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              account.verificationStatus === 'VERIFIED' 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {account.verificationStatus === 'VERIFIED' ? '已认证' : '待审核'}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">售价</span>
              <span className="text-3xl font-bold text-primary">¥{account.price}</span>
            </div>
            {account.rentalPrice && (
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">时租</span>
                <span className="text-xl font-semibold">¥{account.rentalPrice}/小时</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleBuy}
              disabled={buying || account.status !== 'ON_SALE'}
              className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buying ? '处理中...' : '立即购买'}
            </button>
            {account.rentalPrice && (
              <div className="flex gap-3">
                <select
                  value={rentHours}
                  onChange={(e) => setRentHours(Number(e.target.value))}
                  className="input flex-1"
                >
                  {[1, 2, 4, 8, 24, 72].map((h) => (
                    <option key={h} value={h}>
                      {h} 小时
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRent}
                  disabled={renting || account.status !== 'ON_SALE'}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {renting ? '处理中...' : `租 ¥${account.rentalPrice * rentHours}`}
                </button>
              </div>
            )}
          </div>

          {/* Seller Info */}
          {account.seller && (
            <div className="mt-6 p-4 bg-dark-lighter rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{account.seller.nickname || account.seller.username}</p>
                  <p className="text-sm text-gray-500">
                    信誉分: {account.seller.creditScore}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {account.description && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">账号描述</h2>
          <div className="card">
            <p className="text-gray-300 whitespace-pre-wrap">{account.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDetailPage;
