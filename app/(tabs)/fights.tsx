import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { useFights } from '@/context/FightsContext';
import { useAuth } from '@/context/AuthContext';
import { MatchupCard } from '@/components/MatchupCard';
import { ClashCard } from '@/components/ClashCard';
import { NewFightModal } from '@/components/NewFightModal';
import { FighterAvatar } from '@/components/FighterAvatar';

export default function FightsScreen() {
    const insets = useSafeAreaInsets();
    const { pendingFights, activeFights, pastFights, loading } = useFights();
    const { profile, signOut } = useAuth();

    const [activeClashId, setActiveClashId] = useState<string | null>(null);
    const [newFightOpen, setNewFightOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    // BEN'S FIX: Now searches pending, active, AND past fights so the modal opens!
    const activeClash =
        [...pendingFights, ...activeFights, ...pastFights].find((f) => f.id === activeClashId) ?? null;

    const handleSignOut = async () => {
        setProfileMenuOpen(false);
        await signOut();
    };

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingTop: insets.top + spacing.lg,
                    paddingBottom: insets.bottom + 140,
                    paddingHorizontal: spacing.lg,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>BEN FIGHT</Text>

                    <Pressable onPress={() => setProfileMenuOpen(true)} style={styles.profileTrigger}>
                        <FighterAvatar
                            avatarUrl={profile?.avatar_url ?? null}
                            avatarColor={profile?.avatar_color ?? colors.bgElevated}
                            size={36}
                        />
                    </Pressable>
                </View>

                <Pressable style={styles.newFightBtn} onPress={() => setNewFightOpen(true)}>
                    <Text style={styles.newFightBtnText}>+ NEW FIGHT</Text>
                </Pressable>

                {/* SECTION A: Pending — needs votes */}
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionHeader}>PENDING — VOTE TO AUTHORIZE</Text>
                </View>

                {loading && <Text style={styles.emptyText}>LOADING…</Text>}
                {!loading && pendingFights.length === 0 && (
                    <Text style={styles.emptyText}>No fights waiting on a vote.</Text>
                )}
                {pendingFights.map((fight) => (
                    <MatchupCard key={fight.id} fight={fight} onPress={() => setActiveClashId(fight.id)} />
                ))}

                {/* SECTION B: Active — open for betting */}
                <View style={[styles.sectionHeaderRow, styles.activeHeaderRow]}>
                    <View style={[styles.sectionAccent, styles.activeAccent]} />
                    <Text style={styles.sectionHeader}>ACTIVE — OPEN FOR BETTING</Text>
                </View>

                {!loading && activeFights.length === 0 && (
                    <Text style={styles.emptyText}>Nothing authorized yet.</Text>
                )}
                {activeFights.map((fight) => (
                    <MatchupCard key={fight.id} fight={fight} onPress={() => setActiveClashId(fight.id)} />
                ))}

                {/* SECTION C: Past Fights - Collect Your Earnings */}
                <View style={[styles.sectionHeaderRow, styles.activeHeaderRow]}>
                    <View style={[styles.sectionAccent, styles.pastAccent]} />
                    <Text style={styles.sectionHeader}>PAST FIGHTS - COLLECT YOUR EARNINGS</Text>
                </View>

                {!loading && pastFights.length === 0 && (
                    <Text style={styles.emptyText}>No Past Fights Yet.</Text>
                )}
                {pastFights.map((fight) => (
                    <MatchupCard key={fight.id} fight={fight} onPress={() => setActiveClashId(fight.id)} />
                ))}
            </ScrollView>

            {/* Profile dropdown */}
            <Modal
                visible={profileMenuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setProfileMenuOpen(false)}
            >
                <Pressable style={styles.menuBackdrop} onPress={() => setProfileMenuOpen(false)}>
                    <View style={[styles.profileMenu, { top: insets.top + 56 }]}>
                        <View style={styles.profileMenuHeader}>
                            <FighterAvatar
                                avatarUrl={profile?.avatar_url ?? null}
                                avatarColor={profile?.avatar_color ?? colors.bgElevated}
                                size={40}
                            />
                            <View style={styles.profileMenuNameCol}>
                                <Text style={styles.profileMenuName} numberOfLines={1}>
                                    {profile?.is_judge ? (profile?.fight_name ? `'${profile.fight_name + ' (judge)'}'` : 'Fighter') : (profile?.fight_name ? `'${profile.fight_name}'` : 'Fighter')}

                                </Text>
                                <Text style={styles.profileMenuBalance}>
                                    ${(profile?.balance ?? 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.menuDivider} />

                        <Pressable
                            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                            onPress={handleSignOut}
                        >
                            <Text style={styles.logoutLabel}>Log Out</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {activeClash && <ClashCard fight={activeClash} onClose={() => setActiveClashId(null)} />}

            <NewFightModal visible={newFightOpen} onClose={() => setNewFightOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    headerTitle: {
        fontFamily: fonts.display,
        fontSize: 18,
        color: colors.white,
        letterSpacing: 1,
    },
    profileTrigger: {
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.bgCardBorder,
        padding: 1,
    },
    newFightBtn: {
        alignSelf: 'flex-start',
        backgroundColor: colors.salmonDim,
        borderWidth: 1.5,
        borderColor: colors.salmon,
        borderRadius: radii.pill,
        paddingVertical: 8,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    newFightBtnText: {
        fontFamily: fonts.display,
        fontSize: 13,
        color: colors.salmon,
        letterSpacing: 1,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        marginTop: spacing.md,
    },
    activeHeaderRow: {
        marginTop: spacing.xxl,
    },
    sectionAccent: {
        width: 3,
        height: 16,
        backgroundColor: colors.salmon,
        marginRight: spacing.sm,
        borderRadius: 2,
    },
    activeAccent: {
        backgroundColor: colors.yellow,
    },
    pastAccent: {
        backgroundColor: '#4ADE80',
    },
    sectionHeader: {
        fontFamily: fonts.display,
        fontSize: 15,
        color: colors.white,
        letterSpacing: 1,
    },
    emptyText: {
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.grey,
        paddingVertical: spacing.md,
    },
    menuBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    profileMenu: {
        position: 'absolute',
        right: spacing.lg,
        width: 220,
        backgroundColor: colors.bgCard,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        paddingVertical: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },
    profileMenuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    profileMenuNameCol: {
        flexShrink: 1,
    },
    profileMenuName: {
        fontFamily: fonts.display,
        fontSize: 14,
        color: colors.white,
    },
    profileMenuBalance: {
        fontFamily: fonts.bodySemibold,
        fontSize: 12,
        color: colors.yellow,
        marginTop: 2,
    },
    menuDivider: {
        height: 1,
        backgroundColor: colors.bgCardBorder,
        marginVertical: spacing.xs,
    },
    menuRow: {
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
    },
    menuRowPressed: {
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    logoutLabel: {
        fontFamily: fonts.bodySemibold,
        fontSize: 14,
        color: '#ff4d4d',
    },
});