import React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Spacer } from '@/components/Spacer';
import { useMemories } from '@/hooks/useMemories';
import { useChildStore } from '@/store/index';
import type { Memory } from '@/services/api';

// ── Memory Row ─────────────────────────────────────────────────────────────────

function MemoryRow({ memory }: { memory: Memory }) {
  return (
    <Pressable
      style={styles.memoryRow}
      onPress={() => router.push(`/memory/${memory.id}` as never)}
    >
      <View style={styles.memoryRowInner}>
        <Text style={styles.memoryType}>{labelForType(memory.type)}</Text>
        <Text style={styles.memoryContent} numberOfLines={2}>
          {memory.content}
        </Text>
        {memory.context && (
          <Text style={styles.memoryContext} numberOfLines={1}>
            {memory.context}
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function labelForType(type: string): string {
  const map: Record<string, string> = {
    moment: 'MOMENT',
    interest: 'INTEREST',
    promise: 'PROMISE',
    quote: 'QUOTE',
    milestone: 'MILESTONE',
    emotional_pattern: 'PATTERN',
    routine: 'ROUTINE',
    relationship: 'RELATIONSHIP',
  };
  return map[type] ?? type.toUpperCase();
}

// ── Stats Row ──────────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const activeChild = useChildStore((s) => s.activeChild);
  const { data: memories = [], isLoading } = useMemories(activeChild?.id);

  const promises = memories.filter((m) => m.type === 'promise');
  const interests = memories.filter((m) => m.type === 'interest');
  const other = memories.filter(
    (m) => m.type !== 'promise' && m.type !== 'interest'
  );

  if (!activeChild) {
    return (
      <SafeScreen>
        <View style={styles.noChildContainer}>
          <Text style={styles.emptyHeadline}>No child profile yet.</Text>
          <Spacer size="sm" />
          <Text style={styles.emptyBody}>Add one in Settings.</Text>
          <Spacer size="xl" />
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push('/settings' as never)}
          >
            <Text style={styles.settingsBtnText}>Go to Settings</Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.content}>
          {/* Header */}
          <Spacer size="lg" />
          <Text style={styles.screenHeader}>Dion.</Text>

          {/* Child hero */}
          <Spacer size="xxl" />
          <View style={styles.childHero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{activeChild.name[0]}</Text>
            </View>
            <Spacer size="lg" />
            <Text style={styles.childName}>{activeChild.name}</Text>
            <Spacer size="xs" />
            <Text style={styles.childAge}>Age {activeChild.age}</Text>
          </View>

          {/* Stats */}
          <Spacer size="xl" />
          <View style={styles.statsRow}>
            <StatItem value={memories.length} label="memories" />
            <View style={styles.statDivider} />
            <StatItem value={promises.length} label="promises" />
            <View style={styles.statDivider} />
            <StatItem value={interests.length} label="interests" />
          </View>

          {/* Memories by type */}
          {promises.length > 0 && (
            <>
              <Spacer size="xxl" />
              <View style={styles.sectionDivider} />
              <Spacer size="xl" />
              <Text style={styles.sectionEyebrow}>PROMISES</Text>
              <Spacer size="md" />
              {promises.map((m) => (
                <MemoryRow key={m.id} memory={m} />
              ))}
            </>
          )}

          {interests.length > 0 && (
            <>
              <Spacer size="xxl" />
              <View style={styles.sectionDivider} />
              <Spacer size="xl" />
              <Text style={styles.sectionEyebrow}>INTERESTS</Text>
              <Spacer size="md" />
              {interests.map((m) => (
                <MemoryRow key={m.id} memory={m} />
              ))}
            </>
          )}

          {other.length > 0 && (
            <>
              <Spacer size="xxl" />
              <View style={styles.sectionDivider} />
              <Spacer size="xl" />
              <Text style={styles.sectionEyebrow}>MOMENTS & MORE</Text>
              <Spacer size="md" />
              {other.map((m) => (
                <MemoryRow key={m.id} memory={m} />
              ))}
            </>
          )}

          {memories.length === 0 && !isLoading && (
            <>
              <Spacer size="xxl" />
              <View style={styles.sectionDivider} />
              <Spacer size="xl" />
              <Text style={styles.emptyBody}>
                No memories yet.{'\n'}
                Start capturing in the Capture tab.
              </Text>
            </>
          )}

          {/* Footer */}
          <Spacer size="xxxl" />
          <Pressable
            style={styles.settingsRow}
            onPress={() => router.push('/settings' as never)}
          >
            <Text style={styles.settingsRowText}>Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Spacer size="xxl" />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  content: { paddingHorizontal: Spacing.lg },

  screenHeader: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Child hero
  childHero: {
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xxl,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  childName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xxl,    // 42px — large, editorial
    color: Colors.textPrimary,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  childAge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,    // 28px
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Sections
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionEyebrow: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.accent,
    letterSpacing: 1.5,
  },

  // Memory rows
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  memoryRowInner: {
    flex: 1,
  },
  memoryType: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.accentMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  memoryContent: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.35,
  },
  memoryContext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontFamily: FontFamily.light,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },

  // Settings
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsRowText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },

  // Empty / no child
  noChildContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  emptyHeadline: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    lineHeight: FontSize.lg * 1.2,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.6,
  },
  settingsBtn: {
    paddingVertical: Spacing.md,
  },
  settingsBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.accent,
  },
});
