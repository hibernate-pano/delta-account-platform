import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, User, BookOpen, Ban, Scale, Info,
  Lock, FileText, Database, Cookie, Users, Eye, ChevronRight
} from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

interface TocItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface StaticPageLayoutProps {
  title: string;
  lastUpdated?: string;
  backTo?: string;
  toc: TocItem[];
  children: React.ReactNode;
}

const iconMap: Record<string, React.ElementType> = {
  Shield, User, BookOpen, Ban, Scale, Info,
  Lock, FileText, Database, Cookie, Users, Eye,
};

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({
  title,
  lastUpdated,
  backTo = '/',
  toc,
  children,
}) => {
  usePageTitle(title);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showToc, setShowToc] = useState(false);

  // Intersection observer for active section tracking
  useEffect(() => {
    const sections = toc.map((t) => document.getElementById(t.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, [toc]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
      setShowToc(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={backTo}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm mb-5 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {lastUpdated && (
              <p className="text-slate-500 text-xs mt-0.5">最后更新：{lastUpdated}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile TOC toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowToc(!showToc)}
          className="w-full flex items-center justify-between px-4 py-3 card text-sm text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            目录
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showToc ? 'rotate-90' : ''}`} />
        </button>
        {showToc && (
          <div className="mt-2 card p-2 space-y-1 animate-fade-in">
            {toc.map((item) => {
              const Icon = iconMap[item.icon.name] || BookOpen;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                    activeSection === item.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-slate-400 hover:text-white hover:bg-dark-lighter'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar TOC */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                目录
              </div>
              <nav className="space-y-0.5">
                {toc.map((item) => {
                  const Icon = iconMap[item.icon.name] || BookOpen;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-all ${
                        activeSection === item.id
                          ? 'bg-primary/20 text-primary border-l-2 border-primary'
                          : 'text-slate-500 hover:text-white hover:bg-dark-lighter hover:translate-x-1'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};
