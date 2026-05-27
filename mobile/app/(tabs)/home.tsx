import React from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  StyleSheet,
  Pressable,
  Text,
  Image,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Spacer } from '@/components/Spacer';
import { useHome } from '@/hooks/useHome';
import { useMemories } from '@/hooks/useMemories';
import { useChildStore } from '@/store/index';
import type { HomeContent, Memory } from '@/services/api';

// ── Brand photos (lifestyle imagery) ──────────────────────────────────────────
const BRAND_PHOTOS = [
  require('@/assets/images/dad_son_1.png'),
  require('@/assets/images/dad_son_2.png'),
  require('@/assets/images/dad_son_3.png'),
  require('@/assets/images/dad_son_4.png'),
  require('@/assets/images/dad_son_5.png'),
];

// ── Header ─────────────────────────────────────────────────────────────────────

function HomeHeader({ childName, childAge }: { childName: string; childAge: number }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.wordmark}>Dion</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{childName[0]}</Text>
          </Pressable>
        </View>
      </View>
      <Spacer size="xs" />
      <Text style={styles.headerSubtitle}>
        An age-aware snapshot of what shapes {childName} right now.
      </Text>
      <Spacer size="sm" />
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>AGE {childAge}</Text>
        </View>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={[styles.chipText, styles.chipTextActive]}>THIS WEEK</Text>
        </View>
        <Text style={styles.phaseNote} numberOfLines={1}>
          This phase changes quickly.
        </Text>
      </View>
    </View>
  );
}

// ── Memory Grid Card ───────────────────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  'RIGHT NOW': '#7E8A68',
  LATELY: '#B5BCA8',
  TODAY: '#C4A882',
  PROMISE: '#C4A882',
};

function MemoryCard({
  label,
  headline,
  support,
  style,
}: {
  label: string;
  headline: string;
  support?: string;
  style?: object;
}) {
  const dot = DOT_COLORS[label] ?? Colors.accent;
  return (
    <View style={[styles.gridCard, style]}>
      <View style={styles.gridDotRow}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.gridLabel}>{label}</Text>
      </View>
      <Spacer size="xs" />
      <Text style={styles.gridHeadline} numberOfLines={3}>
        {headline}
      </Text>
      {support ? (
        <Text style={styles.gridSupport} numberOfLines={2}>
          {support}
        </Text>
      ) : null}
    </View>
  );
}

// ── What Matters Grid ──────────────────────────────────────────────────────────

function WhatMattersGrid({
  content,
  memories,
}: {
  content: HomeContent;
  memories: Memory[];
}) {
  const interest = memories.find((m) => m.type === 'interest' || m.type === 'emotional_pattern');
  const promise = memories.find((m) => m.type === 'promise');

  const rightCards: { label: string; headline: string; support?: string }[] = [];

  if (interest) {
    rightCards.push({
      label: 'LATELY',
      headline: interest.content,
      support: interest.context ?? undefined,
    });
  } else if (content.reminder_headline) {
    rightCards.push({
      label: 'LATELY',
      headline: content.reminder_headline,
      support: content.reminder_support ?? undefined,
    });
  }

  if (promise) {
    rightCards.push({
      label: 'TODAY',
      headline: promise.content,
      support: promise.context ?? undefined,
    });
  } else if (content.promise_headline) {
    rightCards.push({
      label: 'TODAY',
      headline: content.promise_headline,
      support: content.promise_support ?? undefined,
    });
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>What matters today</Text>
      <Spacer size="sm" />
      <View style={styles.gridRow}>
        {/* Left column — primary */}
        <MemoryCard
          label="RIGHT NOW"
          headline={content.what_matters_headline}
          support={content.what_matters_support}
          style={styles.gridLeft}
        />

        {/* Right column — stack of 1–2 smaller cards */}
        {rightCards.length > 0 && (
          <View style={styles.gridRight}>
            {rightCards.map((card, i) => (
              <MemoryCard
                key={card.label}
                label={card.label}
                headline={card.headline}
                support={card.support}
                style={i > 0 ? { marginTop: Spacing.sm } : undefined}
              />
            ))}
          </View>
        )}
      </View>
      <Spacer size="sm" />
      <Text style={styles.footerNote}>
        These moments change. You don't have to remember everything.
      </Text>
    </View>
  );
}

