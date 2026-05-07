import { create } from 'zustand';
import { authAPI } from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('tf_user') || 'null'),
  token: localStorage.getItem('tf_token') || null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem('tf_user', JSON.stringify(user));
    else localStorage.removeItem('tf_user');
  },

  setToken: (token) => {
    set({ token });
    if (token) localStorage.setItem('tf_token', token);
    else localStorage.removeItem('tf_token');
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(credentials);
      get().setToken(data.token);
      get().setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(userData);
      get().setToken(data.token);
      get().setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    get().setToken(null);
    get().setUser(null);
    set({ isInitialized: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      get().setUser(data.user);
    } catch {
      get().setToken(null);
      get().setUser(null);
    } finally {
      set({ isInitialized: true });
    }
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    get().setUser(user);
  }
}));

export default useAuthStore;
