export interface User {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  balance: number;
  creditScore: number;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
}

export interface Account {
  id: number;
  sellerId: number;
  title: string;
  gameRank?: string;
  skinCount: number;
  weapons?: string;
  price: number;
  rentalPrice?: number;
  status: 'PENDING' | 'ON_SALE' | 'LOCKED' | 'RENTED' | 'SOLD' | 'OFFLINE';
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  description?: string;
  images?: string[];
  createdAt: string;
  sellerUsername?: string;
  sellerNickname?: string;
  sellerAvatar?: string;
  sellerCreditScore?: number;
}

export interface Order {
  id: number;
  orderNo: string;
  accountId: number;
  buyerId: number;
  sellerId: number;
  type: 'BUY' | 'RENT';
  amount: number;
  deposit?: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  rentStart?: string;
  rentEnd?: string;
  createdAt: string;
  // 托管相关字段
  escrowStatus?: 'PENDING_RECEIVE' | 'IN_ESCROW' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  escrowAmount?: number;
  receivedAt?: string;
  escrowReleaseAt?: string;
  disputeId?: number;
  // 关联对象
  accountTitle?: string;
  account?: Account;
  buyer?: User;
  seller?: User;
}

export interface Dispute {
  id: number;
  disputeNo: string;
  orderId: number;
  initiatorId: number;
  respondentId: number;
  reason: 'ACCOUNT_NOT_AS_DESCRIBED' | 'ACCOUNT_RECOVERY' | 'NOT_RECEIVED' | 'FRAUD' | 'OTHER';
  description: string;
  evidenceImages?: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'MEDIATING' | 'RESOLVED' | 'REJECTED';
  resolution?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RELEASE_TO_SELLER' | 'CANCELLED';
  adminRemark?: string;
  resolvedAt?: string;
  createdAt: string;
  // 关联对象
  order?: Order;
  initiator?: User;
  respondent?: User;
  orderTitle?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  role: string;
}

export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface Review {
  id: number;
  orderId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  content?: string;
  createdAt: string;
  reviewer?: User;
}

export interface MarketConfig {
  launchMode: 'GUARANTEED_ONLY' | 'FULL';
  commissionRate: number;
  commissionDescription: string;
  guaranteeHighlights: string[];
  orderStatusLabels: Record<string, string>;
}

export interface FunnelEvent {
  eventName: string;
  page: string;
  metadata?: Record<string, unknown>;
}
