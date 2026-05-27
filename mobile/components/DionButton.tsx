import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  PressableProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, DarkColors, Spacing, Radius, FontFamily, FontSize } from '@/constants/tokens';

interface DionButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'olive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  dark?: boolean;
  style?: ViewStyle;
}

// Primary: dark filled (charcoal bg, white text)
// Secondary: white outlined (white bg, dark border, dark text)
// Ghost: no bg, no border (accent text)
// Olive: olive filled (accent bg, white text) — used in onboarding

const VARIANT_CONTAINER: Record<string, ViewStyle> = {
  primary: { backgroundColor: Colors.textPrimary },
  secondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  ghost: { backgroundColor: Colors.transparent },
  olive: { backgroundColor: Colors.accentDark },
};

const VARIANT_CONTAINER_DARK: Record<string, ViewStyle> = {
  primary: { backgroundColor: DarkColors.surface, borderWidth: 1, borderColor: DarkColors.border },
  secondary: { backgroundColor: DarkColors.transparent, borderWidth: 1, borderColor: DarkColors.border },
  ghost: { backgroundColor: DarkColors.transparent },
  olive: { backgroundColor: Colors.accentDark },
};

const VARIANT_LABEL: Record<string, TextStyle> = {
  primary: { color: Colors.white },
  secondary: { color: Colors.textPrimary },
  ghost: { color: Colors.accent },
  olive: { color: Colors.white },
};

const VARIANT_LABEL_DARK: Record<string, TextStyle> = {
  primary: { color: DarkColors.textPrimary },
  secondary: { color: DarkColors.textPrimary },
  ghost: { color: DarkColors.accent },
  olive: { color: Colors.white },
};

const SIZE_STYLES: Record<string, ViewStyle> = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, minHeight: 44 },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 56 },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, minHeight: 60 },
};

const LABEL_SIZE: Record<string, TextStyle> = {
  sm: { fontSize: FontSize.xs },
  md: { fontSize: FontSize.base },
  lg: { fontSize: FontSize.base },
};

export function DionButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  dark = false,
  disabled,
  style,
  ...props
}: DionButtonProps) {
  const isDisabled = disabled || loading;
  const containerStyle = dark ? VARIANT_CONTAINER_DARK[variant] : VARIANT_CONTAINER[variant];
  const labelStyle = dark ? VARIANT_LABEL_DARK[variant] : VARIANT_LABEL[variant];

  return (
    <View style={[fullWidth && styles.fullWidth, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.base,
          containerStyle,
          SIZE_STYLES[size],
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
        ]}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={labelStyle.color as string} size="small" />
        ) : (
          <Text style={[styles.label, labelStyle, LABEL_SIZE[size]]}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
});
