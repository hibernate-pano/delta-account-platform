import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => void | Promise<void>;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children, onRefresh, threshold = 80 }) => {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY <= 2) {
      touchStartY.current = e.touches[0].clientY;
      pullingRef.current = false;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Only intercept pull-down when scrolled to top
    if (window.scrollY > 2) return;
    if (refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      e.preventDefault();
      pullingRef.current = true;
      setPulling(true);
      setPullY(Math.min(delta, threshold + 40));
    }
  }, [refreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullY >= threshold && !refreshing) {
      setRefreshing(true);
      setPulling(false);
      await onRefresh();
      setRefreshing(false);
      setPullY(0);
    } else {
      setPulling(false);
      setPullY(0);
    }
  }, [pullY, threshold, refreshing, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !refreshing) {
          e.preventDefault();
          setRefreshing(true);
          onRefresh().finally(() => setRefreshing(false));
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="下拉刷新"
      className="relative"
    >
      {/* Pull indicator — uses translateY so it stays attached to scroll position */}
      {pulling && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{
            paddingTop: `${Math.min(pullY, threshold + 20)}px`,
            transition: refreshing ? 'none' : 'padding-top 0.1s ease',
          }}
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? 'animate-spin text-primary' : `text-primary ${pullY >= threshold ? 'opacity-100 scale-110' : 'opacity-60'}`}`}
            style={{
              transform: refreshing ? 'rotate(0deg)' : `rotate(${Math.min(pullY, threshold) / threshold * 360}deg)`,
              transition: 'transform 0.1s ease',
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
};
