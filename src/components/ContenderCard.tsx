import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { Profile } from '@/types/database';

interface ContenderCardProps {
  rank: number;
  profile: Profile;
}

type StatPage = 'record' | 'activity';

export function ContenderCard({ rank, profile }: ContenderCardProps) {
  const [page, setPage] = useState<StatPage>('record');
  const fade = useSharedValue(1);

  const togglePage = () => {
    fade.value = withTiming(0, { duration: 90 }, (finished) => {
      if (finished) {
        // no-op: JS-side state flip happens via setTimeout below to stay in sync
      }
    });
    setTimeout(() => {
      setPage((p) => (p === 'record' ? 'activity' : 'record'));
      fade.value = withTiming(1, { duration: 140 });
    }, 90);
  };

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <View style={styles.card}>
      {/* Faded background: photo if uploaded, otherwise the fighter's chosen color */}
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.bgImage} contentFit="cover" />
      ) : (
        <View style={[styles.bgImage, { backgroundColor: profile.avatar_color }]} />
      )}
      <View style={styles.bgScrim} />

      <View style={styles.content}>
        <View style={styles.identity}>
          <Text style={styles.rank}>#{rank}</Text>
          <View style={styles.nameCol}>
            <Text style={styles.fightName} numberOfLines={1}>
              '{profile.fight_name}'
            </Text>
            <Text style={styles.realName} numberOfLines={1}>
              {profile.real_name}
            </Text>
          </View>
        </View>

        <Pressable onPress={togglePage} style={styles.statToggle} hitSlop={10}>
          <Animated.View style={fadeStyle}>
            {page === 'record' ? (
              <View style={styles.statRow}>
                <Stat label="WINS" value={profile.wins} color={colors.yellow} />
                <View style={styles.statDivider} />
                <Stat label="LOSSES" value={profile.losses} color={colors.salmon} />
              </View>
            ) : (
              <View style={styles.statRow}>
                <Stat label="ACCEPTED" value={profile.fights_accepted} color={colors.win} />
                <View style={styles.statDivider} />
                <Stat label="REJECTED" value={profile.fights_rejected} color={colors.loss} />
              </View>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 76,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.22,
  },
  bgScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,11,0.55)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  rank: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.salmon,
    width: 44,
  },
  nameCol: {
    flexShrink: 1,
  },
  fightName: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.white,
    letterSpacing: 0.4,
  },
  realName: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.grey,
    marginTop: 1,
  },
  statToggle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 44,
  },
  statLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 8,
    color: colors.grey,
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 21,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});