import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { calculateOdds } from '@/lib/odds';
import { BettingHub } from '@/components/BettingHub';
import { CommunityDetails } from '@/components/CommunityDetails';
import { GlowButton } from '@/components/GlowButton';
import { useFights } from '@/context/FightsContext';
import { useAuth } from '@/context/AuthContext';
import type { FightWithFighters, VoteChoice } from '@/types/database';
import { supabase } from "@/lib/supabase";

interface ClashCardProps {
    fight: FightWithFighters;
    onClose: () => void;
}

function StatTableRow({ label, left, right, isLast }: { label: string; left: string; right: string; isLast?: boolean }) {
    return (
        <View style={[styles.statRow, !isLast && styles.statRowBorder]}>
            <Text style={styles.statRowValue}>{left}</Text>
            <Text style={styles.statRowLabel}>{label}</Text>
            <Text style={[styles.statRowValue, styles.statRowValueRight]}>{right}</Text>
        </View>
    );
}

function CloseButton({ onPress }: { onPress: () => void }) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.88, { damping: 14, stiffness: 350 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 300 }); }}
                onPress={onPress}
                style={styles.closeBtn}
                hitSlop={8}
            >
                <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
        </Animated.View>
    );
}

export function ClashCard({ fight, onClose }: ClashCardProps) {
    const insets = useSafeAreaInsets();
    const { castVote, placeBet, refresh } = useFights();
    const { profile, refreshProfile } = useAuth();
    const is_judge = profile?.is_judge;

    const declareWinner = async (winnerId: string) => {
        try {
            const {error: dbError} = await supabase.rpc('resolve_fight', {
                p_fight_id: fight.id,
                p_winner_id: winnerId
            });

            if(dbError){
                Alert.alert('Error', dbError.message);
            } else{
                Alert.alert('Success', 'The fight has been resolved!');
                onClose();
            }
        } catch (err) {
            Alert.alert('Code Crash', String(err));
        }
    }

    const claimWinnings = async () => {
        if (!profile?.id) return;
        console.log("🚀 ATTEMPTING TO CLAIM WINNINGS...");

        try {
            const { error: dbError } = await supabase.rpc('claim_winnings', {
                p_fight_id: fight.id,
                p_user_id: profile.id
            });

            if (dbError) {
                console.error("❌ SUPABASE REJECTED IT:", dbError.message);
                Alert.alert('Hold up!', dbError.message);
                if (typeof window !== 'undefined') window.alert(`Error: ${dbError.message}`);
            } else {
                console.log("✅ CLAIM SUCCESSFUL!");
                await Promise.all([refreshProfile(), refresh()]);
                Alert.alert('Cha-Ching! 🤑', 'Your winnings have been deposited!');
                if (typeof window !== 'undefined') window.alert('Cha-Ching! 🤑 Your winnings have been deposited!');
            }
        } catch (err) {
            console.error("❌ FATAL CRASH:", err);
            Alert.alert('Code Crash', String(err));
        }
    };

    const isParticipant = profile?.id === fight.challenger.id || profile?.id === fight.challenged.id;

    const odds = useMemo(
        () => calculateOdds(fight.challenger, fight.challenged),
        [fight.challenger, fight.challenged]
    );

    const handleVote = async (choice: VoteChoice) => {
        if (isParticipant) return;
        const { error } = await castVote(fight.id, choice);
        if (error) Alert.alert('Vote failed', error);
    };

    return (
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
            <View style={[styles.navBar, { paddingTop: insets.top + spacing.sm }]}>
                <Text style={styles.headerTitle}>BEN FIGHT</Text>
                <View style={styles.navRight}>
                    <View style={styles.balancePill}>
                        <Text style={styles.balanceLabel}>BALANCE</Text>
                        <Text style={styles.balanceValue}>${(profile?.balance ?? 0).toFixed(2)}</Text>
                    </View>
                    <CloseButton onPress={onClose} />
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: insets.bottom + 140 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.namesRow}>
                    <View style={styles.nameCol}>
                        <Text style={styles.roleLabel}>CHALLENGER</Text>
                        <Text style={[styles.fighterName, { color: colors.salmon }]} numberOfLines={1}>
                            '{fight.challenger.fight_name}'
                        </Text>
                        <Text style={styles.realName} numberOfLines={1}>{fight.challenger.real_name}</Text>
                        {odds.challenger.isUnderdog && (
                            <View style={styles.underdogTag}>
                                <Text style={styles.underdogTagText}>UNDERDOG</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.vsBadge}>
                        <Text style={styles.vsBadgeText}>VS</Text>
                    </View>

                    <View style={[styles.nameCol, styles.nameColRight]}>
                        <Text style={styles.roleLabel}>DEFENDER</Text>
                        <Text style={[styles.fighterName, { color: colors.salmon }]} numberOfLines={1}>
                            '{fight.challenged.fight_name}'
                        </Text>
                        <Text style={styles.realName} numberOfLines={1}>{fight.challenged.real_name}</Text>
                        {odds.challenged.isUnderdog && (
                            <View style={[styles.underdogTag, styles.underdogTagRight]}>
                                <Text style={styles.underdogTagText}>UNDERDOG</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.statTable}>
                    <StatTableRow
                        label="RECORD"
                        left={`${fight.challenger.wins}-${fight.challenger.losses}`}
                        right={`${fight.challenged.wins}-${fight.challenged.losses}`}
                    />
                    <StatTableRow
                        label="HEIGHT"
                        left={`${Math.floor(fight.challenger.height_in / 12)}'${fight.challenger.height_in % 12}"`}
                        right={`${Math.floor(fight.challenged.height_in / 12)}'${fight.challenged.height_in % 12}"`}
                    />
                    <StatTableRow
                        label="WEIGHT"
                        left={`${fight.challenger.weight_lbs} lbs`}
                        right={`${fight.challenged.weight_lbs} lbs`}
                        isLast
                    />
                </View>

                {fight.reason ? (
                    <Text style={styles.reasonLine} numberOfLines={1}>"{fight.reason}"</Text>
                ) : null}

                {fight.status !== 'resolved' && (
                    <View style={[styles.statusBanner, fight.status === 'active' ? styles.statusBannerActive : styles.statusBannerPending]}>
                        <Text style={[styles.statusBannerText, fight.status === 'active' ? styles.statusBannerTextActive : styles.statusBannerTextPending]}>
                            {fight.status === 'active' ? '⚔ AUTHORIZED — BETTING OPEN' : '⏳ AWAITING GROUP VOTE'}
                        </Text>
                    </View>
                )}

                {fight.status === 'active' && (
                    <BettingHub
                        odds={odds}
                        challenger={fight.challenger}
                        challenged={fight.challenged}
                        balance={profile?.balance ?? 0}
                        myBet={fight.my_bet}
                        onPlaceBet={(fighterId, amount, decimalOdds) => placeBet(fight.id, fighterId, amount, decimalOdds)}
                    />
                )}

                {fight.status === 'pending' &&
                    (isParticipant ? (
                        <View style={styles.spectatorNotice}>
                            <Text style={styles.spectatorNoticeText}>You're in this fight — your friends decide, not you.</Text>
                        </View>
                    ) : (
                        <View style={styles.votingHub}>
                            <GlowButton label="VOTE: AUTHORIZE COMBAT" variant="salmon" size="lg" active={fight.my_vote === 'authorize'} onPress={() => handleVote('authorize')} style={fight.my_vote === 'mercy' ? styles.dimmedOption : undefined} />
                            <GlowButton label="VOTE: SHOW MERCY" variant="mercy" size="lg" active={fight.my_vote === 'mercy'} onPress={() => handleVote('mercy')} style={[styles.mercyBtn, fight.my_vote === 'authorize' ? styles.dimmedOption : undefined]} />
                        </View>
                    ))}

                {fight.status === 'resolved' && (
                    <View style={styles.resolvedContainer}>
                        <Text style={styles.winnerText}>
                            WINNER: {fight.winner_id === fight.challenger.id ? fight.challenger.fight_name : fight.challenged.fight_name} 🏆
                        </Text>

                        {fight.my_bet ? (
                            fight.my_bet.fighter_id === fight.winner_id ? (
                                <View style={styles.winBox}>
                                    <Text style={styles.winMessage}>You bet correctly! 🤑</Text>

                                    <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>WAGER</Text>
                                            <Text style={styles.statValue}>${fight.my_bet.amount.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>PAYOUT</Text>
                                            <Text style={[styles.statValue, { color: '#4ADE80' }]}>
                                                ${(fight.my_bet.amount * ((fight.my_bet as any).odds_at_bet || 1)).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>PROFIT</Text>
                                            <Text style={[styles.statValue, { color: '#4ADE80' }]}>
                                                +{((((fight.my_bet as any).odds_at_bet || 1) - 1) * 100).toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>

                                    <Pressable
                                        disabled={(fight.my_bet as any).is_claimed}
                                        style={({ pressed }) => [
                                            styles.claimBtn,
                                            (fight.my_bet as any).is_claimed && { borderColor: colors.greyDark, backgroundColor: 'transparent' },
                                            pressed && !(fight.my_bet as any).is_claimed && { opacity: 0.5, backgroundColor: 'rgba(255, 214, 10, 0.2)' }
                                        ]}
                                        onPress={claimWinnings}
                                    >
                                        <Text style={[
                                            styles.claimBtnText,
                                            (fight.my_bet as any).is_claimed && { color: colors.grey }
                                        ]}>
                                            {(fight.my_bet as any).is_claimed ? 'WINNINGS CLAIMED' : 'CLAIM WINNINGS'}
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.lossBox}>
                                    <Text style={styles.lossMessage}>You bet on the wrong fighter. Your money is gone! 🪦</Text>
                                </View>
                            )
                        ) : (
                            <View style={styles.spectatorBox}>
                                <Text style={styles.spectatorMessage}>You didn't place a bet on this fight.</Text>
                            </View>
                        )}
                    </View>
                )}

                {is_judge && fight.status === 'active' && (
                    <View style={styles.judgePanel}>
                        <Text style={styles.judgeHeader}>JUDGE CONTROLS: DECLARE WINNER</Text>
                        <View style={styles.judgeButtonRow}>
                            <Pressable style={({ pressed }) => [styles.judgeBtn, pressed && { opacity: 0.5, backgroundColor: 'rgba(255, 107, 107, 0.3)' }]} onPress={() => declareWinner(fight.challenger.id)}>
                                <Text style={styles.judgeBtnText}>{fight.challenger.fight_name} Wins</Text>
                            </Pressable>
                            <Pressable style={({ pressed }) => [styles.judgeBtn, pressed && { opacity: 0.5, backgroundColor: 'rgba(255, 107, 107, 0.3)' }]} onPress={() => declareWinner(fight.challenged.id)}>
                                <Text style={styles.judgeBtnText}>{fight.challenged.fight_name} Wins</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                <CommunityDetails fight={fight} />
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg, zIndex: 100 },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.bgCardBorder,
    },
    headerTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.salmon, letterSpacing: 1 },
    navRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    balancePill: { borderWidth: 1, borderColor: colors.greyDark, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    balanceLabel: { fontFamily: fonts.bodySemibold, fontSize: 9, color: colors.grey, letterSpacing: 0.8 },
    balanceValue: { fontFamily: fonts.display, fontSize: 16, color: colors.yellow },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.grey },
    scroll: { flex: 1, paddingHorizontal: spacing.lg },
    namesRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
    nameCol: { flex: 1 },
    nameColRight: { alignItems: 'flex-end' },
    roleLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.grey, letterSpacing: 1, marginBottom: 4 },
    fighterName: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 0.5 },
    realName: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.offWhite, marginTop: 2 },
    underdogTag: {
        alignSelf: 'flex-start',
        backgroundColor: colors.yellow,
        borderRadius: radii.pill,
        paddingVertical: 3,
        paddingHorizontal: 9,
        marginTop: 8,
    },
    underdogTagRight: { alignSelf: 'flex-end' },
    underdogTagText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.bg, letterSpacing: 0.8 },
    vsBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.bg,
        borderWidth: 2,
        borderColor: colors.salmon,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginHorizontal: spacing.md,
    },
    vsBadgeText: { fontFamily: fonts.display, fontSize: 13, color: colors.white, letterSpacing: 0.5 },
    statTable: {
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    statRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.bgCardBorder },
    statRowLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 10, color: colors.grey, letterSpacing: 1 },
    statRowValue: { flex: 1, fontFamily: fonts.display, fontSize: 16, color: colors.white },
    statRowValueRight: { textAlign: 'right' },
    reasonLine: {
        fontFamily: fonts.bodyMedium,
        fontSize: 12,
        color: colors.grey,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    votingHub: { gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.lg },
    statusBanner: { borderRadius: radii.md, borderWidth: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center', marginBottom: spacing.lg },
    statusBannerPending: { backgroundColor: 'rgba(255,214,10,0.08)', borderColor: colors.yellowDim },
    statusBannerActive: { backgroundColor: 'rgba(255,90,95,0.1)', borderColor: colors.salmonDim },
    statusBannerText: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1 },
    statusBannerTextPending: { color: colors.yellow },
    statusBannerTextActive: { color: colors.salmon },
    mercyBtn: { borderColor: colors.greyDark },
    dimmedOption: { opacity: 0.45 },
    spectatorNotice: { marginTop: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.bgCardBorder, borderRadius: radii.md, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, alignItems: 'center' },
    spectatorNoticeText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.grey, textAlign: 'center' },
    judgePanel: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.bgCardBorder },
    judgeHeader: { fontFamily: fonts.display, fontSize: 12, color: colors.salmon, letterSpacing: 1, textAlign: 'center', marginBottom: spacing.md },
    judgeButtonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
    judgeBtn: { flex: 1, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderWidth: 1, borderColor: colors.salmon, paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center' },
    judgeBtnText: { fontFamily: fonts.bodySemibold, color: colors.salmon, fontSize: 14 },
    resolvedContainer: { marginTop: spacing.xl, alignItems: 'center', paddingHorizontal: spacing.md },
    winnerText: { fontFamily: fonts.display, fontSize: 24, color: colors.white, marginBottom: spacing.lg, textAlign: 'center' },
    winBox: { alignItems: 'center', width: '100%', padding: spacing.md, borderWidth: 1, borderColor: colors.yellowDim, backgroundColor: 'rgba(255, 214, 10, 0.05)', borderRadius: radii.md },
    winMessage: { fontFamily: fonts.bodySemibold, color: colors.yellow, fontSize: 14, marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', padding: spacing.md, borderRadius: radii.sm, marginBottom: spacing.md },
    statItem: { alignItems: 'center' },
    statLabel: { fontFamily: fonts.bodySemibold, fontSize: 10, color: colors.grey, letterSpacing: 1, marginBottom: 4 },
    statValue: { fontFamily: fonts.display, fontSize: 16, color: colors.white },
    claimBtn: { width: '100%', backgroundColor: 'rgba(255, 214, 10, 0.1)', borderWidth: 1, borderColor: colors.yellow, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center' },
    claimBtnText: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 16, letterSpacing: 1 },
    lossBox: { padding: spacing.md, borderWidth: 1, borderColor: colors.greyDark, borderRadius: radii.md, width: '100%', alignItems: 'center' },
    lossMessage: { fontFamily: fonts.bodyMedium, color: colors.grey, fontSize: 14 },
    spectatorBox: { padding: spacing.md, alignItems: 'center' },
    spectatorMessage: { fontFamily: fonts.bodyMedium, color: colors.grey, fontSize: 14, fontStyle: 'italic' },
});