// ── Stay Present Card ──────────────────────────────────────────────────────────

function StayPresentCard({ content }: { content: HomeContent }) {
  return (
    <ImageBackground
      source={BRAND_PHOTOS[3]}
      style={styles.stayPresentCard}
      imageStyle={styles.stayPresentImage}
    >
      <View style={styles.stayPresentOverlay}>
        <Text style={styles.stayPresentEyebrow}>✦ STAY PRESENT TODAY</Text>
        <Spacer size="sm" />
        <Text style={styles.stayPresentHeadline}>{content.what_matters_headline}</Text>
        <Spacer size="xs" />
        <Text style={styles.stayPresentSupport}>{content.what_matters_support}</Text>
        <Spacer size="lg" />
        <Pressable
          style={styles.stayPresentBtn}
          onPress={() => router.push('/(tabs)/capture')}
        >
          <Text style={styles.stayPresentBtnText}>Remember a moment</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

// ── Trending ───────────────────────────────────────────────────────────────────

function TrendingLine({ content }: { content: HomeContent }) {
  if (!content.resurfacing_content) return null;
  return (
    <View style={styles.trendingRow}>
      <Text style={styles.trendingStar}>✦</Text>
      <Text style={styles.trendingText} numberOfLines={2}>
        {content.resurfacing_content}
      </Text>
    </View>
  );
}

// ── Recent Moments ─────────────────────────────────────────────────────────────

function RecentMemoryRow({ memory, photoIndex }: { memory: Memory; photoIndex: number }) {
  const date = new Date(memory.created_at);
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const photo = BRAND_PHOTOS[photoIndex % BRAND_PHOTOS.length];

  return (
    <Pressable
      style={styles.memoryRow}
      onPress={() => router.push(`/memory/${memory.id}` as never)}
    >
      <Image source={photo} style={styles.memoryThumb} />
      <View style={styles.memoryRowContent}>
        <Text style={styles.memoryRowTitle} numberOfLines={1}>
          {memory.content}
        </Text>
        {memory.context ? (
          <Text style={styles.memoryRowContext} numberOfLines={1}>
            {memory.context}
          </Text>
        ) : null}
      </View>
      <Text style={styles.memoryRowDate}>{label}</Text>
    </Pressable>
  );
}

function RecentMomentsSection({ memories }: { memories: Memory[] }) {
  const recent = memories.slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent moments</Text>
        <Pressable onPress={() => router.push('/(tabs)/profile' as never)}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <Spacer size="sm" />
      {recent.map((m, i) => (
        <RecentMemoryRow key={m.id} memory={m} photoIndex={i} />
      ))}
      <Spacer size="md" />
      <Pressable
        style={styles.captureCtaRow}
        onPress={() => router.push('/(tabs)/capture')}
      >
        <Text style={styles.captureCtaText}>Big or small, it all matters.</Text>
        <Text style={styles.captureCtaLink}>Capture  →</Text>
      </Pressable>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyHome({ childName }: { childName: string }) {
  return (
    <View>
      <Spacer size="xxl" />
      <Image source={BRAND_PHOTOS[0]} style={styles.emptyImage} />
      <Spacer size="xl" />
      <Text style={styles.emptyHeadline}>
        Start remembering what matters.
      </Text>
      <Spacer size="sm" />
      <Text style={styles.emptyBody}>
        Little things are easy to forget.{'\n'}The things that matter most usually are.
      </Text>
      <Spacer size="xl" />
      <Pressable
        style={styles.emptyBtn}
        onPress={() => router.push('/(tabs)/capture')}
      >
        <Text style={styles.emptyBtnText}>Remember something</Text>
      </Pressable>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const activeChild = useChildStore((s) => s.activeChild);
  const { content, isLoading, refresh, isRefreshing } = useHome(activeChild?.id);
  const { data: memories = [] } = useMemories(activeChild?.id);

  if (!activeChild) {
    return (
      <SafeScreen>
        <View style={styles.noChildWrap}>
          <Text style={styles.emptyHeadline}>No child profile yet.</Text>
          <Spacer size="xs" />
          <Text style={styles.emptyBody}>Set one up in the Profile tab.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => refresh()}
            tintColor={Colors.accent}
          />
        }
      >
        <View style={styles.padded}>
          {/* Header always visible */}
          <Spacer size="lg" />
          <HomeHeader childName={activeChild.name} childAge={activeChild.age} />
          <Spacer size="xl" />
        </View>

        {isLoading ? (
          <View style={styles.padded}>
            <Text style={styles.loadingDash}>—</Text>
          </View>
        ) : !content ? (
          <View style={styles.padded}>
            <EmptyHome childName={activeChild.name} />
          </View>
        ) : (
          <>
            {/* What Matters Grid */}
            <View style={styles.padded}>
              <WhatMattersGrid content={content} memories={memories} />
            </View>

            {/* Stay Present — full bleed */}
            <Spacer size="lg" />
            <View style={styles.padded}>
              <StayPresentCard content={content} />
            </View>

            {/* Trending */}
            <View style={styles.padded}>
              <TrendingLine content={content} />
            </View>

            {/* Recent Moments */}
            <Spacer size="lg" />
            <View style={styles.padded}>
              <RecentMomentsSection memories={memories} />
            </View>
          </>
        )}

        <Spacer size="xxxl" />
      </ScrollView>
    </SafeScreen>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  padded: { paddingHorizontal: Spacing.lg },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: FontSize.xs * 1.5,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'nowrap',
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  chipTextActive: {
    color: Colors.white,
  },
  phaseNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },

  // Section titles
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.accent,
    letterSpacing: 0.2,
  },

  // Memory grid
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'stretch',
  },
  gridLeft: {
    flex: 1,
  },
  gridRight: {
    flex: 1,
  },
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  gridDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  gridLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  gridHeadline: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.3,
    letterSpacing: -0.2,
  },
  gridSupport: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: FontSize.xs * 1.5,
  },
  footerNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.6,
  },

  // Stay Present
  stayPresentCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minHeight: 220,
  },
  stayPresentImage: {
    borderRadius: Radius.lg,
  },
  stayPresentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 28, 15, 0.72)',
    padding: Spacing.xl,
    justifyContent: 'flex-end',
    minHeight: 220,
  },
  stayPresentEyebrow: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.accentMuted,
    letterSpacing: 1.2,
  },
  stayPresentHeadline: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.white,
    lineHeight: FontSize.lg * 1.25,
    letterSpacing: -0.3,
  },
  stayPresentSupport: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: FontSize.sm * 1.5,
  },
  stayPresentBtn: {
    backgroundColor: Colors.accentDark,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
  },
  stayPresentBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // Trending
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  trendingStar: {
    fontSize: 11,
    color: Colors.accentMuted,
    marginTop: 3,
  },
  trendingText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: FontSize.sm * 1.5,
  },

  // Recent Moments
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  memoryThumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceHigh,
  },
  memoryRowContent: {
    flex: 1,
  },
  memoryRowTitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.3,
  },
  memoryRowContext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: FontSize.sm * 1.4,
  },
  memoryRowDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  captureCtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  captureCtaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  captureCtaLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.accent,
  },

  // Empty / loading
  emptyImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
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
  emptyBtn: {
    backgroundColor: Colors.accentDark,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.white,
  },
  noChildWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingDash: {
    fontFamily: FontFamily.light,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingTop: Spacing.xxl,
  },
});
