import React from 'react';
import { View } from 'react-native';
import { Spacing } from '@/constants/tokens';

type SpacingKey = keyof typeof Spacing;

interface SpacerProps {
  size?: SpacingKey | number;
  horizontal?: boolean;
}

export function Spacer({ size = 'md', horizontal = false }: SpacerProps) {
  const value = typeof size === 'number' ? size : Spacing[size];
  return (
    <View
      style={horizontal ? { width: value } : { height: value }}
      pointerEvents="none"
    />
  );
}
