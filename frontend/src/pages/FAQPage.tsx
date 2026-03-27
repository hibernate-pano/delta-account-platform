import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  ChevronDown, Shield, CreditCard, Clock, Lock, CheckCircle,
  MessageCircle, ArrowLeft, Gamepad2, AlertTriangle, HelpCircle, RefreshCw, Search, X, ThumbsUp, ThumbsDown
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
  category: string;
  helpfulCount?: number; // mock helpful votes
  totalVotes?: number;   // mock total votes
}

// Mock helpfulness stats (would come from backend in production)
const faqStats: Record<number, { helpful: number; total: number }> = {
  0: { helpful: 128, total: 142 },
  1: { helpful: 96, total: 110 },
  2: { helpful: 215, total: 230 },
  3: { helpful: 87, total: 105 },
  4: { helpful: 63, total: 80 },
  5: { helpful: 54, total: 68 },
  6: { helpful: 42, total: 55 },
  7: { helpful: 38, total: 52 },
  8: { helpful: 71, total: 85 },
  9: { helpful: 29, total: 41 },
};

const faqData: FAQItem[] = [
  // Account Safety
  {
    category: '账号安全',
    icon: Shield,
    question: '交易后账号会被找回吗？',
    answer: 'DeltaHub 采用账号过户+绑定换绑双重机制。交易完成后，原绑定信息将被强制解除，新买家绑定手机/邮箱，全程平台监督。如遇账号被找回，提供证据可申请平台介入，启用资金保障。',
  },
  {
    category: '账号安全',
    icon: Lock,
    question: '我的账号信息会被泄露吗？',
    answer: '不会。您的账号信息采用银行级加密存储，仅用于交易撮合。买卖双方在完成交易前无法查看对方敏感信息（手机号、身份证等）。平台承诺不对外提供、售卖或泄露任何用户信息。',
  },
  // Transaction
  {
    category: '交易流程',
    icon: CreditCard,
    question: '付款后多久能拿到账号？',
    answer: '购买账号：支付成功后，账号信息（账号密码、绑定手机等）将在 5-30 分钟内通过站内消息发送给您，请注意查收。租赁账号：支付后自动开通访问权限，可即时登录使用。',
  },
  {
    category: '交易流程',
    icon: Clock,
    question: '支持哪些支付方式？',
    answer: '目前支持支付宝、微信支付、银行卡转账等多种支付方式。所有交易通过平台资金托管，满意后再确认收货，资金才打给卖家，全面保障双方权益。',
  },
  {
    category: '交易流程',
    icon: CheckCircle,
    question: '购买后发现账号与描述不符怎么办？',
    answer: '请在收到账号后 24 小时内登录验证。如发现描述不符（段位不对、皮肤数量不足、绑定信息有问题等），可申请退款或换号。请保留截图证据并在「退款记录」中提交申诉，平台客服将在 4 小时内处理。',
  },
  // Rental
  {
    category: '租赁服务',
    icon: Gamepad2,
    question: '租号可以提前归还吗？',
    answer: '可以。租赁期间您可随时提前归还，系统会自动按实际使用时长结算费用，剩余金额退回您的钱包。归还后账号将自动回收，请确保已保存您需要的数据。',
  },
  {
    category: '租赁服务',
    icon: AlertTriangle,
    question: '租号期间账号被封禁怎么办？',
    answer: '若因卖家账号原有违规记录导致封禁（非您本人行为），提供证据后可申请全额退款。平台对卖家的账号质量有审核要求，问题账号不允许上架。如因您自身使用行为导致封禁，不在保障范围内。',
  },
  // Refund
  {
    category: '退款售后',
    icon: RefreshCw,
    question: '什么情况下可以申请退款？',
    answer: '以下情况可申请退款：账号无法登录（密码错误）、账号描述严重不符、卖家超时未交付（超过 2 小时）、租赁期间非您原因导致服务中断。退款申请审核通过后，资金将在 1-3 个工作日内退回原支付渠道。',
  },
  {
    category: '退款售后',
    icon: MessageCircle,
    question: '申诉被拒绝后还能继续申诉吗？',
    answer: '可以。如果对平台初次处理结果不满意，可在结果送达后 7 天内提交二次申诉，并补充新的证据材料。二次申诉将由平台高级客服团队处理。如仍有异议，可联系平台客服邮箱进一步沟通。',
  },
  // Account Listing
  {
    category: '账号发布',
    icon: CheckCircle,
    question: '发布账号需要审核吗？',
    answer: '是的，所有发布的账号都需要经过平台审核。审核内容包含：账号信息真实性、段位/皮肤描述是否准确、价格是否合理等。审核通常在 1-2 小时内完成，节假日略有延迟。审核通过后账号自动上架。',
  },
  {
    category: '账号发布',
    icon: Lock,
    question: '发布账号需要准备什么材料？',
    answer: '发布时需要提供：1) 账号基本信息（段位、皮肤数量、武器装备等）；2) 清晰的游戏截图；3) 当前绑定手机号（用于过户验证）。平台不会要求您提供身份证、银行卡密码等敏感信息。',
  },
];

