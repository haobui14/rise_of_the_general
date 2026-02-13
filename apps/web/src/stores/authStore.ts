import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  playerId: string | null;
  setAuth: (token: string, playerId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      playerId: null,
      setAuth: (token, playerId) => set({ token, playerId }),
      logout: () => set({ token: null, playerId: null }),
    }),
    { name: 'rotg-auth' },
  ),
);
