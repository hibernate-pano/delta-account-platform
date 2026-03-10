import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

const PrivacyPage: React.FC = () => {
  usePageTitle('隐私政策');

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
      <div className="card space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. 信息收集</h2>
          <p>我们收集以下类型的信息：</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>注册信息：用户名、邮箱、手机号等</li>
            <li>交易信息：订单记录、支付信息、交易金额</li>
            <li>设备信息：浏览器类型、IP地址、访问时间</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. 信息使用</h2>
          <p>我们使用收集的信息用于：</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>提供和改善平台服务</li>
            <li>处理交易和资金结算</li>
            <li>发送交易通知和服务公告</li>
            <li>防范欺诈和保障交易安全</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. 信息保护</h2>
          <p>我们采取业界标准的安全措施保护您的个人信息，包括数据加密传输、敏感信息脱敏存储、访问权限控制等。您的密码经过不可逆加密存储，即使数据库泄露也无法直接获取。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. 信息共享</h2>
          <p>我们不会向第三方出售您的个人信息。仅在以下情况下可能共享：</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>获得您的明确同意</li>
            <li>法律法规要求或政府机关依法要求</li>
            <li>完成交易所必需的信息（如向交易对方展示用户名）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. 您的权利</h2>
          <p>您有权随时查看、更正或删除您的个人信息。如需注销账号，请联系平台客服。账号注销后，我们将在合理期限内删除您的个人信息。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Cookie 使用</h2>
          <p>本平台使用 Cookie 和类似技术来保持您的登录状态、记住偏好设置。您可以通过浏览器设置禁用 Cookie，但可能影响部分功能的使用。</p>
        </section>

        <div className="pt-4 border-t border-gray-800 text-sm text-gray-500">
          <p>最后更新：2026年3月</p>
          <Link to="/register" className="text-primary hover:underline mt-2 inline-block">返回注册</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
