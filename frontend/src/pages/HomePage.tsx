import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Search, Shield, Clock, TrendingUp, ArrowRight, Gamepad2, Users, Lock, Zap, ChevronRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountApi.getList({ size: 6 });
        setAccounts(res.data.data.records || []);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const features = [
    {
      icon: Shield,
      title: '资金托管',
      desc: '全程保障交易安全，资金托管让您无忧',
      color: 'from-neon-green to-emerald-500',
      glow: 'shadow-[0_0_30px_rgba(0,255,136,0.3)]'
    },
    {
      icon: Zap,
      title: '秒级交付',
      desc: '自动化交付系统，分钟级到账',
      color: 'from-neon-cyan to-blue-500',
      glow: 'shadow-[0_0_30px_rgba(0,217,255,0.3)]'
    },
    {
      icon: TrendingUp,
      title: '信誉体系',
      desc: '完善信用评价系统，交易透明可查',
      color: 'from-neon-pink to-purple-500',
      glow: 'shadow-[0_0_30px_rgba(255,16,240,0.3)]'
    },
    {
      icon: Users,
      title: '海量账号',
      desc: '热门英雄角色，种类齐全任选',
      color: 'from-neon-yellow to-orange-500',
      glow: 'shadow-[0_0_30px_rgba(255,230,0,0.3)]'
    }
  ];

  const games = [
    { name: '三角洲行动', count: '2,847', color: 'neon-pink' },
    { name: '王者荣耀', count: '1,523', color: 'neon-cyan' },
    { name: '和平精英', count: '986', color: 'neon-green' },
    { name: '英雄联盟', count: '654', color: 'neon-yellow' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Synthwave Style */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Neon grid background */}
        <div className="absolute inset-0 bg-bg-dark">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(45, 27, 78, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(45, 27, 78, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
          {/* Radial glow effects */}
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 50%, rgba(189, 0, 255, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 20% 30%, rgba(255, 16, 240, 0.1) 0%, transparent 40%),
              radial-gradient(ellipse 60% 40% at 80% 70%, rgba(0, 217, 255, 0.1) 0%, transparent 40%)
            `
          }} />
          {/* Scanline effect */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.1) 2px,
              rgba(255,255,255,0.1) 4px
            )`
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-full text-neon-pink font-display text-sm font-semibold tracking-wider">
              <Lock className="w-4 h-4" />
              安全可靠的账号交易平台
            </span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-display font-black mb-8 animate-slide-up">
            <span className="text-white">三角洲</span>
            <span className="gradient-text">行动</span>
            <br />
            <span className="text-text-primary">账号交易平台</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto animate-fade-in font-body" style={{animationDelay: '0.2s'}}>
            <span className="text-neon-cyan">买卖租赁</span> · <span className="text-neon-pink">官方担保</span> · <span className="text-neon-green">快速交付</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '0.4s'}}>
            <Link to="/accounts" className="btn-primary text-lg px-10 py-4 flex items-center justify-center gap-2 group">
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              浏览账号
            </Link>
            <Link to="/register" className="btn-secondary text-lg px-10 py-4 flex items-center justify-center gap-2 group">
              立即注册
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats with neon styling */}
          <div className="flex flex-wrap justify-center gap-12 mt-20 animate-fade-in" style={{animationDelay: '0.6s'}}>
            {[
              { value: '10,000+', label: '注册用户', color: 'text-neon-pink' },
              { value: '5,000+', label: '交易账号', color: 'text-neon-cyan' },
              { value: '99.5%', label: '满意度', color: 'text-neon-green' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className={`text-4xl font-display font-bold ${stat.color} drop-shadow-[0_020px_currentColor]`}>
                  {stat.value}
                </div>
                <div className="text-text-muted text-sm mt-1 font-body">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-neon-pink/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-neon-cyan/20 rounded-full blur-[100px]" />
      </section>

      {/* Hot Games Section */}
      <section className="py-20 bg-bg-surface/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              热门<span className="gradient-text">游戏</span>
            </h2>
            <p className="text-text-muted">选择你喜欢的游戏，开始交易</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {games.map((game, idx) => (
              <div 
                key={idx}
                className="card group cursor-pointer hover:scale-[1.02] transition-all"
                style={{
                  '--tw-shadow-color': `var(--neon-${game.color.replace('neon-', '')})`
                } as React.CSSProperties}
              >
                <div className={`text-3xl font-display font-bold mb-2 text-${game.color} group-hover:scale-110 transition-transform`}>
                  {game.name}
                </div>
                <div className="text-text-muted text-sm font-body">
                  {game.count} 账号
                </div>
                <ChevronRight className={`w-5 h-5 text-${game.color} mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              为什么选择 <span className="gradient-text">DeltaHub</span>
            </h2>
            <p className="text-text-muted text-lg font-body">专业团队打造极致交易体验</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className={`card-static text-center group hover:scale-105 transition-all ${feature.glow}`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 text-text-primary">{feature.title}</h3>
                <p className="text-text-muted text-sm font-body">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account List */}
      <section className="py-24 bg-bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2 text-text-primary">热门账号</h2>
              <p className="text-text-muted font-body">精选优质账号，等你来选</p>
            </div>
            <Link to="/accounts" className="btn-ghost flex items-center gap-2 text-text-secondary hover:text-neon-pink">
              查看更多 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-muted">加载中...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="card-static text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-12 h-12 text-text-muted" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-text-primary">暂无账号</h3>
              <p className="text-text-muted mb-8 font-body">成为第一个发布账号的用户吧！</p>
              <Link to="/sell" className="btn-primary inline-flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                发布账号
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {accounts.map((account) => (
                <Link
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  className="card group"
                >
                  <div className="aspect-video bg-bg-lighter rounded-xl mb-4 overflow-hidden relative">
                    {account.images && account.images.length > 0 ? (
                      <img
                        src={account.images[0]}
                        alt={account.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-16 h-16 text-text-muted" />
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                    {/* Game type badge */}
                    {account.gameType && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-neon-cyan/20 border border-neon-cyan/40 rounded text-neon-cyan text-xs font-display font-semibold">
                          {account.gameType}
                        </span>
                      </div>
                    )}
                    {/* Hover reveal */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {account.gameRank && (
                        <span className="px-2 py-1 bg-neon-pink/20 border border-neon-pink/40 rounded text-neon-pink text-xs font-display font-semibold">
                          {account.gameRank}
                        </span>
                      )}
                      <span className="text-sm text-text-secondary">{account.skinCount} 皮肤</span>
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold mb-3 group-hover:text-neon-pink transition-colors line-clamp-1 text-lg text-text-primary">
                    {account.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-display font-bold text-neon-pink drop-shadow-[0_0_10px_rgba(255,16,240,0.5)]">
                        ¥{account.price}
                      </span>
                      {account.rentalPrice && (
                        <span className="ml-2 text-sm text-text-muted">
                          / 租 ¥{account.rentalPrice}/时
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card-static p-12 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0" style={{
              background: `
                radial-gradient(ellipse 100% 100% at 50% 50%, rgba(189, 0, 255, 0.2) 0%, transparent 60%),
                linear-gradient(135deg, rgba(255, 16, 240, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)
              `
            }} />
            {/* Border glow effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-neon-pink/30" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-text-primary">
                拥有账号想要<span className="gradient-text">出售</span>？
              </h2>
              <p className="text-text-secondary mb-10 text-lg font-body max-w-lg mx-auto">
                快速发布，即刻变现，安全收款 · 0手续费
              </p>
              <Link to="/sell" className="btn-primary inline-flex items-center gap-2 text-lg px-12 py-4 group">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                立即发布
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-bg-lighter">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/50 to-neon-cyan/50 rounded-xl blur-lg opacity-50" />
              </div>
              <span className="font-display font-bold text-xl text-text-primary">
                Delta<span className="gradient-text">Hub</span>
              </span>
            </div>
            <p className="text-text-muted text-sm font-body">© 2026 DeltaHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;