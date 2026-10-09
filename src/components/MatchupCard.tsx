import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { FighterAvatar } from '@/components/FighterAvatar';
import type { FightWithFighters } from '@/types/database';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MatchupCardProps {
    fight: FightWithFighters;
    onPress: () => void;
}

export function MatchupCard({ fight, onPress }: MatchupCardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const isActive = fight.status === 'active';
    const isResolved = fight.status === 'resolved';

    return (
        <AnimatedPressable
            onPressIn={() => {
                scale.value = withSpring(0.97, { damping: 14, stiffness: 300 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 12, stiffness: 260 });
            }}
            onPress={onPress}
            style={[styles.card, animatedStyle]}
        >
            <View
                style={[
                    styles.statusPill,
                    isActive ? styles.statusPillActive : (isResolved ? styles.statusPillResolved : styles.statusPillPending)
                ]}
            >
                <Text
                    style={[
                        styles.statusPillText,
                        isActive ? styles.statusTextActive : (isResolved ? styles.statusTextResolved : styles.statusTextPending)
                    ]}
                >
                    {isActive ? 'ACTIVE' : (isResolved ? 'RESOLVED' : 'PENDING')}
                </Text>
            </View>

            <View style={styles.matchupRow}>
                <View style={styles.fighterSide}>
                    <FighterAvatar
                        avatarUrl={fight.challenger.avatar_url}
                        avatarColor={fight.challenger.avatar_color}
                        size={40}
                    />
                    <Text style={styles.fighterName} numberOfLines={1}>
                        {fight.challenger.fight_name}
                    </Text>
                </View>

                <Text style={styles.vs}>vs</Text>

                <View style={[styles.fighterSide, styles.fighterSideRight]}>
                    <Text style={[styles.fighterName, styles.fighterNameRight]} numberOfLines={1}>
                        {fight.challenged.fight_name}
                    </Text>
                    <FighterAvatar
                        avatarUrl={fight.challenged.avatar_url}
                        avatarColor={fight.challenged.avatar_color}
                        size={40}
                    />
                </View>
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    statusPill: {
        alignSelf: 'flex-start',
        borderRadius: radii.pill,
        paddingVertical: 3,
        paddingHorizontal: 9,
        marginBottom: spacing.sm,
        borderWidth: 1,
    },
    statusPillPending: {
        backgroundColor: 'rgba(255,214,10,0.08)',
        borderColor: colors.yellowDim,
    },
    statusPillActive: {
        backgroundColor: 'rgba(255,90,95,0.1)',
        borderColor: colors.salmonDim,
    },
    statusPillResolved: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderColor: 'rgba(74, 222, 128, 0.4)',
    },
    statusPillText: {
        fontFamily: fonts.bodyBold,
        fontSize: 9,
        letterSpacing: 1,
    },
    statusTextPending: {
        color: colors.yellow,
    },
    statusTextActive: {
        color: colors.salmon,
    },
    statusTextResolved: {
        color: '#4ADE80',
    },
    matchupRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fighterSide: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    fighterSideRight: {
        justifyContent: 'flex-end',
    },
    fighterName: {
        fontFamily: fonts.display,
        fontSize: 14,
        color: colors.white,
        letterSpacing: 0.5,
        flexShrink: 1,
    },
    fighterNameRight: {
        textAlign: 'right',
    },
    vs: {
        fontFamily: fonts.bodySemibold,
        fontSize: 11,
        color: colors.grey,
        marginHorizontal: spacing.sm,
    },
});