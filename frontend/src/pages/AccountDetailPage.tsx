import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { accountApi, orderApi, messageApi } from '../api';
import { Account } from '../types';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { ImageGallery } from '../components/ui/ImageGallery';
import { Gamepad2, Shield, Clock, User, Star, AlertCircle, MessageCircle, ChevronRight, ShoppingCart, ArrowLeft, Share2, Heart, Copy, Check } from 'lucide-react';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [renting, setRenting] = useState(false);
  const [rentHours, setRentHours] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'details'>('info');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await accountApi.getById(Number(id));
        setAccount(res.data.data);
      } catch (error) {
        console.error('Failed to fetch account:', error);
        showToast('加载账号详情失败', 'error');
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
      showToast('购买成功！正在跳转订单页...', 'success');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (error: any) {
      showToast(error.response?.data?.message || '购买失败，请重试', 'error');
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
      showToast(`租赁成功！租期 ${rentHours} 小时，正在跳转订单页...`, 'success');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (error: any) {
      showToast(error.response?.data?.message || '租赁失败，请重试', 'error');
    } finally {
      setRenting(false);
    }
  };

  const handleContactSeller = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!account?.seller) return;
    try {
      const res = await messageApi.createSession({
        accountId: Number(id),
        sellerId: account.seller.id
      });
      showToast('正在打开聊天窗口...', 'info');
      setTimeout(() => navigate(`/messages/${res.data.data.id}`), 500);
    } catch (error: any) {
      showToast(error.response?.data?.message || '创建会话失败', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('链接已复制到剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = user?.id === account?.seller?.id;
  const isOnSale = account?.status === 'ON_SALE';

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-48 skeleton rounded" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-video skeleton rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 skeleton rounded" />
            <div className="h-6 w-1/4 skeleton rounded" />
            <div className="h-12 w-full skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-gray-500 mb-4">账号不存在</p>
        <Link to="/accounts" className="btn-primary">
          返回市场
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 hover:bg-dark-lighter">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-medium text-slate-400 truncate">{account.title}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="btn-ghost p-2" title="分享">
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
          </button>
          <button className="btn-ghost p-2" title="收藏">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div>
          <ImageGallery images={account.images || []} title={account.title} />
        </div>

        {/* Right: Info */}
        <div>
          {/* Title & Badges */}
          <h1 className="text-2xl font-bold mb-4">{account.title}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
              {account.gameRank || '暂无段位'}
            </span>
            <span className="px-3 py-1 bg-dark-lighter text-slate-400 rounded-full text-sm">
              🎨 {account.skinCount} 皮肤
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              account.verificationStatus === 'VERIFIED'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {account.verificationStatus === 'VERIFIED' ? '✅ 已认证' : '⏳ 待审核'}
            </span>
            {account.status === 'ON_SALE' && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                🔥 出售中
              </span>
            )}
          </div>

          {/* Price */}
          <div className="card mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">一口价</span>
              <span className="text-4xl font-bold text-primary">¥{account.price}</span>
            </div>
            {account.rentalPrice && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">时租价</span>
                <span className="text-xl font-semibold text-slate-300">
                  ¥{account.rentalPrice}/小时
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-dark-lighter rounded-lg p-1">
            {[
              { key: 'info', label: '账号信息' },
              { key: 'details', label: '详细描述' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="card mb-6 min-h-[180px]">
            {activeTab === 'info' ? (
              <div className="space-y-3">
                {[
                  { label: '游戏段位', value: account.gameRank || '未填写' },
                  { label: '皮肤数量', value: `${account.skinCount} 个` },
                  { label: '所属英雄', value: account.weapons || '未填写' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {account.description || '暂无详细描述'}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isOwner ? (
              <div className="text-center py-3 text-slate-500">
                这是您发布的账号
              </div>
            ) : isOnSale ? (
              <>
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {buying ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      立即购买
                    </>
                  )}
                </button>
                {account.rentalPrice && (
                  <div className="flex gap-3">
                    <select
                      value={rentHours}
                      onChange={(e) => setRentHours(Number(e.target.value))}
                      className="input flex-1"
                    >
                      {[1, 2, 4, 8, 12, 24, 48, 72].map((h) => (
                        <option key={h} value={h}>
                          {h < 24 ? `${h} 小时` : `${h / 24} 天`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRent}
                      disabled={renting}
                      className="btn-secondary flex-1 py-3 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {renting ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          租 ¥{(account.rentalPrice * rentHours).toFixed(0)}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-3 text-slate-500">
                该账号暂不可购买
              </div>
            )}

            {/* Contact Seller */}
            {account.seller && !isOwner && (
              <button
                onClick={handleContactSeller}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                联系卖家
              </button>
            )}
          </div>

          {/* Seller Card */}
          {account.seller && (
            <div className="mt-6 p-4 bg-dark-lighter rounded-xl border border-dark-border">
              <p className="text-xs text-slate-500 mb-3">卖家信息</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {account.seller.nickname || account.seller.username}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    信誉分: {account.seller.creditScore}
                  </div>
                </div>
                {!isOwner && (
                  <button
                    onClick={handleContactSeller}
                    className="text-primary hover:text-primary-light text-sm font-medium flex items-center gap-1"
                  >
                    聊聊 <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetailPage;
