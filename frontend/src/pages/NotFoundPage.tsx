import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const NotFoundPage: React.FC = () => {
  usePageTitle('页面未找到');
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3 text-white">页面未找到</h1>
        <p className="text-slate-400 mb-8">
          你访问的页面不存在或已被移除，请检查链接是否正确。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            返回首页
          </Link>
          <Link to="/accounts" className="btn-secondary flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            浏览账号
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
