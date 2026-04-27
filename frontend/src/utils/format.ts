/**
 * 格式化价格显示
 * formatPrice(99.5) => "99.50"
 * formatPrice(1234.5) => "1,234.50"
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price == null) return '0.00';
  return price.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * 格式化相对时间
 * formatDistanceToNow('2026-04-27T10:00:00') => "2小时前"
 */
export const formatDistanceToNow = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return dateStr.slice(0, 10);
  } catch {
    return dateStr;
  }
};
