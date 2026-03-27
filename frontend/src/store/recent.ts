import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '../types';

const MAX_RECENT = 12;

interface RecentItem {
  account: Account;
  viewedAt: number; // timestamp ms
}

interface RecentState {
  items: RecentItem[];
  addItem: (account: Account) => void;
  removeItem: (accountId: number) => void;
  clearAll: () => void;
  getVerifiedCount: () => number;
  getPriceRange: () => { min: number; max: number };
  getRecentItems: (limit?: number) => RecentItem[];
  getItemsBySeller: (sellerId: number) => RecentItem[];
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (account) => {
        set((state) => {
          const filtered = state.items.filter((item) => item.account.id !== account.id);
          return { items: [{ account, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT) };
        });
      },

      removeItem: (accountId) => {
        set((state) => ({
          items: state.items.filter((item) => item.account.id !== accountId),
        }));
      },

      clearAll: () => {
        set({ items: [] });
      },

      getVerifiedCount: () => get().items.filter((item) => item.account.verificationStatus === 'VERIFIED').length,

      getPriceRange: () => {
        const prices = get().items.map((item) => item.account.price).filter((p) => p > 0);
        if (prices.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...prices), max: Math.max(...prices) };
      },

      getRecentItems: (limit = MAX_RECENT) => get().items.slice(0, limit),

      getItemsBySeller: (sellerId: number) =>
        get().items.filter((item) => item.account.sellerId === sellerId),
    }),
    {
      name: 'recent-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
