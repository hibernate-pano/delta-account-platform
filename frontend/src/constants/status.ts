export const ACCOUNT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待审核', color: 'bg-yellow-500/20 text-yellow-500' },
  ON_SALE: { label: '出售中', color: 'bg-green-500/20 text-green-500' },
  LOCKED: { label: '交易中', color: 'bg-purple-500/20 text-purple-500' },
  RENTED: { label: '租赁中', color: 'bg-blue-500/20 text-blue-500' },
  SOLD: { label: '已出售', color: 'bg-gray-500/20 text-gray-500' },
  OFFLINE: { label: '已下架', color: 'bg-gray-500/20 text-gray-500' },
};

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待支付', color: 'bg-yellow-500/20 text-yellow-500' },
  PAID: { label: '已支付', color: 'bg-blue-500/20 text-blue-500' },
  PROCESSING: { label: '进行中', color: 'bg-purple-500/20 text-purple-500' },
  COMPLETED: { label: '已完成', color: 'bg-green-500/20 text-green-500' },
  CANCELLED: { label: '已取消', color: 'bg-gray-500/20 text-gray-500' },
  REFUNDED: { label: '已退款', color: 'bg-red-500/20 text-red-500' },
};

export const USER_STATUS: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-500',
  BANNED: 'bg-red-500/20 text-red-500',
};

export const getStatusInfo = (map: Record<string, { label: string; color: string }>, status: string) =>
  map[status] || { label: status, color: 'bg-gray-500/20 text-gray-500' };
