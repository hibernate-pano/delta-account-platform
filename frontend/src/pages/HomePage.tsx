import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Account } from '../types';
import { AccountCardSkeleton } from '../components/ui/Skeleton';
import { WishlistButton } from '../components/ui/WishlistButton';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useAuthStore } from '../store/auth';
import { useRecentStore } from '../store/recent';
import { useAccounts, useMyOrders } from '../hooks/useQueries';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Search, Shield, Clock, TrendingUp, ArrowRight, Gamepad2, Users, Lock, Zap,
  Sparkles, CheckCircle, Star, Crown, ChevronRight, TrendingUp as TrendingUpIcon, Eye,
  ChevronDown, MessageSquare, ThumbsUp, AlertCircle, History, X, User,
} from 'lucide-react';

// Featured completed orders as testimonials
const FeaturedOrders: React.FC = () => {
  const { data: ordersData, isLoading } = useMyOrders();
  const orders = ordersData?.data?.data?.records || [];
  const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED').slice(0, 3);

  const sampleTestimonials = [
    { name: '阿杰', role: '买家', avatar: User, game: '王者荣耀', amount: '¥1,299', content: '第一次在这买账号，整体流程非常顺畅。卖家响应很快，账号信息和描述完全一致，十分钟就完成了交易！', highlight: '交易超快' },
    { name: '星星', role: '卖家', avatar: Star, game: '和平精英', amount: '¥888', content: '闲置账号放了一个月都没卖出去，在 DeltaHub 上架第二天就成交了。提现秒到账，以后有账号都来这里卖。', highlight: '提现秒到' },
    { name: '小李', role: '买家', avatar: Gamepad2, game: '英雄联盟', amount: '¥88/天', content: '租号体验超出预期！账号很干净，段位真实，价格比市面便宜很多，有押金保障很放心。', highlight: '价格实惠' },
  ];

  const displayOrders = completedOrders.length >= 2 ? completedOrders : [];

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-static p-6 animate-pulse">
            <div className="flex gap-0.5 mb-4"><div className="h-4 w-20 bg-dark-lighter rounded" /></div>
            <div className="h-4 w-24 bg-dark-lighter rounded mb-3" />
            <div className="space-y-2 mb-4"><div className="h-3 w-full bg-dark-lighter rounded" /><div className="h-3 w-3/4 bg-dark-lighter rounded" /></div>
            <div className="h-6 w-16 bg-dark-lighter rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {displayOrders.length >= 2 ? displayOrders.map((order: any, i: number) => (
        <div key={order.id} className="card-static p-6 hover:border-primary/30 transition-all group relative">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          {/* Stars */}
          <div className="flex gap-0.5 mb-4">
            {[...Array(5)].map((_, s) => (
              <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          {/* Game badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-dark rounded text-slate-500">{order.account?.gameType || order.accountTitle || '游戏账号'}</span>
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">{order.type === 'BUY' ? '买家' : '租客'}</span>
            <span className="ml-auto text-xs font-medium text-green-400">
              {order.type === 'RENT' ? `¥${order.amount}/天` : `¥${order.amount}`}
            </span>
          </div>
          {/* Content */}
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            "{order.seller?.nickname ? `与卖家 ${order.seller.nickname} 完成交易，账号真实可靠！` : '交易顺利完成，平台保障很到位！'}"
          </p>
          {/* Highlight */}
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full">
            <ThumbsUp className="w-3 h-3" /> {order.type === 'BUY' ? '购买成功' : '租用成功'}
          </div>
          {/* User */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-border">
            <div className="w-8 h-8 bg-dark rounded-full flex items-center justify-center">
              {order.seller?.nickname ? (
                <span className="text-sm text-slate-400">{order.seller.nickname[0]}</span>
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{order.seller?.nickname || '平台用户'}</p>
              <p className="text-xs text-slate-600">已完成交易</p>
            </div>
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle className="w-3 h-3" /> 已验证
            </span>
          </div>
        </div>
      )) : sampleTestimonials.map((t, i) => (
        <div key={i} className="card-static p-6 hover:border-primary/30 transition-all group relative">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="flex gap-0.5 mb-4">
            {[...Array(5)].map((_, s) => (
              <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-dark rounded text-slate-500">{t.game}</span>
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">{t.role}</span>
            <span className="ml-auto text-xs font-medium text-green-400">{t.amount}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">"{t.content}"</p>
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full">
            <ThumbsUp className="w-3 h-3" /> {t.highlight}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-border">
            <div className="w-8 h-8 bg-dark rounded-full flex items-center justify-center">{React.createElement(t.avatar, { className: 'w-4 h-4 text-slate-400' })}</div>
            <div>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-slate-600">已完成交易</p>
            </div>
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle className="w-3 h-3" /> 已验证
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Animated counter
const AnimatedCounter: React.FC<{ end: number; suffix?: string; prefix?: string; duration?: number }> = ({
  end, suffix = '', prefix = '', duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <div ref={ref} className="text-3xl font-bold text-white">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
};


// FAQ Accordion Item
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden p-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-dark-lighter hover:bg-dark-lighter/40 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

const HomePage: React.FC = () => {
  usePageTitle();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [keyword, setKeyword] = useState('');

  const { data, isLoading, isError } = useAccounts({ size: 8 });
  const accounts: Account[] = data?.data?.data?.records || [];
  const { items: recentItems } = useRecentStore();
  const [hydrated, setHydrated] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // Featured = verified accounts
  const featuredAccounts = accounts.filter((a) => a.verificationStatus === 'VERIFIED').slice(0, 4);
  const displayAccounts = accounts.slice(0, 6);

  // Stats derived from latest fetched listings
  const verifiedCount = accounts.filter(a => a.verificationStatus === 'VERIFIED').length;
  const onSaleCount = accounts.filter(a => a.status === 'ON_SALE').length;
  const maxSkins = accounts.length > 0 ? Math.max(...accounts.map(a => a.skinCount || 0)) : 0;

  // Dynamic price thresholds from actual price distribution (quartile-based, linear interpolation)
  const prices = accounts.map(a => a.price).filter(p => p > 0).sort((a, b) => a - b);
  const quantile = (arr: number[], q: number): number => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return arr[base + 1] !== undefined
      ? arr[base] + rest * (arr[base + 1] - arr[base])
      : arr[base];
  };
  const q1 = prices.length >= 4 ? Math.round(quantile(prices, 0.25)) : null;
  const q2 = prices.length >= 4 ? Math.round(quantile(prices, 0.5)) : null;
  const q3 = prices.length >= 4 ? Math.round(quantile(prices, 0.75)) : null;

  const categories = useMemo(() => (() => {
    if (prices.length < 4 || q1 == null || q2 == null || q3 == null) {
      const maxP = prices.length > 0 ? Math.max(...prices) : 1000;
      const tier1 = Math.round(maxP * 0.25);
      const tier2 = Math.round(maxP * 0.5);
      const tier3 = Math.round(maxP * 0.75);
      return [
        { label: '入门价', Icon: Sparkles, color: 'text-green-400', bg: 'bg-green-400/20', desc: `¥${tier1}以下`, count: accounts.filter(a => a.price < tier1).length },
        { label: '中端价', Icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/20', desc: `¥${tier1}-${tier2}`, count: accounts.filter(a => a.price >= tier1 && a.price < tier2).length },
        { label: '高端价', Icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20', desc: `¥${tier2}-${tier3}`, count: accounts.filter(a => a.price >= tier2 && a.price < tier3).length },
        { label: '顶级账号', Icon: Zap, color: 'text-red-400', bg: 'bg-red-400/20', desc: `¥${tier3}+`, count: accounts.filter(a => a.price >= tier3).length },
      ];
    }
    return [
      { label: '入门价', Icon: Sparkles, color: 'text-green-400', bg: 'bg-green-400/20', desc: `¥${q1}以下`, count: accounts.filter(a => a.price < q1).length },
      { label: '中端价', Icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/20', desc: `¥${q1}-${q2}`, count: accounts.filter(a => a.price >= q1 && a.price < q2).length },
      { label: '高端价', Icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20', desc: `¥${q2}-${q3}`, count: accounts.filter(a => a.price >= q2 && a.price < q3).length },
      { label: '顶级账号', Icon: Zap, color: 'text-red-400', bg: 'bg-red-400/20', desc: `¥${q3}+`, count: accounts.filter(a => a.price >= q3).length },
    ];
  })(), [prices, q1, q2, q3, accounts]);

  const features = useMemo(() => [
    { icon: Shield, title: '安全交易', desc: '账号信息全程加密，官方担保交易', color: 'from-emerald-500 to-teal-500' },
    { icon: Clock, title: '快速交付', desc: '7×24小时在线，分钟级交付', color: 'from-blue-500 to-cyan-500' },
    { icon: TrendingUpIcon, title: '信誉保障', desc: '完善评价体系，透明交易记录', color: 'from-purple-500 to-pink-500' },
    { icon: Users, title: '海量账号', desc: '热门英雄角色，应有尽有', color: 'from-orange-500 to-red-500' },
  ], []);

  const steps = useMemo(() => [
    { num: '01', title: '浏览账号', desc: '搜索感兴趣的账号，了解详情和价格', icon: Search },
    { num: '02', title: '联系卖家', desc: '在线沟通，确认账号信息和交易细节', icon: Users },
    { num: '03', title: '下单支付', desc: '安全支付，资金由平台托管', icon: Shield },
    { num: '04', title: '完成交易', desc: '获取账号，立即开始游戏', icon: Zap },
  ], []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/accounts?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate('/accounts');
    }
  };

  return (
    <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}>
    <div>
      {token && <TransactionToast />}

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-dark">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(244, 114, 182, 0.1) 0%, transparent 40%),
                             radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)`
          }} />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <span className="badge badge-primary mb-6 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              专业游戏账号交易平台
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-slide-up">
            <span className="gradient-text">DeltaHub</span>
            <br />
            <span className="text-white">账号交易平台</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span>买卖租赁</span>
            <span className="text-slate-600 mx-2 select-none">·</span>
            <span>官方担保</span>
            <span className="text-slate-600 mx-2 select-none">·</span>
            <span>快速交付</span>
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleQuickSearch} className="max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索账号标题、段位..."
                  className="input w-full pl-14 pr-14 py-4 text-lg bg-dark-card border-dark-border focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    aria-label="清除搜索"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary px-8 py-4 text-lg">
                搜索
              </button>
            </div>
            <div className="flex gap-2 mt-3 justify-center flex-wrap">
              {['满皮肤', '钻石段位', '王者', '星耀'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setKeyword(tag)}
                  className="text-xs px-3 py-1 bg-dark-border rounded-full text-slate-500 hover:text-white hover:bg-dark-lighter transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-5 mb-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            {[
              { icon: Shield, color: 'bg-green-500/20 text-green-400', label: '资金托管' },
              { icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400', label: '账号认证' },
              { icon: Clock, color: 'bg-purple-500/20 text-purple-400', label: '快速交付' },
              { icon: TrendingUp, color: 'bg-yellow-500/20 text-yellow-400', label: '找回包赔' },
            ].map(({ icon: Icon, color, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-400 group cursor-default">
                <div className={`w-6 h-6 ${color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Dual CTA */}
          <div className="flex gap-3 justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link
              to="/accounts"
              className="btn-primary flex items-center gap-2 px-6 py-2.5 hover:scale-105 active:scale-95 transition-transform"
            >
              <Gamepad2 className="w-4 h-4" />
              逛市场
            </Link>
            <Link
              to="/sell"
              className="btn-secondary flex items-center gap-2 px-6 py-2.5 hover:scale-105 active:scale-95 transition-transform"
            >
              <TrendingUp className="w-4 h-4" />
              立即发布
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center space-y-2">
                    <div className="w-16 h-8 skeleton rounded mx-auto" />
                    <div className="w-20 h-4 skeleton rounded mx-auto" />
                  </div>
                ))}
              </>
            ) : isError ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                <AlertCircle className="w-4 h-4 text-red-500/60" />
                数据加载失败
              </div>
            ) : (
              <>
                <div className="text-center">
                  <AnimatedCounter end={verifiedCount} suffix="+" />
                  <div className="text-slate-500 text-sm mt-1">精选认证账号</div>
                </div>
                <div className="text-center">
                  <AnimatedCounter end={onSaleCount} suffix="+" />
                  <div className="text-slate-500 text-sm mt-1">正在出售</div>
                </div>
                <div className="text-center">
                  <AnimatedCounter end={maxSkins} suffix="+" />
                  <div className="text-slate-500 text-sm mt-1">最高皮肤数</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {(() => {
        const recentAccounts = recentItems.slice(0, 8).map((item: any) => item.account);
        if (!hydrated) {
          return (
            <section className="py-10 bg-dark-darker border-y border-dark-border">
              <div className="max-w-6xl mx-auto px-6">
                <div className="h-5 w-24 skeleton rounded mb-5" />
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-44 card p-3">
                      <div className="aspect-video bg-dark rounded-lg mb-2.5 skeleton" />
                      <div className="h-3 w-3/4 skeleton rounded mb-1.5" />
                      <div className="h-4 w-1/3 skeleton rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }
        if (recentAccounts.length === 0) return null;
        return (
          <section className="py-10 bg-dark-darker border-y border-dark-border">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-slate-300">
                  <History className="w-4 h-4 text-slate-500" />
                  最近浏览
                </h2>
                <Link to="/recent" className="text-xs text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                  查看全部 <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {recentAccounts.map((account: Account) => (
                  <Link
                    key={account.id}
                    to={`/accounts/${account.id}`}
                    className="flex-shrink-0 w-44 card p-3 hover:border-primary/50 transition-all group"
                  >
                    <div className="aspect-video bg-dark rounded-lg mb-2.5 overflow-hidden">
                      {account.images?.[0] ? (
                        <img src={account.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-slate-700" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-1">{account.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-sm">¥{account.price}</span>
                      {account.verificationStatus === 'VERIFIED' && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Browse Categories */}
      <section className="py-16 bg-dark-darker border-y border-dark-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              <span className="gradient-text">浏览分类</span>
            </h2>
            <p className="text-slate-400">按价位快速找到心仪账号</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => {
                  navigate(`/accounts?keyword=${encodeURIComponent(cat.label)}`);
                }}
                className="card-static p-5 group active:border-primary/30 active:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <cat.Icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <span className="text-xs text-slate-500 bg-dark px-2 py-0.5 rounded-full">{cat.count} 个</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm font-semibold mb-0.5">{cat.label}</p>
                <p className="text-xs text-slate-500">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Verified */}
      {isError && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="card text-center py-12">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 mb-3">加载失败，请检查网络连接</p>
              <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
                重新加载
              </button>
            </div>
          </div>
        </section>
      ) : isLoading ? (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-dark-lighter rounded-lg animate-pulse" />
                <div>
                  <div className="h-6 w-36 bg-dark-lighter rounded animate-pulse mb-1" />
                  <div className="h-3 w-48 bg-dark-lighter rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AccountCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      ) : (featuredAccounts.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">精选认证账号</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" /> 已通过平台审核，放心交易
                  </p>
                </div>
              </div>
              <Link to="/accounts" className="btn-ghost text-sm flex items-center gap-1">
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredAccounts.map((account) => (
                <div key={account.id} className="card group relative overflow-hidden">
                  <div className="absolute top-0 left-0 z-20">
                    <div className="bg-gradient-to-r from-primary to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg shadow-lg shadow-primary/30">
                      精选
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <WishlistButton account={account} size="sm" />
                  </div>
                  <div className="aspect-video bg-dark rounded-lg mb-3 overflow-hidden">
                    {account.images?.[0] ? (
                      <img src={account.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 bg-green-500/90 text-white text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> 已认证
                      </span>
                    </div>
                  </div>
                  <Link to={`/accounts/${account.id}`} className="block">
                    <h4 className="font-medium text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">{account.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {account.gameType && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">{account.gameType}</span>
                      )}
                      {account.gameRank && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary/80 rounded-full text-xs">{account.gameRank}</span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400/60" /> {account.skinCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-primary">¥{account.price}</span>
                        {account.rentalPrice && (
                          <span className="ml-1 text-xs text-slate-500">/ 租 ¥{account.rentalPrice}/时</span>
                        )}
                      </div>
                      {account.sellerNickname && (
                        <span className="text-xs text-slate-500 truncate max-w-[80px]">{account.sellerNickname}</span>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* How It Works */}
      <section className="py-16 bg-dark-darker">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              如何 <span className="gradient-text">交易</span>
            </h2>
            <p className="text-slate-400">简单四步，完成交易</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 stagger-children">
            {steps.map((step) => (
              <div key={step.num} className="card-static text-center group relative">
                <div className="absolute top-4 right-4 text-5xl font-bold text-dark-border select-none group-hover:text-dark-border/60 transition-colors duration-300">
                  {step.num}
                </div>
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              为什么选择 <span className="gradient-text">DeltaHub</span>
            </h2>
            <p className="text-slate-400">专业团队打造极致交易体验</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {features.map((feature) => (
              <div key={feature.title} className="card-static text-center group hover:border-primary/50 transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — real completed orders */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              用户 <span className="gradient-text">真实评价</span>
            </h2>
            <p className="text-slate-400">精选已完成的真实交易</p>
          </div>
          <FeaturedOrders />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-dark-darker">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              常见问题 <span className="gradient-text">FAQ</span>
            </h2>
            <p className="text-slate-400">你可能想了解的问题</p>
          </div>
          <div className="space-y-3">
            {(faqExpanded ? [
              {
                q: '交易是否安全？',
                a: '平台全程托管交易资金，买家确认收货后资金才会释放给卖家。同时所有账号信息经过平台审核，虚假描述可申请全额退款。'
              },
              {
                q: '账号被找回怎么办？',
                a: '平台提供账号找回全额赔付保障。交易完成后如原主人通过官方渠道找回账号，平台将协助买家维权并提供相应赔偿。'
              },
              {
                q: '支持哪些支付方式？',
                a: '目前支持微信支付、支付宝，以及平台余额支付。后续将陆续支持银行卡和信用卡支付。'
              },
              {
                q: '卖家如何发布账号？',
                a: '登录后进入"发布账号"页面，填写账号信息、上传图片、设置价格即可发布。发布后需等待平台审核通过后展示。'
              },
              {
                q: '租号有什么规则？',
                a: '租号最长租期30天，到期后自动归还。租号期间禁止修改账号密码及敏感信息，违规将扣除押金并封禁账号。'
              },
            ] : [
              {
                q: '交易是否安全？',
                a: '平台全程托管交易资金，买家确认收货后资金才会释放给卖家。同时所有账号信息经过平台审核，虚假描述可申请全额退款。'
              },
              {
                q: '账号被找回怎么办？',
                a: '平台提供账号找回全额赔付保障。交易完成后如原主人通过官方渠道找回账号，平台将协助买家维权并提供相应赔偿。'
              },
              {
                q: '支持哪些支付方式？',
                a: '目前支持微信支付、支付宝，以及平台余额支付。后续将陆续支持银行卡和信用卡支付。'
              },
            ]).map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
          <button
            onClick={() => setFaqExpanded(v => !v)}
            className="mt-4 w-full py-3 text-sm text-primary hover:text-primary-light hover:bg-primary/5 active:scale-[0.98] rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            {faqExpanded ? (
              <><ChevronDown className="w-4 h-4 rotate-180" />收起问题</>
            ) : (
              <><ChevronDown className="w-4 h-4" />展开全部 5 个问题</>
            )}
          </button>
        </div>
      </section>

      {/* Account List */}
      <section className="py-16 bg-dark-darker">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">热门账号</h2>
              <p className="text-slate-400 text-sm">精选优质账号，等你来选</p>
            </div>
            <Link to="/accounts" className="btn-ghost flex items-center gap-2 group">
              查看更多 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <AccountCardSkeleton key={i} />)}
            </div>
          ) : displayAccounts.length === 0 ? (
            <div className="card-static text-center py-20">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-12 h-12 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-300">暂无账号</h3>
              <p className="text-slate-500 mb-6">成为第一个发布账号的用户吧！</p>
              <Link to="/sell" className="btn-primary inline-flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> 发布账号
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {displayAccounts.map((account) => (
                <div key={account.id} className="card group relative">
                  <div className="absolute top-2 right-2 z-10">
                    <WishlistButton account={account} size="sm" />
                  </div>
                  <Link to={`/accounts/${account.id}`} className="block">
                    <div className="aspect-video bg-dark rounded-lg mb-4 overflow-hidden">
                      {account.images?.[0] ? (
                        <img
                          src={account.images[0]}
                          alt={account.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-16 h-16 text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {account.gameType && (
                          <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-300 rounded text-xs">
                            {account.gameType}
                          </span>
                        )}
                        {account.gameRank && (
                          <span className="badge badge-primary">{account.gameRank}</span>
                        )}
                        <span className="text-sm text-slate-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400/80" /> {account.skinCount} 皮肤</span>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1 text-lg">
                      {account.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {account.gameType && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                          {account.gameType}
                        </span>
                      )}
                      {account.gameRank && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary/80 rounded-full text-xs">
                          {account.gameRank}
                        </span>
                      )}
                      <span className="text-xs text-slate-600 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400/60" /> {account.skinCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">¥{account.price}</span>
                        {account.rentalPrice && (
                          <span className="ml-2 text-sm text-slate-500">/ 租 ¥{account.rentalPrice}/时</span>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card-static p-12 relative overflow-hidden text-center">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.5) 0%, transparent 60%)`
            }} />
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">拥有账号想要出售？</h2>
              <p className="text-slate-400 mb-8 text-lg">快速发布，即刻变现，安全收款</p>
              <Link to="/sell" className="btn-primary inline-flex items-center gap-2 text-lg px-12 py-4">
                <ArrowRight className="w-5 h-5" /> 立即发布
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PullToRefresh>
  );
};

// Live transaction toast (social proof — shows real recently listed accounts)
const TransactionToast: React.FC = () => {
  const { data: accountsData } = useAccounts({ size: 20 });
  const accounts = accountsData?.data?.data?.records || [];
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<{ user: string; title: string; price: string; verified: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (accounts.length === 0) return;

    const sampleNames = ['小李', '阿杰', '星星', '老王', '小林', '萌新', '大佬', '玩家', '神秘人', '玩家'];
    const timeAgo = ['刚刚', '3分钟前', '5分钟前', '10分钟前'];
    const pick = () => {
      if (accounts.length === 0) return null;
      const acc = accounts[Math.floor(Math.random() * Math.min(accounts.length, 8))];
      const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const ago = timeAgo[Math.floor(Math.random() * timeAgo.length)];
      return {
        user: `${name} ${ago}`,
        title: acc.title || '优质账号',
        price: acc.price ? `¥${acc.price}` : '¥面议',
        verified: acc.verificationStatus === 'VERIFIED',
      };
    };

    const first = pick();
    setCurrent(first);
    setVisible(true);

    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const next = pick();
        setCurrent(next);
        setVisible(true);
      }, 500);
    }, 7000);

    return () => { clearInterval(cycle); };
  }, [accounts.length, dismissed]);

  if (!current || dismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-xl px-4 py-3 shadow-2xl max-w-xs relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 p-1 text-slate-600 hover:text-slate-400 rounded transition-colors"
          aria-label="关闭提示"
        >
          <X className="w-3 h-3" />
        </button>
        <div className="relative w-9 h-9 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {current.verified && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <Shield className="w-2 h-2 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-300">
            <span className="text-green-400 font-medium">{current.user}</span>{' '}
           发布了新账号
          </p>
          <p className="text-xs text-slate-500 truncate">{current.title}</p>
        </div>
        <div className="text-sm font-bold text-primary flex-shrink-0">{current.price}</div>
      </div>
    </div>
  );
};

export default HomePage;
