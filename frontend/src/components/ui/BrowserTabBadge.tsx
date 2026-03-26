import React, { useEffect, useRef } from 'react';
import { useUnreadCount } from '../../hooks/useQueries';
import { Bell, MessageCircle } from 'lucide-react';

const BASE_TITLE = 'DeltaHub';

/** Pure side-effect component: updates browser tab title with unread count. */
export const BrowserTabBadge: React.FC = () => {
  const { data } = useUnreadCount();
  const originalTitle = useRef(document.title || BASE_TITLE);

  useEffect(() => {
    const total = (data?.notificationCount ?? 0) + (data?.messageCount ?? 0);
    document.title = total > 0 ? `(${total}) ${originalTitle.current}` : originalTitle.current;
  }, [data]);

  return null;
};

/** Floating unread indicator — rendered in layout header area. */
export const UnreadIndicator: React.FC = () => {
  const { data, isLoading } = useUnreadCount();

  if (isLoading || !data) return null;

  const total = data.notificationCount + data.messageCount;
  if (total === 0) return null;

  return (
    <div className="fixed top-3 right-3 z-[150] flex items-center gap-1.5 animate-fade-in">
      <div className="flex items-center gap-1 px-2 py-1 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs">
        <Bell className="w-3 h-3 text-yellow-400" />
        <span className="text-yellow-400 font-bold">{data.notificationCount}</span>
        <span className="text-slate-600">|</span>
        <MessageCircle className="w-3 h-3 text-blue-400" />
        <span className="text-blue-400 font-bold">{data.messageCount}</span>
      </div>
    </div>
  );
};
