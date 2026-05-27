import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { DarkColors, Spacing, Radius, FontFamily, FontSize } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';
import { login, register, saveToken, listChildren } from '@/services/api';
import { useAuthStore, useChildStore } from '@/store/index';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setChildren = useChildStore((s) => s.setChildren);
  const setActiveChild = useChildStore((s) => s.setActiveChild);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const fn = mode === 'register' ? register : login;
      const res = await fn(email.trim(), password);
      await saveToken(res.access_token);
      setAuthenticated(true);

      if (mode === 'login') {
        const children = await listChildren();
        if (children.length > 0) {
          setChildren(children);
          setActiveChild(children[0]);
          router.replace('/(tabs)/home');
          return;
        }
      }

      router.replace('/(onboarding)/child-setup');
    } catch {
      Alert.alert(
        mode === 'register' ? 'Could not create account' : 'Invalid credentials',
        'Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen dark>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Spacer size="xxl" />
          <Typography variant="heading" color={DarkColors.textPrimary}>
            {mode === 'register' ? 'Create account' : 'Welcome back'}
          </Typography>
          <Spacer size="xs" />
          <Typography variant="body" color={DarkColors.textSecondary}>
            {mode === 'register'
              ? 'Just an email. No social sign-in.'
              : 'Good to see you again.'}
          </Typography>
          <Spacer size="xl" />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={DarkColors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Spacer size="sm" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={DarkColors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />

          <Spacer size="xl" />
          <DionButton
            label={mode === 'register' ? 'Create account' : 'Sign in'}
            variant="olive"
            dark
            fullWidth
            loading={loading}
            onPress={handleSubmit}
          />
          <Spacer size="md" />
          <DionButton
            label={mode === 'register' ? 'Already have an account?' : 'New here?'}
            variant="ghost"
            fullWidth
            onPress={() => setMode(mode === 'register' ? 'login' : 'register')}
          />
          <Spacer size="md" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xxl },
  input: {
    backgroundColor: DarkColors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    color: DarkColors.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: DarkColors.border,
    minHeight: 48,
  },
});
