import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '../types';

const MAX_RECENT = 12;

interface RecentState {
  items: Account[];
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
          const filtered = state.items.filter((a) => a.id !== account.id);
          return { items: [account, ...filtered].slice(0, MAX_RECENT) };
        });
      },

      removeItem: (accountId) => {
        set((state) => ({
          items: state.items.filter((a) => a.id !== accountId),
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
