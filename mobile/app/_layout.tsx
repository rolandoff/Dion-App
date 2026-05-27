import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { getToken, listChildren } from '@/services/api';
import { useAuthStore, useChildStore } from '@/store/index';
import { LoadingState } from '@/components/LoadingState';
import { Colors } from '@/constants/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const [authChecked, setAuthChecked] = useState(false);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setChildren = useChildStore((s) => s.setChildren);
  const setActiveChild = useChildStore((s) => s.setActiveChild);

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken();
      if (token) {
        setAuthenticated(true);
        try {
          const children = await listChildren();
          if (children.length > 0) {
            setChildren(children);
            setActiveChild(children[0]);
          }
        } catch {
          // Token expired or invalid — navigation will handle redirect
        }
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, [setAuthenticated, setChildren, setActiveChild]);

  if (!fontsLoaded || !authChecked) {
    return <LoadingState />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="memory/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
