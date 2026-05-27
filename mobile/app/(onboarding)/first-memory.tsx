import React, { useState } from 'react';
import {
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
import { createMemory } from '@/services/api';
import { useChildStore } from '@/store/index';

export default function FirstMemoryScreen() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const activeChild = useChildStore((s) => s.activeChild);

  async function handleNext() {
    if (!activeChild) return;
    if (!content.trim()) {
      router.push('/(onboarding)/notifications');
      return;
    }
    setLoading(true);
    try {
      await createMemory({
        child_id: activeChild.id,
        type: 'moment',
        content: content.trim(),
      });
      router.push('/(onboarding)/notifications');
    } catch {
      Alert.alert('Could not save', 'Continuing anyway.');
      router.push('/(onboarding)/notifications');
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
            A moment worth remembering.
          </Typography>
          <Spacer size="xs" />
          <Typography variant="body" color={DarkColors.textSecondary}>
            Something that made you smile recently. Doesn't have to be big.
          </Typography>
          <Spacer size="xl" />

          <TextInput
            style={styles.textarea}
            placeholder={`Something ${activeChild?.name ?? 'your child'} said or did lately...`}
            placeholderTextColor={DarkColors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />

          <Spacer size="xl" />
          <DionButton
            label={content.trim() ? 'Save memory' : 'Skip for now'}
            variant={content.trim() ? 'olive' : 'ghost'}
            dark
            fullWidth
            loading={loading}
            onPress={handleNext}
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
  textarea: {
    backgroundColor: DarkColors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: DarkColors.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: DarkColors.border,
    minHeight: 120,
    lineHeight: FontSize.base * 1.6,
  },
});