const categories = [...new Set(faqData.map((f) => f.category))];

const FAQPage: React.FC = () => {
  usePageTitle('帮助中心');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [votedFAQ, setVotedFAQ] = useState<Record<number, 'up' | 'down'>>({});

  const filteredFAQ = faqData.filter((f) => {
    const matchesCategory = activeCategory === '全部' || f.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">帮助中心</h1>
            <p className="text-slate-500 text-sm">常见问题解答 · 交易指南</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索问题..."
          className="w-full pl-11 pr-10 py-3 bg-dark-lighter border border-dark-border rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveCategory('全部')}
          className={`px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 active:scale-95 ${
            activeCategory === '全部'
              ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/30'
              : 'bg-dark-lighter text-slate-400 hover:text-white border border-dark-border hover:border-slate-600'
          }`}
        >
          全部 ({searchQuery ? filteredFAQ.length : faqData.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 active:scale-95 ${
              activeCategory === cat
                ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                : 'bg-dark-lighter text-slate-400 hover:text-white border border-dark-border hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFAQ.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">未找到「{searchQuery}」相关问题</p>
            <button onClick={() => setSearchQuery('')} className="text-xs text-primary hover:underline">
              清除搜索
            </button>
          </div>
        )}
        {filteredFAQ.map((faq, idx) => {
          const Icon = faq.icon;
          const isOpen = openQuestion === idx;
          return (
            <div
              key={idx}
              className={`card transition-all ${isOpen ? 'border-primary/30' : 'hover:border-slate-700'}`}
            >
              <button
                onClick={() => setOpenQuestion(isOpen ? null : idx)}
                className="w-full flex items-center gap-3 py-4 px-4 text-left hover:bg-dark-lighter/30 transition-colors rounded-xl"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover/section:scale-110 ${isOpen ? 'bg-primary/20' : 'bg-dark-lighter group-hover/section:bg-slate-700/30'}`}>
                  <Icon className={`w-4 h-4 transition-colors ${isOpen ? 'text-primary' : 'text-slate-500'}`} />
                </div>
                <span className={`flex-1 text-sm font-medium ${isOpen ? 'text-primary' : 'text-slate-300'}`}>
                  {faq.question}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="h-px bg-dark-border mb-4" />
                  <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg px-4 py-3 border-l-2 border-primary/40">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                  {votedFAQ[idx] ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      {votedFAQ[idx] === 'up' ? (
                        <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>感谢您的反馈！</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {(() => {
                        const originalIdx = faqData.indexOf(faq);
                        const stats = faqStats[originalIdx];
                        const ratio = stats ? Math.round((stats.helpful / stats.total) * 100) : 88;
                        const total = stats?.total || 80;
                        return (
                          <>
                            <span className="text-xs text-slate-600">有帮助吗？</span>
                            {/* Helpful ratio indicator */}
                            <div className="flex items-center gap-1.5 ml-auto mr-1">
                              <div className="w-16 h-1.5 bg-dark rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400/70 rounded-full transition-all"
                                  style={{ width: `${ratio}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-green-400/80">{ratio}% 觉得有用</span>
                              <span className="text-[10px] text-slate-600">({total}人)</span>
                            </div>
                            <button
                              onClick={() => setVotedFAQ(v => ({ ...v, [idx]: 'up' }))}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-dark hover:bg-green-500/20 hover:text-green-400 border border-dark-border hover:border-green-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                              <ThumbsUp className="w-3 h-3" /> 有帮助
                            </button>
                            <button
                              onClick={() => setVotedFAQ(v => ({ ...v, [idx]: 'down' }))}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-dark hover:bg-red-500/20 hover:text-red-400 border border-dark-border hover:border-red-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                              <ThumbsDown className="w-3 h-3" /> 没帮助
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help */}
      <div className="mt-10 card bg-gradient-to-br from-primary/8 to-purple-500/5 border-primary/20 text-center py-10">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
          <div className="relative w-full h-full bg-dark-lighter rounded-2xl flex items-center justify-center animate-float border border-primary/20">
            <MessageCircle className="w-8 h-8 text-primary/80" />
          </div>
        </div>
        <h3 className="text-lg font-bold mb-2 text-white">没有找到答案？</h3>
        <p className="text-slate-400 text-sm mb-5">我们的客服团队随时为您解答疑问</p>
        <div className="flex justify-center gap-3">
          <Link to="/notifications" className="btn-secondary text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            站内消息
          </Link>
          <Link to="/accounts" className="btn-primary text-sm flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            浏览账号
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
