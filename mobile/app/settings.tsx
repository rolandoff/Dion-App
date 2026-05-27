import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { Spacer } from '@/components/Spacer';
import { DionButton } from '@/components/DionButton';
import { deleteToken } from '@/services/api';
import { useAuthStore } from '@/store/index';

function SettingRow({
  label,
  value,
  onPress,
  destructive,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Typography
        variant="body"
        color={destructive ? Colors.error : Colors.textPrimary}
      >
        {label}
      </Typography>
      {value && (
        <Typography variant="body" color={Colors.textMuted}>
          {value}
        </Typography>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await deleteToken();
          logout();
          router.replace('/(onboarding)/auth');
        },
      },
    ]);
  }

  return (
    <SafeScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Spacer size="lg" />
        <View style={styles.backRow}>
          <Pressable onPress={() => router.back()}>
            <Typography variant="body" color={Colors.accent}>
              ← Back
            </Typography>
          </Pressable>
        </View>
        <Spacer size="md" />
        <Typography variant="heading" color={Colors.textPrimary}>
          Settings
        </Typography>
        <Spacer size="xl" />

        <Typography variant="label" color={Colors.textMuted}>
          Account
        </Typography>
        <Spacer size="sm" />
        <SettingRow
          label="Sign out"
          destructive
          onPress={handleLogout}
        />

        <Spacer size="xl" />
        <Typography variant="label" color={Colors.textMuted}>
          About
        </Typography>
        <Spacer size="sm" />
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Philosophy" value="Memory → Presence" />

        <Spacer size="xl" />
        <Typography variant="bodySmall" color={Colors.textMuted} style={styles.tagline}>
          dion. remember what matters.
        </Typography>
        <Spacer size="xxl" />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tagline: {
    textAlign: 'center',
    letterSpacing: 1,
  },
});
