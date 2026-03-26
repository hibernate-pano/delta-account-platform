import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  ChevronDown, Shield, CreditCard, Clock, Lock, CheckCircle,
  MessageCircle, ArrowLeft, Gamepad2, AlertTriangle, HelpCircle, RefreshCw
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
  category: string;
}

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

  const filteredFAQ = activeCategory === '全部'
    ? faqData
    : faqData.filter((f) => f.category === activeCategory);

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

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveCategory('全部')}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            activeCategory === '全部'
              ? 'bg-primary text-white'
              : 'bg-dark-lighter text-slate-400 hover:text-white border border-dark-border'
          }`}
        >
          全部 ({faqData.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              activeCategory === cat
                ? 'bg-primary text-white'
                : 'bg-dark-lighter text-slate-400 hover:text-white border border-dark-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
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
                className="w-full flex items-center gap-3 py-4 px-4 text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-primary/20' : 'bg-dark-lighter'}`}>
                  <Icon className={`w-4 h-4 ${isOpen ? 'text-primary' : 'text-slate-500'}`} />
                </div>
                <span className={`flex-1 text-sm font-medium ${isOpen ? 'text-primary' : 'text-slate-300'}`}>
                  {faq.question}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="h-px bg-dark-border mb-4" />
                  <p className="text-sm text-slate-400 leading-relaxed pl-2 border-l-2 border-primary/30">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help */}
      <div className="mt-10 card text-center py-10">
        <div className="w-14 h-14 bg-dark-lighter rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7 text-slate-600" />
        </div>
        <h3 className="text-lg font-bold mb-2">没有找到答案？</h3>
        <p className="text-slate-500 text-sm mb-5">我们的客服团队随时为您解答疑问</p>
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
