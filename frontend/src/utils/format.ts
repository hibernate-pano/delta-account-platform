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
 * 格式化日期时间 (YYYY年M月D日 HH:mm)
 */
export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 格式化大数字为紧凑形式
 * formatCompact(999) => "999"
 * formatCompact(12543) => "1.3万"
 * formatCompact(1500000) => "150万"
 */
export const formatCompact = (num: number | undefined | null): string => {
  if (num == null || num < 0) return '0';
  if (num < 1000) return String(num);
  if (num < 10000) return num.toLocaleString('zh-CN');
  if (num < 100000000) return `${(num / 10000).toFixed(num % 10000 === 0 ? 0 : 1)}万`;
  return `${(num / 100000000).toFixed(1)}亿`;
};

/**
 * 格式化相对时间 (< 7天: 刚刚/N分钟前/N小时前/N天前; ≥ 7天: 3月27日)
 */
export const formatRelativeTime = (dateStr: string | number | undefined | null): string => {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};
