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
