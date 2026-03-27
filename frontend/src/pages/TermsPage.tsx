import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, User, BookOpen, Ban, Scale, Info,
  CheckCircle2, AlertTriangle, FileText, Scale as ScaleIcon, Gavel
} from 'lucide-react';
import { StaticPageLayout } from '../components/ui/StaticPageLayout';

const toc = [
  { id: 's1', label: '服务说明', icon: BookOpen },
  { id: 's2', label: '用户注册', icon: User },
  { id: 's3', label: '交易规则', icon: CheckCircle2 },
  { id: 's4', label: '禁止行为', icon: Ban },
  { id: 's5', label: '免责声明', icon: AlertTriangle },
  { id: 's6', label: '争议解决', icon: ScaleIcon },
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

const TermsPage: React.FC = () => {
  return (
    <StaticPageLayout title="服务条款" lastUpdated="2026年3月" backTo="/" toc={toc}>
      <div className="card">
        <SectionWrapper id="s1" icon={BookOpen} title="1. 服务说明">
          <p>
            DeltaHub（以下简称"本平台"）是一个游戏账号交易中介平台，为买卖双方提供信息发布、交易撮合和资金托管服务。本平台不直接参与账号的所有权转让，仅提供技术和信息服务支持。
          </p>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s2" icon={User} title="2. 用户注册">
          <p>用户必须年满18周岁方可注册使用本平台。注册时需提供真实有效的个人信息。每位用户仅可注册一个账号，不得转让或借用他人账号。</p>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s3" icon={CheckCircle2} title="3. 交易规则">
          <ul className="space-y-2.5 pl-2">
            {[
              '卖家发布的账号信息必须真实准确，不得虚假宣传',
              '所有账号需经过平台审核后方可上架出售',
              '买家购买前应仔细核实账号信息',
              '交易完成后，买家应及时修改账号密码和绑定信息',
              '租赁交易需在约定时间内归还，逾期将扣除押金',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s4" icon={Ban} title="4. 禁止行为">
          <ul className="space-y-2.5 pl-2">
            {[
              '发布虚假账号信息或进行欺诈交易',
              '利用平台进行洗钱或其他非法活动',
              '恶意攻击平台系统或干扰其他用户使用',
              '交易通过外挂或作弊获得的游戏账号',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400/70 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s5" icon={AlertTriangle} title="5. 免责声明">
          <p>本平台不对游戏运营商的封号行为承担责任。因不可抗力导致的服务中断，本平台不承担赔偿责任。本平台有权随时修改本服务条款，修改后的条款一经公布即生效。</p>
        </SectionWrapper>

        <div className="h-px bg-dark-border my-2" />

        <SectionWrapper id="s6" icon={ScaleIcon} title="6. 争议解决">
          <p>交易过程中如发生争议，双方应首先通过平台客服协商解决。协商不成的，可依法向有管辖权的人民法院提起诉讼。</p>
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

export default TermsPage;
