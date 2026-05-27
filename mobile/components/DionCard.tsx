import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/tokens';

interface DionCardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'dark';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function DionCard({
  variant = 'default',
  padding = 'md',
  style,
  children,
  ...props
}: DionCardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        padding !== 'none' && styles[`padding_${padding}`],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    backgroundColor: Colors.surfaceHigh,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  bordered: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dark: {
    backgroundColor: '#2D3A24',  // Deep forest green — Stay Present card
  },
  padding_sm: {
    padding: Spacing.md,
  },
  padding_md: {
    padding: Spacing.lg,
  },
  padding_lg: {
    padding: Spacing.xl,
  },
});
