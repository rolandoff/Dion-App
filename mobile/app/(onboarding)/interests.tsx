import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { DarkColors, Spacing, Radius } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';
import { createMemory } from '@/services/api';
import { useChildStore } from '@/store/index';

const INTEREST_OPTIONS = [
  'Football', 'Dinosaurs', 'Space', 'Animals', 'Drawing',
  'Music', 'Building', 'Swimming', 'Reading', 'Gaming',
  'Cooking', 'Dancing', 'Nature', 'Cars', 'Superheroes',
];

export default function InterestsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const activeChild = useChildStore((s) => s.activeChild);

  function toggle(interest: string) {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleNext() {
    if (!activeChild) return;
    if (selected.length === 0) {
      router.push('/(onboarding)/first-memory');
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        selected.map((interest) =>
          createMemory({
            child_id: activeChild.id,
            type: 'interest',
            content: interest,
          })
        )
      );
      router.push('/(onboarding)/first-memory');
    } catch {
      Alert.alert('Could not save interests', 'Continuing anyway.');
      router.push('/(onboarding)/first-memory');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen dark>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Spacer size="xxl" />
        <Typography variant="heading" color={DarkColors.textPrimary}>
          What does {activeChild?.name ?? 'your child'} love?
        </Typography>
        <Spacer size="xs" />
        <Typography variant="body" color={DarkColors.textSecondary}>
          Pick a few. You can always add more.
        </Typography>
        <Spacer size="xl" />

        <View style={styles.grid}>
          {INTEREST_OPTIONS.map((interest) => {
            const active = selected.includes(interest);
            return (
              <Pressable
                key={interest}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggle(interest)}
              >
                <Typography
                  variant="label"
                  color={active ? DarkColors.textInverse : DarkColors.textSecondary}
                >
                  {interest}
                </Typography>
              </Pressable>
            );
          })}
        </View>

        <Spacer size="xl" />
        <DionButton
          label={selected.length > 0 ? 'Continue' : 'Skip for now'}
          variant={selected.length > 0 ? 'olive' : 'ghost'}
          dark
          fullWidth
          loading={loading}
          onPress={handleNext}
        />
        <Spacer size="md" />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: Spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: DarkColors.border,
    backgroundColor: DarkColors.surface,
  },
  chipActive: {
    backgroundColor: DarkColors.accent,
    borderColor: DarkColors.accent,
  },
});
