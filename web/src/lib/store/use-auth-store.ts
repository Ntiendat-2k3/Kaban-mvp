import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (user: UserInfo, token: string) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
}

/**
 * Zustand store quản lý phiên xác thực người dùng (SRS §4, BR-04)
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isInitialized: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trello.token', token);
    }
    set({ user, token, isLoading: false, isInitialized: true });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trello.token');
    }
    set({ user: null, token: null, isLoading: false, isInitialized: true });
  },

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('trello.token');
    if (!token) {
      set({ user: null, token: null, isLoading: false, isInitialized: true });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await apiClient.get('/auth/me');
      set({
        user: response.data,
        token,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      // Bất kỳ 401 hoặc lỗi xác thực token -> dọn dẹp sạch sẽ
      localStorage.removeItem('trello.token');
      set({ user: null, token: null, isLoading: false, isInitialized: true });
    }
  },
}));
