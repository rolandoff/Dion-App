import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { DarkColors, Spacing } from '@/constants/tokens';
import { Typography } from '@/components/Typography';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/intro');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Typography variant="display" color={DarkColors.textPrimary} style={styles.logo}>
        dion
      </Typography>
      <Typography
        variant="bodySmall"
        color={DarkColors.textMuted}
        style={styles.tagline}
      >
        remember what matters
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  logo: {
    letterSpacing: 8,
  },
  tagline: {
    letterSpacing: 2,
  },
});
