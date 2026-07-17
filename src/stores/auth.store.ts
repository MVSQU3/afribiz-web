import { create } from 'zustand';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  firstName: string;
  lastName: string;
  country: string;
  language: 'fr' | 'en';
  avatarUrl: string | null;
  isVerified: boolean;
}

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  language: 'fr' | 'en';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { identifier, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', payload);
      // Connexion automatique après inscription
      await useAuthStore.getState().login(payload.email, payload.password);
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null });
  },

  fetchMe: async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      const { data } = await api.get<User>('/auth/me');
      set({ user: data });
    } catch {
      // Token invalide → l'intercepteur a déjà nettoyé
      set({ user: null });
    }
  },
}));
