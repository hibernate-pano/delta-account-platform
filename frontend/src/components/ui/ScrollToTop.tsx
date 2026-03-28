import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="回到顶部"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-11 h-11 bg-dark-card border border-dark-border rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:bg-dark-lighter hover:border-primary/50 transition-all hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
    >
      <ArrowUp className="w-5 h-5 text-slate-400" />
    </button>
  );
};
