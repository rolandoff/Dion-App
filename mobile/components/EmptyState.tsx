import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/tokens';
import { Typography } from './Typography';

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
}

export function EmptyState({
  message = 'Nothing here yet.',
  subMessage,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Typography
        variant="body"
        color={Colors.textMuted}
        style={styles.message}
      >
        {message}
      </Typography>
      {subMessage && (
        <Typography
          variant="bodySmall"
          color={Colors.textMuted}
          style={styles.sub}
        >
          {subMessage}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  message: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
