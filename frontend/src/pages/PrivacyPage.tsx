import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Database, Zap, Shield, Users, User, Cookie,
  CheckCircle2, Lock, FileText
} from 'lucide-react';
import { StaticPageLayout } from '../components/ui/StaticPageLayout';

const toc = [
  { id: 's1', label: '信息收集', icon: Database },
  { id: 's2', label: '信息使用', icon: Zap },
  { id: 's3', label: '信息保护', icon: Shield },
  { id: 's4', label: '信息共享', icon: Users },
  { id: 's5', label: '您的权利', icon: User },
  { id: 's6', label: 'Cookie 使用', icon: Cookie },
];

const SectionWrapper: React.FC<{
  id: string; icon: React.ElementType; title: string; children: React.ReactNode;
}> = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-28">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
    <div className="text-sm text-slate-400 leading-relaxed pl-0.5 space-y-3">
      {children}
    </div>
  </section>
);

const PrivacyPage: React.FC = () => {
  return (
    <StaticPageLayout title="隐私政策" lastUpdated="2026年3月" backTo="/" toc={toc}>
      <div className="card">
        <SectionWrapper id="s1" icon={Database} title="1. 信息收集">
          <p>我们收集以下类型的信息：</p>
          <ul className="space-y-2.5 pl-2">
            {[
              ['注册信息', '用户名、邮箱、手机号等'],
              ['交易信息', '订单记录、支付信息、交易金额'],
              ['设备信息', '浏览器类型、IP地址、访问时间'],
            ].map(([label, desc]) => (
              <li key={label} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                <span><strong className="text-slate-300">{label}：</strong>{desc}</span>
              </li>
            ))}
          </ul>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s2" icon={Zap} title="2. 信息使用">
          <p>我们使用收集的信息用于：</p>
          <ul className="space-y-2.5 pl-2">
            {[
              '提供和改善平台服务',
              '处理交易和资金结算',
              '发送交易通知和服务公告',
              '防范欺诈和保障交易安全',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s3" icon={Shield} title="3. 信息保护">
          <p>我们采取业界标准的安全措施保护您的个人信息，包括：</p>
          <ul className="space-y-2.5 pl-2 mt-2">
            {[
              '数据加密传输（HTTPS）',
              '敏感信息脱敏存储',
              '严格的访问权限控制',
              '密码不可逆加密存储',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-primary/70 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 bg-dark-lighter rounded-lg px-3 py-2 text-slate-500 text-xs border-l-2 border-primary/40">
            即使数据库泄露，攻击者也无法直接获取您的密码等敏感信息。
          </p>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s4" icon={Users} title="4. 信息共享">
          <p>我们<strong className="text-slate-300">不会</strong>向第三方出售您的个人信息。仅在以下情况下可能共享：</p>
          <ul className="space-y-2.5 pl-2 mt-2">
            {[
              '获得您的明确同意',
              '法律法规要求或政府机关依法要求',
              '完成交易所必需的信息（如向交易对方展示用户名）',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400/70 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s5" icon={User} title="5. 您的权利">
          <p>您有权随时查看、更正或删除您的个人信息。如需注销账号，请联系平台客服。账号注销后，我们将在合理期限内删除您的个人信息。</p>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s6" icon={Cookie} title="6. Cookie 使用">
          <p>本平台使用 Cookie 和类似技术来保持您的登录状态、记住偏好设置。您可以通过浏览器设置禁用 Cookie，但可能影响部分功能的使用。</p>
        </SectionWrapper>

        {/* Footer */}
        <div className="pt-5 mt-6 border-t border-dark-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <FileText className="w-3.5 h-3.5" />
              <span>最后更新：2026年3月</span>
            </div>
            <Link
              to="/register"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              返回注册
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  );
};

export default PrivacyPage;
