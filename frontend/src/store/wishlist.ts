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
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
