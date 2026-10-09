import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radii } from '@/lib/theme';
import { useFights } from '@/context/FightsContext';
import { ContenderCard } from '@/components/ContenderCard';
import type { Profile } from '@/types/database';

function HeroContent({ champion }: { champion: Profile }) {
  return (
    <View style={styles.heroContent}>
      <View style={styles.rankedBadgeRow}>
        <View style={styles.rankedBadge}>
          <Text style={styles.rankedBadgeText}>#1 RANKED</Text>
        </View>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      <Text style={styles.championNickname}>'{champion.fight_name.toUpperCase()}'</Text>
      <Text style={styles.championName}>{champion.real_name.toUpperCase()}</Text>

      <View style={styles.recordRow}>
        <View style={styles.recordBlock}>
          <Text style={styles.recordLabel}>WINS</Text>
          <Text style={[styles.recordValue, { color: colors.yellow }]}>{champion.wins}</Text>
        </View>
        <View style={styles.recordBlock}>
          <Text style={styles.recordLabel}>LOSSES</Text>
          <Text style={[styles.recordValue, { color: colors.salmon }]}>{champion.losses}</Text>
        </View>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { allProfiles, loading } = useFights();

  const ranked = useMemo(
    () => [...allProfiles].sort((a, b) => b.wins - a.wins || a.losses - b.losses),
    [allProfiles]
  );

  const champion = ranked[0];
  const contenders = ranked.slice(1);

  if (loading || !champion) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{loading ? 'LOADING…' : 'NO FIGHTERS YET'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      {champion.avatar_url ? (
        <ImageBackground
          source={{ uri: champion.avatar_url }}
          style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
          imageStyle={styles.heroImage}
        >
          <LinearGradient
            colors={['rgba(10,10,11,0.15)', 'rgba(10,10,11,0.55)', colors.bg]}
            style={StyleSheet.absoluteFill}
          />
          <HeroContent champion={champion} />
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.hero,
            styles.heroNoPhoto,
            { paddingTop: insets.top + spacing.xl, backgroundColor: champion.avatar_color },
          ]}
        >
          <LinearGradient
            colors={['rgba(10,10,11,0.05)', 'rgba(10,10,11,0.5)', colors.bg]}
            style={StyleSheet.absoluteFill}
          />
          <HeroContent champion={champion} />
        </View>
      )}

      {/* CONTENDERS */}
      <View style={styles.contendersSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionHeader}>CONTENDERS</Text>
        </View>

        {contenders.map((fighter, i) => (
          <ContenderCard key={fighter.id} rank={i + 2} profile={fighter} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.display,
    color: colors.grey,
    fontSize: 16,
    letterSpacing: 1,
  },
  hero: {
    minHeight: 380,
    justifyContent: 'flex-end',
    backgroundColor: colors.bgElevated,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroNoPhoto: {
    overflow: 'hidden',
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  rankedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rankedBadge: {
    borderWidth: 1.5,
    borderColor: colors.yellow,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
  },
  rankedBadgeText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.yellow,
    letterSpacing: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.salmon,
  },
  liveText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.offWhite,
    letterSpacing: 1,
  },
  championNickname: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.white,
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  championName: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.salmon,
    letterSpacing: 0.5,
    lineHeight: 34,
    marginBottom: spacing.lg,
  },
  recordRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  recordBlock: {
    backgroundColor: 'rgba(21,21,23,0.85)',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  recordLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.grey,
    letterSpacing: 1,
    marginBottom: 2,
  },
  recordValue: {
    fontFamily: fonts.display,
    fontSize: 30,
  },
  contendersSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    backgroundColor: colors.salmon,
    marginRight: spacing.sm,
    borderRadius: 2,
  },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.white,
    letterSpacing: 1,
  },
});
