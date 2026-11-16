import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CartTokenState = {
  /** The guest cart token (sent as X-Cart-Token). Null until the first cart item is added. */
  token: string | null;
  setToken: (token: string | null) => void;
};

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useCartToken = create<CartTokenState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: 'asknget.cart',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
