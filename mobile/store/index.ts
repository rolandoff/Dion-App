import { create } from 'zustand';
import type { Child } from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  setAuthenticated: (value: boolean, userId?: string) => void;
  logout: () => void;
}

interface ChildState {
  activeChild: Child | null;
  children: Child[];
  setActiveChild: (child: Child) => void;
  setChildren: (children: Child[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  setAuthenticated: (value, userId) =>
    set({ isAuthenticated: value, userId: userId ?? null }),
  logout: () => set({ isAuthenticated: false, userId: null }),
}));

export const useChildStore = create<ChildState>((set) => ({
  activeChild: null,
  children: [],
  setActiveChild: (child) => set({ activeChild: child }),
  setChildren: (children) => set({ children }),
}));
