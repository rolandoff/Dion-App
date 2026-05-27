import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';
import { useCreateMemory } from '@/hooks/useMemories';
import { useChildStore } from '@/store/index';
import type { MemoryType } from '@/services/api';

const MEMORY_TYPES: { type: MemoryType; label: string; prompt: string }[] = [
  { type: 'moment', label: 'Moment', prompt: 'What happened?' },
  { type: 'promise', label: 'Promise', prompt: 'What did you promise?' },
  { type: 'quote', label: 'Quote', prompt: 'What did they say?' },
  { type: 'interest', label: 'Interest', prompt: 'What are they into lately?' },
  { type: 'milestone', label: 'Milestone', prompt: 'What did they do for the first time?' },
  { type: 'emotional_pattern', label: 'Pattern', prompt: 'What have you noticed lately?' },
];

const SUGGESTIONS = [
  'He keeps asking about…',
  'Something funny they said',
  'A small moment worth keeping',
  'Something I want to remember',
  'A promise I made',
];

export default function CaptureScreen() {
  const [type, setType] = useState<MemoryType>('moment');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [focused, setFocused] = useState(false);
  const activeChild = useChildStore((s) => s.activeChild);
  const createMemory = useCreateMemory(activeChild?.id);

  const selectedType = MEMORY_TYPES.find((t) => t.type === type)!;

  async function handleSave() {
    if (!activeChild || !content.trim()) return;
    try {
      await createMemory.mutateAsync({
        child_id: activeChild.id,
        type,
        content: content.trim(),
        context: context.trim() || undefined,
      });
      setContent('');
      setContext('');
      setType('moment');
      router.push('/(tabs)/home');
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    }
  }

  return (
    <SafeScreen padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <Spacer size="lg" />
            <Text style={styles.screenHeader}>Dion.</Text>
            <Spacer size="xl" />

            {/* Main prompt */}
            <Text style={styles.headline}>Before you forget…</Text>
            <Spacer size="xs" />
            <Text style={styles.subheadline}>
              {activeChild
                ? `Something worth remembering about ${activeChild.name}.`
                : 'Something worth keeping.'}
            </Text>

            {/* Type selector */}
            <Spacer size="xl" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeRow}
            >
              {MEMORY_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  style={[styles.typeChip, t.type === type && styles.typeChipActive]}
                  onPress={() => setType(t.type)}
                >
                  <Text
                    style={[
                      styles.typeChipLabel,
                      t.type === type && styles.typeChipLabelActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Main input */}
            <Spacer size="xl" />
            <TextInput
              style={[styles.mainInput, focused && styles.mainInputFocused]}
              placeholder={selectedType.prompt}
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />

            {/* Context input */}
            <Spacer size="md" />
            <TextInput
              style={styles.contextInput}
              placeholder="Add context… (optional)"
              placeholderTextColor={Colors.textMuted}
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />

            {/* Save */}
            <Spacer size="xl" />
            <DionButton
              label="Save"
              variant="primary"
              fullWidth
              loading={createMemory.isPending}
              disabled={!content.trim() || !activeChild}
              onPress={handleSave}
            />
            <Spacer size="sm" />
            <Text style={styles.saveNote}>Your memory is safe with Dion.</Text>

            {/* Suggestions */}
            <Spacer size="xxxl" />
            <Text style={styles.suggestionsLabel}>Things worth remembering</Text>
            <Spacer size="md" />
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                style={styles.suggestionRow}
                onPress={() => setContent(s.replace('…', ' '))}
              >
                <Text style={styles.suggestionBullet}>○</Text>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}

            <Spacer size="xxxl" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { paddingHorizontal: Spacing.lg },

  screenHeader: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,      // 34px
    color: Colors.textPrimary,
    lineHeight: FontSize.xl * 1.15,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,    // 18px
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },

  // Type selector
  typeRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipActive: {
    backgroundColor: Colors.accentDark,
    borderColor: Colors.accentDark,
  },
  typeChipLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  typeChipLabelActive: {
    color: Colors.white,
  },

  // Inputs
  mainInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    color: Colors.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,    // 18px
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    minHeight: 140,
    lineHeight: FontSize.base * 1.6,
  },
  mainInputFocused: {
    borderColor: Colors.accent,
  },
  contextInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,      // 15px
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    minHeight: 72,
    lineHeight: FontSize.sm * 1.6,
  },

  saveNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Suggestions
  suggestionsLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  suggestionBullet: {
    fontFamily: FontFamily.light,
    fontSize: FontSize.sm,
    color: Colors.accentMuted,
    paddingTop: 2,
  },
  suggestionText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: FontSize.base * 1.5,
  },
});
