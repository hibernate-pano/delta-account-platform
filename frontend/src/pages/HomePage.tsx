import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi } from '../api';
import { Account } from '../types';
import { Search, Shield, Clock, TrendingUp, ArrowRight, Gamepad2, Users, Lock } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/ui/Toast';

const HomePage: React.FC = () => {
  usePageTitle();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAccounts, setTotalAccounts] = useState(0);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountApi.getList({ size: 6 });
        setAccounts(res.data.data.records || []);
        setTotalAccounts(res.data.data.total || 0);
      } catch (error: any) {
        toast('error', error.response?.data?.message || '加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const features = [
    {
      icon: Shield,
      title: '安全交易',
      desc: '账号信息全程加密，官方担保交易',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Clock,
      title: '快速交付',
      desc: '7×24小时在线，分钟级交付',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: '信誉保障',
      desc: '完善评价体系，透明交易记录',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: '海量账号',
      desc: '热门英雄角色，应有尽有',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-dark">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(244, 114, 182, 0.1) 0%, transparent 40%),
                             radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)`
          }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <span className="badge badge-primary mb-6">
              <Lock className="w-3 h-3 mr-1" />
              安全可靠的账号交易平台
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-slide-up">
            <span className="gradient-text">三角洲行动</span>
            <br />
            <span className="text-white">账号交易平台</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
            买卖租赁 · 官方担保 · 快速交付
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '0.4s'}}>
            <Link to="/accounts" className="btn-primary text-lg px-10 py-4">
              <Search className="w-5 h-5 inline-block mr-2" />
              浏览账号
            </Link>
            <Link to="/register" className="btn-secondary text-lg px-10 py-4">
              立即注册
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in" style={{animationDelay: '0.6s'}}>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{totalAccounts}</div>
              <div className="text-slate-500 text-sm">在售账号</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-slate-500 text-sm">全天在线</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-slate-500 text-sm">官方担保</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-dark-darker">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              为什么选择 <span className="gradient-text">DeltaHub</span>
            </h2>
            <p className="text-slate-400 text-lg">专业团队打造极致交易体验</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {features.map((feature, idx) => (
              <div key={idx} className="card-static text-center group">
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

      {/* Account List */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">热门账号</h2>
              <p className="text-slate-400">精选优质账号，等你来选</p>
            </div>
            <Link to="/accounts" className="btn-ghost flex items-center gap-2">
              查看更多 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">加载中...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="card-static text-center py-20">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-300">暂无账号</h3>
              <p className="text-slate-500 mb-6">成为第一个发布账号的用户吧！</p>
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
                  <div className="aspect-video bg-slate-800 rounded-xl mb-4 overflow-hidden relative">
                    {account.images && account.images.length > 0 ? (
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
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {account.gameRank && (
                        <span className="badge badge-primary">{account.gameRank}</span>
                      )}
                      <span className="text-sm text-slate-300">{account.skinCount} 皮肤</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-1 text-lg">
                    {account.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        ¥{account.price}
                      </span>
                      {account.rentalPrice && (
                        <span className="ml-2 text-sm text-slate-500">
                          / 租 ¥{account.rentalPrice}/时
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-dark-darker">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="card-static p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.5) 0%, transparent 60%)`
            }} />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">拥有账号想要出售？</h2>
              <p className="text-slate-400 mb-8 text-lg">快速发布，即刻变现，安全收款</p>
              <Link to="/sell" className="btn-primary inline-flex items-center gap-2 text-lg px-12 py-4">
                <ArrowRight className="w-5 h-5" />
                立即发布
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
