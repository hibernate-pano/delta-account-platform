import React, { useState, useEffect, useMemo } from 'react';
import { ReviewSkeleton } from '../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useWishlistStore } from '../store/wishlist';
import { useToast } from '../components/ui/Toast';
import { formatDateTime } from '../utils/format';
import { ConfirmInline } from '../components/ui/ConfirmInline';
import { favoriteApi } from '../api';
import { useAuthProfile, useMyOrders, useSellerAccounts, useUnreadCount, useUpdateProfile, useSellerReviews, useReplyReview, useSellerReviewStats } from '../hooks/useQueries';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  User, Package, FileText, LogOut, ChevronRight,
  Star, Shield, TrendingUp, Gamepad2, CheckCircle, Clock, Heart, X,
  MessageCircle, Bell, Wallet, Edit2, BarChart2, RefreshCw, AlertCircle, Send, Upload, Eye, ShoppingCart,
  Image, Pencil, Smartphone, Mail, Crown, Sparkles, ShoppingBag
} from 'lucide-react';

import { Review } from '../types';

// Review card with inline reply capability
const ReviewCard: React.FC<{
  review: Review;
  replyMutation: ReturnType<typeof useReplyReview>;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}> = ({ review, replyMutation, showToast }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({ id: review.id, reply: replyText.trim() });
      showToast('回复已发送', 'success');
      setReplyText('');
      setShowReplyInput(false);
    } catch {
      showToast('回复失败，请重试', 'error');
    }
  };

  return (
    <div className="card p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-slate-300">
              {review.reviewer?.nickname || review.reviewer?.username || '匿名用户'}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-600">{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
            {review.accountTitle && (
              <span className="text-[10px] px-1.5 py-0.5 bg-dark rounded text-slate-500">账号: {review.accountTitle}</span>
            )}
          </div>
          {review.content && (
            <p className="text-sm text-slate-400 leading-relaxed">{review.content}</p>
          )}
          {review.reply && (
            <div className="mt-2 pl-3 border-l-2 border-primary/30">
              <p className="text-xs text-slate-500 mb-0.5">商家回复:</p>
              <p className="text-sm text-slate-400">{review.reply}</p>
            </div>
          )}
          {!review.reply && (
            <div className="mt-2">
              {showReplyInput ? (
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReply(); if (e.key === 'Escape') { setShowReplyInput(false); setReplyText(''); } }}
                    placeholder="写下你的回复..."
                    className="input flex-1 !py-2 !text-xs"
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitReply}
                    disabled={replyMutation.isPending || !replyText.trim()}
                    className="px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setShowReplyInput(false); setReplyText(''); }}
                    className="px-2 py-2 text-slate-500 hover:text-white transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowReplyInput(true)}
                  className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  回复评价
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  usePageTitle('个人中心');
  const navigate = useNavigate();
  const { token, user, logout, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'accounts' | 'orders' | 'stats' | 'wishlist' | 'reviews'>('accounts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearWishlistConfirm, setShowClearWishlistConfirm] = useState(false);
  const [accountSort, setAccountSort] = useState<'newest' | 'oldest' | 'price-high' | 'price-low' | 'views'>('newest');

  const { data: profileData, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useAuthProfile();
  const { data: ordersData, isLoading: ordersLoading, isError: ordersError } = useMyOrders();
  const { data: unreadData } = useUnreadCount();

  const profile = profileData?.data?.data;
  const profileId = profile?.id ?? user?.id;
  const { data: sellerAccounts, isLoading: accountsLoading, isError: accountsError } = useSellerAccounts(profileId);
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useSellerReviews(profileId);
  const { data: reviewStatsData, isLoading: reviewStatsLoading } = useSellerReviewStats(profileId);
  const reviewStats = reviewStatsData?.data?.data;
  const replyMutation = useReplyReview();

  const accounts = sellerAccounts || [];
  const orders = ordersData?.data?.data?.records || [];
  const reviews = reviewsData?.data?.data || [];

  const { items: wishlistItems, removeItem, addItem } = useWishlistStore();
  const wishlistCount = wishlistItems.length;

  const anyError = profileError || ordersError || accountsError;
  const refetchAll = () => { refetchProfile?.(); };

  const handleLogout = () => {
    logout();
    showToast('已安全退出登录', 'success');
    navigate('/');
  };

  const stats = {
    totalAccounts: accounts.length,
    onSale: accounts.filter((a: any) => a.status === 'ON_SALE').length,
    sold: accounts.filter((a: any) => a.status === 'SOLD').length,
    totalOrders: orders.length,
    completedOrders: orders.filter((o: any) => o.status === 'COMPLETED').length,
    creditScore: profile?.creditScore ?? user?.creditScore ?? 100,
    totalSpent: orders
      .filter((o: any) => o.status === 'COMPLETED' && o.type === 'BUY')
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0),
    totalEarned: accounts
      .filter((a: any) => a.status === 'SOLD')
      .reduce((sum: number, a: any) => sum + (a.price || 0), 0),
    avgOrderValue: orders.filter((o: any) => o.status === 'COMPLETED').length > 0
      ? orders.filter((o: any) => o.status === 'COMPLETED').reduce((sum: number, o: any) => sum + (o.amount || 0), 0) /
        orders.filter((o: any) => o.status === 'COMPLETED').length
      : 0,
  };

  const getCreditLevel = (score: number) => {
    if (score >= 90) return { label: '卓越', color: 'text-yellow-400', icon: Star };
    if (score >= 70) return { label: '优秀', color: 'text-green-400', icon: TrendingUp };
    if (score >= 50) return { label: '良好', color: 'text-blue-400', icon: CheckCircle };
    return { label: '一般', color: 'text-slate-400', icon: Clock };
  };

  const creditLevel = getCreditLevel(stats.creditScore);
  const CreditIcon = creditLevel.icon;

  // Profile completeness score + missing fields list
  const completenessFields = [
    { key: 'avatar', label: '上传头像', done: !!(profile?.avatar || user?.avatar), icon: Image },
    { key: 'nickname', label: '设置昵称', done: !!(profile?.nickname || user?.nickname), icon: Pencil },
    { key: 'phone', label: '绑定手机', done: !!(profile?.phone || user?.phone), icon: Smartphone },
    { key: 'email', label: '填写邮箱', done: !!(profile?.email || user?.email), icon: Mail },
  ];
  const missingFields = completenessFields.filter(f => !f.done);
  const completeness = Math.round(completenessFields.filter(f => f.done).length / completenessFields.length * 100);

  const isLoading = profileLoading || ordersLoading || accountsLoading;

  if (!token) {
    navigate('/login');
    return null;
  }

  if (anyError) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">加载失败</h2>
        <p className="text-slate-500 mb-6">无法获取个人资料，请检查网络后重试</p>
        <button
          onClick={refetchAll}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.avatar || user?.avatar ? (
                <img
                  src={profile?.avatar || user?.avatar}
                  alt=""
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-primary/30 shadow-lg shadow-primary/20"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border-2 border-primary/30 bg-gradient-to-br from-primary to-purple-500 text-white font-bold text-xl md:text-2xl shadow-lg shadow-primary/20">
                  {(profile?.nickname || user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {profile?.role === 'ADMIN' && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-dark-card">
                  <Shield className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl md:text-2xl font-bold">
                  {profile?.nickname || user?.nickname || user?.username}
                </h2>
                {profile?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    管理员
                  </span>
                )}
              </div>
              <p className="text-slate-500">@{profile?.username || user?.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="card-static p-3 text-center">
              <div className={`flex items-center justify-center gap-1 mb-1 ${creditLevel.color}`}>
                <CreditIcon className="w-4 h-4" />
                <span className="font-bold">{stats.creditScore}</span>
              </div>
              <p className="text-xs text-slate-500">信誉分 · {creditLevel.label}</p>
            </div>
            <div className="card-static p-3 text-center">
              <p className="text-xl font-bold text-primary">
                ¥{(profile?.balance ?? user?.balance ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">账户余额</p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="card-static p-3 flex items-center gap-2 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">编辑资料</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Completeness Meter */}
      {completeness < 100 && (
        <div className="card mb-4 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-slate-300">资料完整度</span>
            </div>
            <span className={`text-sm font-bold ${completeness >= 80 ? 'text-green-400' : completeness >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {completeness}%
            </span>
          </div>
          <div className="h-1.5 bg-dark-lighter rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                completeness >= 80 ? 'bg-green-400' : completeness >= 50 ? 'bg-yellow-400' : 'bg-primary'
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {completeness < 50 ? '完善资料可提高交易安全性，建议补充头像和联系方式' :
             completeness < 80 ? '再完善一下就能提升信用分了，上传头像和绑定手机' :
             '资料完善度优秀！'}
          </p>
          {/* Quick-action chips for missing fields */}
          {missingFields.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {missingFields.slice(0, 4).map((field) => (
                <button
                  key={field.key}
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dark-lighter hover:bg-dark-lighter/80 border border-dark-border hover:border-primary/40 rounded-full text-xs text-slate-400 hover:text-primary transition-all"
                >
                  <span>{React.createElement(field.icon, { className: 'w-3.5 h-3.5' })}</span>
                  <span>{field.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-lighter rounded-lg p-1 w-fit">
        {[
          { key: 'accounts', label: '我的账号', icon: Package, count: stats.totalAccounts },
          { key: 'orders', label: '订单记录', icon: FileText, count: stats.totalOrders },
          { key: 'stats', label: '数据统计', icon: TrendingUp, count: null },
          { key: 'wishlist', label: '我的收藏', icon: Heart, count: wishlistCount },
          { key: 'reviews', label: '收到的评价', icon: Star, count: reviews.length || null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:text-white hover:bg-dark-lighter/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-dark'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 skeleton rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-32 skeleton rounded mb-2" />
                  <div className="h-3 w-48 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">发布的账号</h3>
                <div className="flex items-center gap-2">
                  {accounts.length > 1 && (
                    <select
                      value={accountSort}
                      onChange={(e) => setAccountSort(e.target.value as typeof accountSort)}
                      className="bg-dark border border-dark-border text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="newest">最新发布</option>
                      <option value="oldest">最早发布</option>
                      <option value="price-high">价格最高</option>
                      <option value="price-low">价格最低</option>
                      <option value="views">浏览最多</option>
                    </select>
                  )}
                  <Link to="/sell" className="btn-primary text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    发布新账号
                  </Link>
                </div>
              </div>

              {/* Seller accounts aggregate stats */}
              {accounts.length > 0 && (
                <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-dark-card border border-dark-border hover:border-slate-600 transition-all rounded-xl">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-slate-400">上架中</span>
                    <span className="font-semibold text-white">{stats.onSale}</span>
                  </div>
                  <div className="w-px h-4 bg-dark-border" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400">已售</span>
                    <span className="font-semibold text-green-400">{stats.sold}</span>
                  </div>
                  <div className="w-px h-4 bg-dark-border" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400">总价值</span>
                    <span className="font-semibold text-amber-400">
                      ¥{accounts.filter((a: any) => a.status === 'ON_SALE').reduce((s: number, a: any) => s + a.price, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-dark-border" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-400">总浏览</span>
                    <span className="font-semibold text-purple-400">
                      {accounts.reduce((s: number, a: any) => s + (a.viewCount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {accountsLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card">
                      <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden">
                        <div className="w-full h-full bg-dark-lighter animate-pulse" />
                      </div>
                      <div className="h-5 w-3/4 bg-dark-lighter rounded mb-2 animate-pulse" />
                      <div className="flex justify-between">
                        <div className="h-6 w-16 bg-dark-lighter rounded animate-pulse" />
                        <div className="h-4 w-16 bg-dark-lighter rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gamepad2 className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-400">暂无发布的账号</h3>
                  <p className="text-slate-600 mb-6">发布你的第一个账号开始变现</p>
                  <Link to="/sell" className="btn-primary inline-flex items-center gap-2">
                    立即发布
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {useMemo(() => {
                    const sorted = [...accounts].sort((a, b) => {
                      if (accountSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      if (accountSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      if (accountSort === 'price-high') return (b.price || 0) - (a.price || 0);
                      if (accountSort === 'price-low') return (a.price || 0) - (b.price || 0);
                      if (accountSort === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
                      return 0;
                    });
                    return sorted.map((account: any) => (
                    <div
                      key={account.id}
                      className="card hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden relative">
                        {account.images?.[0] ? (
                          <img
                            src={account.images[0]}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-8 h-8 text-slate-700" />
                          </div>
                        )}
                        {/* Edit button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${account.id}/edit`); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-primary/80 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          title="编辑账号"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-white" />
                        </button>
                        {/* Status badge */}
                        {account.verificationStatus === 'VERIFIED' && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-500/90 text-white text-[10px] rounded flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> 已认证
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {account.title}
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">¥{account.price}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            account.status === 'ON_SALE'
                              ? 'bg-green-500/20 text-green-400'
                              : account.status === 'SOLD'
                              ? 'bg-slate-500/20 text-slate-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {account.status === 'ON_SALE'
                            ? <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> 出售中</span>
                            : account.status === 'SOLD'
                            ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> 已出售</span>
                            : account.status}
                        </span>
                      </div>
                      {(account.viewCount != null || (account.orderCount != null && account.orderCount > 0)) && (
                        <div className="flex items-center gap-3 mt-1.5">
                          {account.viewCount != null && (
                            <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
                              <Eye className="w-3 h-3" />
                              {account.viewCount} 次浏览
                            </span>
                          )}
                          {account.orderCount != null && account.orderCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-green-400/70">
                              <ShoppingCart className="w-3 h-3" />
                              {account.orderCount} 笔售出
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card flex items-center gap-4">
                      <div className="w-12 h-12 bg-dark-lighter rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-dark-lighter rounded animate-pulse" />
                        <div className="h-3 w-48 bg-dark-lighter rounded animate-pulse" />
                      </div>
                      <div className="h-5 w-20 bg-dark-lighter rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-400">暂无订单记录</h3>
                  <p className="text-slate-600 mb-6">开始购买或租赁账号吧</p>
                  <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
                    去逛逛
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="card flex items-center gap-4 hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => navigate('/orders')}
                    >
                      {/* Account thumbnail */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark">
                        {order.account?.images?.[0] ? (
                          <img src={order.account.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {order.account?.title || `订单 #${order.orderNo.slice(-6)}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className={order.type === 'BUY' ? 'text-blue-400' : 'text-purple-400'}>
                            {order.type === 'BUY' ? '购买' : '租赁'}
                          </span>
                          {order.account?.gameRank && (
                            <span className="text-slate-600">{order.account.gameRank}</span>
                          )}
                          <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold">¥{order.amount.toFixed(2)}</p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-500/20 text-green-400'
                              : order.status === 'PENDING'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {order.status === 'COMPLETED'
                            ? '已完成'
                            : order.status === 'PENDING'
                            ? '待支付'
                            : order.status === 'CANCELLED'
                            ? '已取消'
                            : order.status === 'PROCESSING'
                            ? '处理中'
                            : order.status}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  账号统计
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">发布总数</span>
                    <span className="font-medium">{stats.totalAccounts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">正在出售</span>
                    <span className="font-medium text-green-400">{stats.onSale}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">已成功售出</span>
                    <span className="font-medium text-blue-400">{stats.sold}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  订单统计
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">订单总数</span>
                    <span className="font-medium">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">已完成</span>
                    <span className="font-medium text-green-400">{stats.completedOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">完成率</span>
                    <span className="font-medium text-blue-400">
                      {stats.totalOrders > 0
                        ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(0)}%`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spending / Earnings Card */}
              {(stats.totalSpent > 0 || stats.totalEarned > 0) && (
                <div className="card">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    交易统计
                  </h3>
                  <div className="space-y-3">
                    {stats.totalEarned > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">累计收入</span>
                        <span className="font-medium text-green-400">+¥{stats.totalEarned.toFixed(2)}</span>
                      </div>
                    )}
                    {stats.totalSpent > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">累计消费</span>
                        <span className="font-medium text-red-400">-¥{stats.totalSpent.toFixed(2)}</span>
                      </div>
                    )}
                    {(stats.totalEarned > 0 || stats.totalSpent > 0) && (
                      <div className="flex justify-between items-center border-t border-dark-border pt-3">
                        <span className="text-slate-400">净收益</span>
                        <span className={`font-semibold ${stats.totalEarned - stats.totalSpent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stats.totalEarned - stats.totalSpent >= 0 ? '+' : ''}¥{(stats.totalEarned - stats.totalSpent).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {stats.avgOrderValue > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">平均客单价</span>
                        <span className="font-medium">¥{stats.avgOrderValue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order trend mini-chart */}
              {!ordersLoading && orders.length > 0 && (() => {
                const last7 = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const dateStr = d.toISOString().slice(0, 10);
                  const count = orders.filter((o: any) => o.createdAt?.startsWith(dateStr)).length;
                  return { date: dateStr, count, label: `${d.getMonth() + 1}/${d.getDate()}` };
                });
                const maxCount = Math.max(...last7.map(d => d.count), 1);
                const total7 = last7.reduce((s, d) => s + d.count, 0);
                return (
                  <div className="card">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      7日订单趋势
                    </h3>
                    <div className="flex items-end gap-1 h-16 mb-3">
                      {last7.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-dark-lighter rounded-t relative" style={{ height: 56 }}>
                            <div
                              className="absolute bottom-0 w-full bg-gradient-to-t from-primary/70 to-primary rounded-t transition-all hover:from-primary"
                              style={{ height: `${(d.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between px-1">
                      {last7.map((d, i) => (
                        <span key={i} className="text-[9px] text-slate-600 text-center flex-1">{d.label}</span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1 text-xs">
                      <span className="text-slate-500">7日订单</span>
                      <span className={total7 > 0 ? 'text-green-400 font-medium' : 'text-slate-500'}>{total7}笔</span>
                    </div>
                  </div>
                );
              })()}

              {/* Review Stats Summary */}
              {!reviewStatsLoading && reviewStats && (
                <div className="card">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    评价概览
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">平均评分</span>
                      <span className="font-medium text-yellow-400 flex items-center gap-1">
                        {(reviewStats.avgRating || 0).toFixed(1)}
                        <Star className="w-3 h-3 fill-yellow-400" />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">好评率</span>
                      <span className={`font-medium ${
                        (reviewStats.positiveRate || 0) >= 90 ? 'text-emerald-400' :
                        (reviewStats.positiveRate || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(reviewStats.positiveRate || 0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">评价总数</span>
                      <span className="font-medium text-blue-400">{reviewStats.totalCount}条</span>
                    </div>
                    {(reviewStats.fiveStarCount ?? 0) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-xs">5星</span>
                        <span className="text-xs text-slate-400">{reviewStats.fiveStarCount}条</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              {!ordersLoading && orders.length > 0 && (
                <div className="card">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    近期活动
                  </h3>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order: any) => {
                      const isBuy = ['BUY', 'RENT'].includes(order.type);
                      return (
                        <div key={order.id} className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-dark-lighter/50 transition-colors cursor-default">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isBuy ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {isBuy
                              ? <ShoppingBag className="w-4 h-4" />
                              : <TrendingUp className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300 truncate">
                              {isBuy ? '购买' : '出售'}了
                              <span className="text-primary ml-1">{order.account?.title || `订单 #${order.id}`}</span>
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
                                : ''}
                              {order.status && (
                                <span className={`ml-2 ${
                                  order.status === 'COMPLETED' ? 'text-green-400' :
                                  order.status === 'PENDING' ? 'text-yellow-400' :
                                  order.status === 'CANCELLED' ? 'text-red-400' : 'text-slate-500'
                                }`}>
                                  {order.status === 'COMPLETED' ? '已完成' :
                                   order.status === 'PENDING' ? '进行中' :
                                   order.status === 'CANCELLED' ? '已取消' : order.status}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={`text-sm font-medium flex-shrink-0 ${
                            isBuy ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {isBuy ? '-' : '+'}¥{(order.amount || 0).toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Achievement badges */}
                  {(stats.totalAccounts > 0 || stats.sold > 0) && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-dark-border">
                      <span className="text-xs text-slate-500">成就:</span>
                      {stats.totalAccounts >= 1 && (
                        <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> 首发账号
                        </span>
                      )}
                      {stats.sold >= 5 && (
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> 成功卖家
                        </span>
                      )}
                      {stats.totalAccounts >= 10 && (
                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> 资深卖家
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">我的收藏</h3>
                {wishlistCount > 0 && (
                  <button
                    onClick={() => setShowClearWishlistConfirm(true)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    清空全部 ({wishlistCount})
                  </button>
                )}
              </div>

              {showClearWishlistConfirm && (
                <div className="mb-4">
                  <ConfirmInline
                    message={`确定要清空全部 ${wishlistCount} 个收藏吗？`}
                    onConfirm={() => {
                      useWishlistStore.getState().clearAll();
                      showToast('已清空全部收藏', 'success');
                      setShowClearWishlistConfirm(false);
                    }}
                    onCancel={() => setShowClearWishlistConfirm(false)}
                    confirmLabel="清空"
                  />
                </div>
              )}

              {wishlistCount === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-20 h-20 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-400">暂无收藏</h3>
                  <p className="text-slate-600 mb-6">浏览账号市场，收藏心仪的账号</p>
                  <Link to="/accounts" className="btn-primary inline-flex items-center gap-2">
                    去逛逛
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((account) => (
                    <div key={account.id} className="card hover:border-primary/50 transition-all group relative">
                      {/* Remove button */}
                      <button
                        onClick={async () => {
                          removeItem(account.id);
                          showToast('已取消收藏', 'info');
                          try {
                            await favoriteApi.toggle(account.id);
                          } catch {
                            addItem(account);
                            showToast('操作失败，请重试', 'error');
                          }
                        }}
                        className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/50 hover:bg-red-500/80 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        title="取消收藏"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/accounts/${account.id}`)}
                      >
                        <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden">
                          {account.images?.[0] ? (
                            <img
                              src={account.images[0]}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gamepad2 className="w-8 h-8 text-slate-700" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                          {account.title}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-primary">¥{account.price}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400/80" /> {account.skinCount} 皮肤</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {reviewsLoading ? (
                <ReviewSkeleton count={3} />
              ) : reviews.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-20 h-20 bg-dark-lighter rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-slate-400">暂无评价</h3>
                  <p className="text-slate-600 text-sm">完成交易后买家会留下评价</p>
                </div>
              ) : (
                <>
                  {/* Trust stats summary */}
                  {reviewStatsLoading ? (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-dark border border-dark-border rounded-xl p-3 text-center">
                          <div className="h-6 w-12 bg-dark-lighter rounded skeleton mx-auto mb-1" />
                          <div className="h-2.5 w-10 bg-dark-lighter rounded skeleton mx-auto" />
                        </div>
                      ))}
                    </div>
                  ) : reviewStats && reviewStats.totalCount > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: '好评率', value: `${Math.round(reviewStats.positiveRate || 0)}%`, color: (reviewStats.positiveRate || 0) >= 90 ? 'text-emerald-400' : (reviewStats.positiveRate || 0) >= 70 ? 'text-yellow-400' : 'text-red-400' },
                        { label: '评价总数', value: `${reviewStats.totalCount}条`, color: 'text-blue-400' },
                        { label: '平均分', value: `${(reviewStats.avgRating || 0).toFixed(1)}`, color: 'text-yellow-400' },
                        { label: '信誉分', value: `${profile?.creditScore ?? profile?.sellerCreditScore ?? '—'}`, color: 'text-purple-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-dark border border-dark-border rounded-xl p-3 text-center">
                          <div className={`text-base font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Rating distribution */}
                  <div className="card mb-4 p-4">
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-white">
                        {(
                          reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
                        ).toFixed(1)}
                      </span>
                      <span className="text-slate-500 text-sm">/ 5</span>
                      <span className="text-slate-600 text-xs ml-2">({reviews.length} 条评价)</span>
                    </div>
                    <div className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r: any) => r.rating === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs group cursor-default">
                            <div className="flex items-center gap-0.5 w-8">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-slate-400">{star}</span>
                            </div>
                            <div className="flex-1 h-2 bg-dark rounded-full overflow-hidden group-hover:h-2.5 transition-all">
                              <div
                                className="h-full bg-yellow-400/70 group-hover:bg-yellow-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-slate-600 w-5 text-right group-hover:text-slate-400 transition-colors">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} replyMutation={replyMutation} showToast={showToast} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <h3 className="text-sm text-slate-500 mb-4">快捷操作</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/wallet" className="btn-secondary text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            钱包充值
          </Link>
          <Link to="/messages" className="btn-secondary text-sm flex items-center gap-2 relative">
            <MessageCircle className="w-4 h-4" />
            消息中心
            {unreadData?.messageCount ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                {(unreadData.messageCount ?? 0) > 9 ? '9+' : unreadData.messageCount}
              </span>
            ) : null}
          </Link>
          <Link to="/notifications" className="btn-secondary text-sm flex items-center gap-2 relative">
            <Bell className="w-4 h-4" />
            通知中心
            {unreadData?.notificationCount ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                {(unreadData.notificationCount ?? 0) > 9 ? '9+' : unreadData.notificationCount}
              </span>
            ) : null}
          </Link>
          <Link to="/refunds" className="btn-secondary text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            退款记录
          </Link>
          {showLogoutConfirm ? (
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-slate-500">确定退出?</span>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 font-medium">确认</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="text-xs text-slate-500 hover:text-slate-300">取消</button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn-secondary text-sm flex items-center gap-2 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          )}
        </div>
      </div>
      {/* Edit Profile Modal */}
      {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
    </div>
  );
};

export default ProfilePage;

// Edit Profile Modal
const EditProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const updateMutation = useUpdateProfile();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!nickname.trim()) { showToast('请输入昵称', 'error'); return; }
    const emailVal = email.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showToast('请输入有效的邮箱格式', 'error'); return;
    }
    try {
      await updateMutation.mutateAsync({ nickname: nickname.trim(), avatar, phone: phone.trim() || undefined, email: emailVal || undefined });
      showToast('资料更新成功！', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || '更新失败，请重试', 'error');
    }
  };

  const avatarPresets = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            编辑资料
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-dark-lighter flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative mb-3">
            {avatar ? (
              <img src={avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30" />
            ) : (
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center border-2 border-primary/30">
                <User className="w-10 h-10 text-primary" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3 text-center">选择头像</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {avatarPresets.map((url, i) => (
              <button
                key={i}
                onClick={() => setAvatar(url)}
                className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:scale-105 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-card ${
                  avatar === url
                    ? 'border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-dark-card scale-105'
                    : 'border-dark-border hover:border-slate-500 hover:bg-dark-lighter'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            id="avatar-upload"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                setAvatar(ev.target?.result as string);
                showToast('头像已上传', 'success');
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
          <label
            htmlFor="avatar-upload"
            className="text-xs text-primary hover:text-primary-light cursor-pointer flex items-center gap-1 mt-2 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            上传自定义头像
          </label>
        </div>

        {/* Nickname */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="设置您的昵称"
            maxLength={20}
            className="input w-full"
          />
          <p className="text-right text-xs text-slate-600 mt-1">{nickname.length}/20</p>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="绑定手机号（选填）"
            className="input w-full"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="绑定邮箱（选填）"
            className="input w-full"
          />
        </div>

        {/* Current info display */}
        <div className="mb-5 p-4 bg-gradient-to-br from-dark-lighter to-dark rounded-xl border border-dark-border">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">账户信息</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">用户名</span>
              <span className="text-xs text-slate-300 font-mono">@{user?.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">信誉分</span>
              <span className="text-xs font-medium text-yellow-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" />
                {user?.creditScore ?? '—'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full btn-primary !py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {updateMutation.isPending ? '保存中...' : '保存修改'}
        </button>
      </div>
    </div>
  );
};
