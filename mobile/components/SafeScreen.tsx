import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, DarkColors, Spacing } from '@/constants/tokens';

interface SafeScreenProps extends ViewProps {
  padded?: boolean;
  dark?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeScreen({
  children,
  padded = true,
  dark = false,
  edges = ['top', 'bottom'],
  style,
  ...props
}: SafeScreenProps) {
  const bg = dark ? DarkColors.background : Colors.background;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={edges} {...props}>
      <View style={[styles.inner, padded && styles.padded]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: Spacing.lg,
  },
});
