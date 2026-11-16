import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Geist_400Regular, Geist_500Medium } from '@expo-google-fonts/geist';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { createQueryClient } from '@/api/query-client';
import { useStoresHydrated } from '@/state/hydration';
import { colors } from '@/theme/tokens';

// Keep the native splash up until fonts and stored sessions are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Geist_400Regular,
    Geist_500Medium,
  });
  const storesReady = useStoresHydrated();
  const [queryClient] = useState(createQueryClient);

  const ready = (fontsLoaded || fontError !== null) && storesReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // A font failure falls back to the system font; the app still opens.
  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="products" />
        <Stack.Screen name="product/[slug]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="track" />
        <Stack.Screen name="returns-policy" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot" />
        <Stack.Screen name="auth/reset" />
        <Stack.Screen name="auth/verify" />
        <Stack.Screen name="account/profile" />
        <Stack.Screen name="account/addresses" />
        <Stack.Screen name="account/address" />
        <Stack.Screen name="account/orders" />
        <Stack.Screen name="account/order/[id]" />
        <Stack.Screen name="account/wishlist" />
        <Stack.Screen name="account/chats" />
        <Stack.Screen name="account/chat/[id]" />
      </Stack>
    </QueryClientProvider>
  );
}
