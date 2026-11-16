import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The part of the signed-in user the app keeps locally. Never the password. */
export type SessionUser = {
  id?: string | null;
  email: string;
  full_name?: string | null;
  is_seller?: boolean;
  is_staff?: boolean;
};

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  setSession: (tokens: { accessToken: string; refreshToken: string }, user: SessionUser | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clear: () => void;
};

/** Tokens live in the device keystore (SecureStore), never in AsyncStorage. */
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (tokens, user) => set({ ...tokens, user }),
      setTokens: (tokens) => set({ ...tokens }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'asknget.session',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

export function isSignedIn(): boolean {
  return useSession.getState().accessToken !== null;
}
