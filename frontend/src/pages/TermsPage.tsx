import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

const TermsPage: React.FC = () => {
  usePageTitle('服务条款');

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">服务条款</h1>
      <div className="card space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. 服务说明</h2>
          <p>DeltaHub（以下简称"本平台"）是一个游戏账号交易中介平台，为买卖双方提供信息发布、交易撮合和资金托管服务。本平台不直接参与账号的所有权转让，仅提供技术和信息服务支持。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. 用户注册</h2>
          <p>用户必须年满18周岁方可注册使用本平台。注册时需提供真实有效的个人信息。每位用户仅可注册一个账号，不得转让或借用他人账号。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. 交易规则</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>卖家发布的账号信息必须真实准确，不得虚假宣传</li>
            <li>所有账号需经过平台审核后方可上架出售</li>
            <li>买家购买前应仔细核实账号信息</li>
            <li>交易完成后，买家应及时修改账号密码和绑定信息</li>
            <li>租赁交易需在约定时间内归还，逾期将扣除押金</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. 禁止行为</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>发布虚假账号信息或进行欺诈交易</li>
            <li>利用平台进行洗钱或其他非法活动</li>
            <li>恶意攻击平台系统或干扰其他用户使用</li>
            <li>交易通过外挂或作弊获得的游戏账号</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. 免责声明</h2>
          <p>本平台不对游戏运营商的封号行为承担责任。因不可抗力导致的服务中断，本平台不承担赔偿责任。本平台有权随时修改本服务条款，修改后的条款一经公布即生效。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. 争议解决</h2>
          <p>交易过程中如发生争议，双方应首先通过平台客服协商解决。协商不成的，可依法向有管辖权的人民法院提起诉讼。</p>
        </section>

        <div className="pt-4 border-t border-gray-800 text-sm text-gray-500">
          <p>最后更新：2026年3月</p>
          <Link to="/register" className="text-primary hover:underline mt-2 inline-block">返回注册</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
