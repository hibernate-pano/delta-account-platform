import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { messageApi } from '../api';
import { Account } from '../types';
import { useAuthStore } from '../store/auth';
import { useRecentStore } from '../store/recent';
import { useToast } from '../components/ui/Toast';
import { ImageGallery } from '../components/ui/ImageGallery';
import { WishlistButton } from '../components/ui/WishlistButton';
import { useAccount, useBuyAccount, useRentAccount, useCreateSession, useSellerReviewStats, useSellerAccounts } from '../hooks/useQueries';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Gamepad2, User, Star, AlertCircle, MessageCircle, ChevronRight,
  ShoppingCart, ArrowLeft, Share2, Copy, Check, Clock, RefreshCw,
  Shield, CheckCircle
} from 'lucide-react';

const AccountDetailPage: React.FC = () => {
  usePageTitle('账号详情');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const addToRecent = useRecentStore((s) => s.addItem);

  const accountId = id ? parseInt(id) : 0;
  const { data, isLoading, isError, refetch } = useAccount(accountId);
  const buyMutation = useBuyAccount();
  const rentMutation = useRentAccount();
  const createSessionMutation = useCreateSession();
  const { data: reviewStatsData } = useSellerReviewStats(account?.sellerId);
  const reviewStats = reviewStatsData?.data?.data;
  const { data: sellerAccountsData } = useSellerAccounts(account?.sellerId);
  const sellerAccounts = (sellerAccountsData?.data?.data || []).filter(
    (a: any) => a.id !== accountId && a.status === 'ON_SALE'
  );

  const account: Account | undefined = data?.data?.data;

  // Track recently viewed
  React.useEffect(() => {
    if (account) {
      addToRecent(account);
    }
  }, [account?.id]);

  const [rentHours, setRentHours] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'details'>('info');
  const [copied, setCopied] = useState(false);

  const handleBuy = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await buyMutation.mutateAsync(accountId);
      showToast('购买成功！正在跳转订单页...', 'success');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err: any) {
      showToast(err.response?.data?.message || '购买失败，请重试', 'error');
    }
  };

  const handleRent = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await rentMutation.mutateAsync({ accountId, rentHours });
      showToast(`租赁成功！租期 ${rentHours} 小时，正在跳转订单页...`, 'success');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err: any) {
      showToast(err.response?.data?.message || '租赁失败，请重试', 'error');
    }
  };

  const handleContactSeller = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!account?.sellerId) return;
    try {
      const res = await createSessionMutation.mutateAsync({
        accountId,
        sellerId: account.sellerId,
      });
      showToast('正在打开聊天窗口...', 'info');
      setTimeout(() => navigate(`/messages/${res.data.data.id}`), 500);
    } catch (err: any) {
      showToast(err.response?.data?.message || '创建会话失败', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('链接已复制到剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = user?.id === account?.sellerId;
  const isOnSale = account?.status === 'ON_SALE';
  const isPending = buyMutation.isPending || rentMutation.isPending;

  if (isLoading) {
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

  if (isError || !account) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">{isError ? '加载失败' : '账号不存在'}</h2>
          <p className="text-slate-500 mb-6">{isError ? '无法获取账号详情，请检查网络' : '该账号可能已下架或不存在'}</p>
          <div className="flex justify-center gap-3">
            {isError ? (
              <button onClick={() => refetch()} className="btn-primary inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            ) : (
              <button onClick={() => navigate('/accounts')} className="btn-secondary">浏览账号市场</button>
            )}
            <button onClick={() => navigate(-1)} className="btn-ghost">返回上一页</button>
          </div>
        </div>
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
          {account && <WishlistButton account={account} size="md" className="!relative" />}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div>
          <ImageGallery images={account.images || []} title={account.title} />
        </div>

        {/* Right: Info */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{account.title}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
              {account.gameRank || '暂无段位'}
            </span>
            <span className="px-3 py-1 bg-dark-lighter text-slate-400 rounded-full text-sm">
              🎨 {account.skinCount} 皮肤
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                account.verificationStatus === 'VERIFIED'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
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
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
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
                  { label: '装备描述', value: account.weapons || '未填写' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-dark-border last:border-0"
                  >
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

          {/* Seller Trust Card */}
          {account.sellerId && (
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/8 to-purple-500/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/40 to-purple-500/40 rounded-full flex items-center justify-center border-2 border-primary/30">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-card" title="在线" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white truncate">
                      {account.sellerNickname || account.sellerUsername}
                    </p>
                    {account.verificationStatus === 'VERIFIED' && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded flex-shrink-0 items-center gap-0.5">
                        ✓ 已认证
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Star rating from real review stats */}
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => {
                        const avg = reviewStats?.avgRating ?? (account.sellerCreditScore || 50) / 20;
                        return (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= Math.round(avg)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-600'
                            }`}
                          />
                        );
                      })}
                    </div>
                    {reviewStats ? (
                      <span className="text-xs text-yellow-400 font-medium">
                        {(reviewStats.avgRating || 0).toFixed(1)}
                        <span className="text-slate-500 ml-1">({reviewStats.totalCount}条评价)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">暂无评价</span>
                    )}
                  </div>
                  {/* Review breakdown bar */}
                  {reviewStats && reviewStats.totalCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'].map((star, i) => {
                        const count = reviewStats[star as keyof typeof reviewStats] as number;
                        const pct = reviewStats.totalCount > 0 ? (count / reviewStats.totalCount * 100) : 0;
                        return pct > 0 && (
                          <div
                            key={star}
                            className="h-1 rounded-full bg-yellow-400/60"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                            title={`${['5','4','3','2','1'][i]}星: ${count}条`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                {!isOwner && (
                  <button
                    onClick={handleContactSeller}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-primary text-sm font-medium transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    聊聊
                  </button>
                )}
              </div>
              {/* Trust badges */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/10">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span>平台托管</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                  <span>账号认证</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>快速交付</span>
                </div>
              </div>
            </div>
          )}

          {/* Seller's Other Listings */}
          {sellerAccounts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <span className="text-slate-500">卖家其他账号</span>
                  <span className="px-2 py-0.5 bg-dark-lighter text-slate-500 text-xs rounded-full">{sellerAccounts.length}个在售</span>
                </h3>
                <Link
                  to={`/accounts?seller=${account?.sellerId}`}
                  className="text-xs text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {sellerAccounts.slice(0, 6).map((acc: any) => (
                  <Link
                    key={acc.id}
                    to={`/accounts/${acc.id}`}
                    className="flex-shrink-0 w-36 card p-2.5 hover:border-primary/40 transition-all group"
                  >
                    <div className="aspect-video bg-dark rounded-lg mb-2 overflow-hidden">
                      {acc.images?.[0] ? (
                        <img src={acc.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-5 h-5 text-gray-700" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-1">{acc.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-sm">¥{acc.price}</span>
                      {acc.verificationStatus === 'VERIFIED' && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isOwner ? (
              <div className="text-center py-3 text-slate-500">这是您发布的账号</div>
            ) : isOnSale ? (
              <>
                <button
                  onClick={handleBuy}
                  disabled={isPending}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {buyMutation.isPending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
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
                      disabled={isPending}
                      className="btn-secondary flex-1 py-3 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {rentMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
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
              <div className="text-center py-3 text-slate-500">该账号暂不可购买</div>
            )}

            {account.sellerId && !isOwner && (
              <button
                onClick={handleContactSeller}
                disabled={createSessionMutation.isPending}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createSessionMutation.isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    联系卖家
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailPage;
