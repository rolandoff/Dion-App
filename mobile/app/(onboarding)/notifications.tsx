import React, { useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { DarkColors, Spacing } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';
import { registerPushToken } from '@/services/api';

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        await registerPushToken(tokenData.data);
      }
      router.replace('/(onboarding)/personalized-home');
    } catch {
      router.replace('/(onboarding)/personalized-home');
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.replace('/(onboarding)/personalized-home');
  }

  return (
    <SafeScreen dark>
      <View style={styles.container}>
        <Spacer size="xxl" />
        <Typography variant="heading" color={DarkColors.textPrimary}>
          Gentle reminders.
        </Typography>
        <Spacer size="sm" />
        <Typography variant="body" color={DarkColors.textSecondary}>
          When something matters — like a promise you made — Dion will quietly
          remind you. Nothing urgent. Nothing daily.
        </Typography>
        <Spacer size="md" />
        <Typography variant="bodySmall" color={DarkColors.textMuted}>
          You control when and how. We don't send marketing notifications.
        </Typography>

        <Spacer size="xxxl" />
        <DionButton
          label="Enable gentle reminders"
          variant="olive"
          dark
          fullWidth
          loading={loading}
          onPress={handleEnable}
        />
        <Spacer size="sm" />
        <DionButton
          label="Not now"
          variant="ghost"
          fullWidth
          onPress={handleSkip}
        />
        <Spacer size="md" />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
