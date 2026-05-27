import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="child-setup" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="first-memory" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="personalized-home" />
    </Stack>
  );
}
