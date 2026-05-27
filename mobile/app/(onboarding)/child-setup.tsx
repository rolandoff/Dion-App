import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { DarkColors, Spacing, Radius, FontFamily, FontSize } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';
import { createChild } from '@/services/api';
import { useChildStore } from '@/store/index';

export default function ChildSetupScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const setActiveChild = useChildStore((s) => s.setActiveChild);

  async function handleNext() {
    const ageNum = parseInt(age, 10);
    if (!name.trim() || isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
      Alert.alert('Please enter your child\'s name and age (0–18).');
      return;
    }
    setLoading(true);
    try {
      const child = await createChild(name.trim(), ageNum);
      setActiveChild(child);
      router.push('/(onboarding)/interests');
    } catch {
      Alert.alert('Could not save', 'Please try again.');
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
        <Spacer size="xxl" />
        <Typography variant="heading" color={DarkColors.textPrimary}>
          Tell me about your child.
        </Typography>
        <Spacer size="xs" />
        <Typography variant="body" color={DarkColors.textSecondary}>
          Just a name and age. You can add more later.
        </Typography>
        <Spacer size="xl" />

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={DarkColors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Spacer size="sm" />
        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor={DarkColors.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={2}
        />

        <Spacer size="xl" />
        <DionButton
          label="Continue"
          variant="olive"
          dark
          fullWidth
          loading={loading}
          disabled={!name.trim() || !age.trim()}
          onPress={handleNext}
        />
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
