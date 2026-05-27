import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, LineHeight } from '@/constants/tokens';

interface TypographyProps extends TextProps {
  variant?:
    | 'displayXL'
    | 'displayL'
    | 'display'
    | 'headingXL'
    | 'heading'
    | 'subheading'
    | 'bodyL'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'label'
    | 'eyebrow';
  color?: string;
  weight?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold';
}

export function Typography({
  variant = 'body',
  color = Colors.textPrimary,
  weight,
  style,
  ...props
}: TypographyProps) {
  const variantStyle = styles[variant] ?? styles.body;
  const fontFamily = weight ? FontFamily[weight] : undefined;

  return (
    <Text
      style={[variantStyle, { color }, fontFamily ? { fontFamily } : undefined, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  // Display — hero moments
  displayXL: {
    fontSize: FontSize.xxxl,     // 52px
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.xxxl * LineHeight.tight,
    letterSpacing: -1,
  },
  displayL: {
    fontSize: FontSize.xxl,      // 42px
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.xxl * LineHeight.tight,
    letterSpacing: -0.8,
  },
  display: {
    fontSize: FontSize.xl,       // 34px — screen titles
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.xl * LineHeight.tight,
    letterSpacing: -0.5,
  },
  headingXL: {
    fontSize: FontSize.xl,       // 34px
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.xl * 1.15,
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: FontSize.lg,       // 28px — section headlines
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.lg * 1.2,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: FontSize.md,       // 22px — content sections
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.md * 1.25,
    letterSpacing: -0.2,
  },
  // Body — readable text
  bodyL: {
    fontSize: FontSize.base,     // 18px — preferred default per spec
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.base,     // 18px
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.base * LineHeight.relaxed,
  },
  bodySmall: {
    fontSize: FontSize.sm,       // 15px
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  },
  // Supporting
  caption: {
    fontSize: FontSize.xs,       // 13px
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: FontSize.sm,       // 15px
    fontFamily: FontFamily.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: 0.2,
  },
  eyebrow: {
    fontSize: FontSize.xs,       // 13px
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: 1.2,
  },
});
