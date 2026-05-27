import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionCard } from '@/components/DionCard';
import { LoadingState } from '@/components/LoadingState';
import { Spacer } from '@/components/Spacer';
import { getMemory } from '@/services/api';

const TYPE_LABEL: Record<string, string> = {
  moment: 'Moment',
  interest: 'Interest',
  promise: 'Promise',
  quote: 'Quote',
  emotional_pattern: 'Pattern',
  milestone: 'Milestone',
  routine: 'Routine',
  relationship: 'Relationship',
};

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: memory, isLoading } = useQuery({
    queryKey: ['memory', id],
    queryFn: () => getMemory(id),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState />;

  return (
    <SafeScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Spacer size="lg" />
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Typography variant="body" color={Colors.accent}>
            ← Back
          </Typography>
        </Pressable>
        <Spacer size="md" />

        {memory && (
          <>
            <Typography variant="label" color={Colors.accentMuted}>
              {TYPE_LABEL[memory.type] ?? memory.type}
            </Typography>
            <Spacer size="sm" />
            <Typography variant="subheading" color={Colors.textPrimary}>
              {memory.content}
            </Typography>

            {memory.context && (
              <>
                <Spacer size="lg" />
                <DionCard>
                  <Typography variant="label" color={Colors.textMuted}>
                    Context
                  </Typography>
                  <Spacer size="xs" />
                  <Typography variant="body" color={Colors.textSecondary}>
                    {memory.context}
                  </Typography>
                </DionCard>
              </>
            )}

            <Spacer size="lg" />
            <DionCard variant="bordered">
              <Typography variant="label" color={Colors.textMuted}>
                Saved
              </Typography>
              <Spacer size="xs" />
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                {new Date(memory.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </DionCard>
          </>
        )}
        <Spacer size="xxl" />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
  },
});
