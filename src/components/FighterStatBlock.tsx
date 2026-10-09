import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { formatHeight } from '@/lib/odds';
import type { Profile } from '@/types/database';

interface FighterStatBlockProps {
  profile: Profile;
  align: 'left' | 'right';
  isUnderdog?: boolean;
}

export function FighterStatBlock({ profile, align, isUnderdog }: FighterStatBlockProps) {
  return (
    <View style={[styles.wrap, align === 'right' && styles.wrapRight]}>
      {isUnderdog && (
        <View style={[styles.underdogBadge, align === 'right' && styles.selfAlignRight]}>
          <Text style={styles.underdogText}>UNDERDOG</Text>
        </View>
      )}

      <Text style={[styles.label, align === 'right' && styles.textRight]}>
        {align === 'left' ? 'THE CHALLENGER' : 'THE DEFENDER'}
      </Text>
      <Text style={[styles.fightName, align === 'right' && styles.textRight]} numberOfLines={2}>
        '{profile.fight_name}'
      </Text>
      <Text style={[styles.realName, align === 'right' && styles.textRight]} numberOfLines={1}>
        {profile.real_name}
      </Text>

      <View style={[styles.statRow, align === 'right' && styles.statRowRight]}>
        <StatChip label="RECORD" value={`${profile.wins}-${profile.losses}`} />
        <StatChip label="HT" value={formatHeight(profile.height_in)} />
        <StatChip label="WT" value={`${profile.weight_lbs} LBS`} />
      </View>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  wrapRight: {
    alignItems: 'flex-end',
  },
  selfAlignRight: {
    alignSelf: 'flex-end',
  },
  textRight: {
    textAlign: 'right',
  },
  underdogBadge: {
    backgroundColor: colors.yellow,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  underdogText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.black,
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.salmon,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  fightName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.yellow,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  realName: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    color: colors.white,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statRowRight: {
    justifyContent: 'flex-end',
  },
  chip: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 58,
    alignItems: 'center',
  },
  chipLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 8,
    color: colors.grey,
    letterSpacing: 0.5,
  },
  chipValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.white,
    marginTop: 1,
  },
});
