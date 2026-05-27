import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/index';

export default function RootIndex() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/(onboarding)/splash" />
  );
}
