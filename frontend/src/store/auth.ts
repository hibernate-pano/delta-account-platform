import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../api';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
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

      initAuth: async () => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          set({ token, isLoading: true });
          try {
            const res = await authApi.getProfile();
            const profile = res.data?.data;
            if (profile) {
              set({ user: profile, isInitialized: true, isLoading: false });
            } else {
              set({ isInitialized: true, isLoading: false });
            }
          } catch {
            // Token may be expired; clear it
            localStorage.removeItem('auth-token');
            set({ token: null, user: null, isInitialized: true, isLoading: false });
          }
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
