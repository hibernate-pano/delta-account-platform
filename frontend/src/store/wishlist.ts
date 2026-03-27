import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '../types';

interface WishlistState {
  items: Account[];
  addItem: (account: Account) => void;
  removeItem: (accountId: number) => void;
  isWishlisted: (accountId: number) => boolean;
  clearAll: () => void;
  seed: (accounts: Account[]) => void;
  // Computed selectors
  getVerifiedCount: () => number;
  getPriceRange: () => { min: number; max: number };
  getTotalValue: () => number;
  getVerifiedItems: () => Account[];
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (account) => {
        const exists = get().items.some((a) => a.id === account.id);
        if (!exists) {
          set((state) => ({ items: [account, ...state.items] }));
        }
      },

      removeItem: (accountId) => {
        set((state) => ({
          items: state.items.filter((a) => a.id !== accountId),
        }));
      },

      isWishlisted: (accountId) => {
        return get().items.some((a) => a.id === accountId);
      },

      clearAll: () => {
        set({ items: [] });
      },

      seed: (accounts) => {
        set({ items: accounts });
      },

      getVerifiedCount: () => get().items.filter((a) => a.verificationStatus === 'VERIFIED').length,

      getPriceRange: () => {
        const prices = get().items.map((a) => a.price).filter((p) => p > 0);
        if (prices.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...prices), max: Math.max(...prices) };
      },

      getTotalValue: () => get().items.reduce((sum, a) => sum + (a.price || 0), 0),

      getVerifiedItems: () => get().items.filter((a) => a.verificationStatus === 'VERIFIED'),
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
