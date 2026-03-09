export interface User {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
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
  status: 'PENDING' | 'ON_SALE' | 'RENTED' | 'SOLD' | 'OFFLINE';
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  description?: string;
  images?: string[];
  createdAt: string;
  seller?: User;
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
  account?: Account;
  buyer?: User;
  seller?: User;
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
