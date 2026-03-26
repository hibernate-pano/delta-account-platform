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
    }),
    {
      name: 'recent-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
