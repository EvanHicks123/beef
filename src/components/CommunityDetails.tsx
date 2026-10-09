import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { FighterAvatar } from '@/components/FighterAvatar';
import type { FightWithFighters } from '@/types/database';

interface CommunityDetailsProps {
    fight: FightWithFighters;
}

export function CommunityDetails({ fight }: CommunityDetailsProps) {
    const [expanded, setExpanded] = useState(false);

    const totalVoted = fight.authorize_count + fight.mercy_count;
    const notVoted = Math.max(fight.eligible_voter_count - totalVoted, 0);

    return (
        <View style={styles.wrap}>
            <Pressable
                onPress={() => setExpanded((e) => !e)}
                style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
            >
                <Text style={styles.toggleLabel}>COMMUNITY DETAILS</Text>
                <Text style={styles.toggleChevron}>{expanded ? '▲' : '▼'}</Text>
            </Pressable>

            {expanded && (
                <View style={styles.panel}>
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>VOTES</Text>
                        <View style={styles.voteRow}>
                            <VoteStat label="AUTHORIZE" value={fight.authorize_count} color={colors.salmon} />
                            <VoteStat label="MERCY" value={fight.mercy_count} color={colors.yellow} />
                            <VoteStat label="NOT VOTED" value={notVoted} color={colors.grey} />
                        </View>
                        <Text style={styles.participationNote}>
                            {totalVoted} of {fight.eligible_voter_count} eligible friends have voted
                        </Text>
                    </View>

                    {fight.top_bettors.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>TOP BETTORS</Text>
                            {fight.top_bettors.map((b) => {
                                const pickName =
                                    b.fighter_id === fight.challenger.id
                                        ? fight.challenger.fight_name
                                        : fight.challenged.fight_name;
                                return (
                                    <View key={b.profile.id} style={styles.bettorRow}>
                                        <FighterAvatar
                                            avatarUrl={b.profile.avatar_url}
                                            avatarColor={b.profile.avatar_color}
                                            size={28}
                                        />
                                        <View style={styles.bettorNameCol}>
                                            <Text style={styles.bettorName} numberOfLines={1}>
                                                {b.profile.fight_name}
                                            </Text>
                                            <Text style={styles.bettorPick} numberOfLines={1}>
                                                on '{pickName}'
                                            </Text>
                                        </View>
                                        <Text style={styles.bettorAmount}>${b.amount.toFixed(2)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

function VoteStat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={styles.voteStat}>
            <Text style={[styles.voteStatValue, { color }]}>{value}</Text>
            <Text style={styles.voteStatLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginTop: spacing.lg,
    },
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        borderRadius: radii.pill,
        paddingVertical: spacing.sm + 2,
    },
    togglePressed: {
        backgroundColor: colors.bgElevated,
    },
    toggleLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 11,
        color: colors.grey,
        letterSpacing: 1,
    },
    toggleChevron: {
        fontSize: 9,
        color: colors.grey,
    },
    panel: {
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginTop: spacing.sm,
        gap: spacing.lg,
    },
    section: {
        gap: spacing.sm,
    },
    sectionLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 10,
        color: colors.greyDim,
        letterSpacing: 1,
    },
    voteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    voteStat: {
        alignItems: 'center',
        flex: 1,
    },
    voteStatValue: {
        fontFamily: fonts.display,
        fontSize: 22,
    },
    voteStatLabel: {
        fontFamily: fonts.bodySemibold,
        fontSize: 9,
        color: colors.grey,
        letterSpacing: 0.6,
        marginTop: 2,
    },
    participationNote: {
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.grey,
        textAlign: 'center',
    },
    bettorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    bettorNameCol: {
        flex: 1,
        flexShrink: 1,
    },
    bettorName: {
        fontFamily: fonts.bodySemibold,
        fontSize: 13,
        color: colors.white,
    },
    bettorPick: {
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.grey,
    },
    bettorAmount: {
        fontFamily: fonts.display,
        fontSize: 14,
        color: colors.yellow,
    },
});