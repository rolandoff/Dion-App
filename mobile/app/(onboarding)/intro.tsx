import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { DarkColors, Spacing } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';

const PRINCIPLES = [
  {
    headline: 'Not a calendar.',
    body: 'Dion helps you remember who your child is — not what you have to do.',
  },
  {
    headline: 'Not a tracker.',
    body: 'No streaks, no scores, no pressure. Just quiet reminders of what matters.',
  },
  {
    headline: 'A companion.',
    body: 'Dion learns what your child cares about and surfaces it when it counts.',
  },
];

export default function IntroScreen() {
  return (
    <SafeScreen dark>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Spacer size="xxl" />
        <Typography variant="display" color={DarkColors.textPrimary}>
          dion
        </Typography>
        <Spacer size="sm" />
        <Typography variant="body" color={DarkColors.textSecondary}>
          A quiet memory companion for modern fathers.
        </Typography>
        <Spacer size="xxxl" />

        {PRINCIPLES.map((p, i) => (
          <View key={i} style={styles.principle}>
            <Typography variant="subheading" color={DarkColors.accent}>
              {p.headline}
            </Typography>
            <Spacer size="xs" />
            <Typography variant="body" color={DarkColors.textSecondary}>
              {p.body}
            </Typography>
            <Spacer size="lg" />
          </View>
        ))}

        <Spacer size="xl" />
        <DionButton
          label="Get started"
          variant="olive"
          dark
          fullWidth
          onPress={() => router.push('/(onboarding)/auth')}
        />
        <Spacer size="md" />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  principle: {
    // no extra style needed
  },
});
