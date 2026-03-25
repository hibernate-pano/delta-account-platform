import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      isInitialized: false,

      setAuth: (token, user) => {
        localStorage.setItem('auth-token', token);
        set({ token, user });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({ token: null, user: null });
      },

      initAuth: () => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          set({ token, isLoading: true });
          // Token will be validated on API call, just mark as initialized
          set({ isInitialized: true, isLoading: false });
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
