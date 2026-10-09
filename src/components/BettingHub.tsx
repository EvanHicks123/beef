import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { formatAmericanOdds } from '@/lib/odds';
import type { MatchupOdds } from '@/lib/odds';
import type { Profile } from '@/types/database';

interface BettingHubProps {
    odds: MatchupOdds;
    challenger: Profile;
    challenged: Profile;
    balance: number;
    myBet: { fighter_id: string; amount: number } | null;
    onPlaceBet: (fighterId: string, amount: number, decimalOdds: number) => Promise<{ error: string | null }>;
}

export function BettingHub({ odds, challenger, challenged, balance, myBet, onPlaceBet }: BettingHubProps) {
    const [selectedFighterId, setSelectedFighterId] = useState<string>(
        myBet?.fighter_id ?? challenger.id
    );
    const [wager, setWager] = useState(myBet ? String(myBet.amount) : '');
    const [focused, setFocused] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const alreadyBet = Boolean(myBet);
    const selectedOdds = selectedFighterId === challenger.id ? odds.challenger : odds.challenged;

    const handlePlaceBet = async () => {
        if (alreadyBet) return;
        const amount = parseFloat(wager);
        if (!amount || amount <= 0) {
            Alert.alert('Invalid wager', 'Enter an amount greater than $0.');
            return;
        }
        if (amount > balance) {
            Alert.alert('Insufficient balance', `You only have $${balance.toFixed(2)} available.`);
            return;
        }
        setSubmitting(true);
        const { error } = await onPlaceBet(selectedFighterId, amount, selectedOdds.decimalOdds);
        setSubmitting(false);
        if (error) {
            Alert.alert('Bet failed', error);
        } else {
            Alert.alert('Bet placed', `$${amount.toFixed(2)} on your pick. Good luck.`);
        }
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.headerRow}>
                <View style={styles.accent} />
                <Text style={styles.header}>PLACE YOUR BET</Text>
                {!alreadyBet && <Text style={styles.balanceInline}>${balance.toFixed(2)} available</Text>}
            </View>

            <View style={styles.oddsRow}>
                <OddsPicker
                    name={challenger.fight_name}
                    americanOdds={formatAmericanOdds(odds.challenger.americanOdds)}
                    selected={selectedFighterId === challenger.id}
                    isUnderdog={odds.challenger.isUnderdog}
                    onPress={() => !alreadyBet && setSelectedFighterId(challenger.id)}
                    disabled={alreadyBet}
                />
                <OddsPicker
                    name={challenged.fight_name}
                    americanOdds={formatAmericanOdds(odds.challenged.americanOdds)}
                    selected={selectedFighterId === challenged.id}
                    isUnderdog={odds.challenged.isUnderdog}
                    onPress={() => !alreadyBet && setSelectedFighterId(challenged.id)}
                    disabled={alreadyBet}
                />
            </View>

            {myBet ? (
                <View style={styles.lockedWrap}>
                    <View style={styles.lockedRow}>
                        <Text style={styles.lockedIcon}>🔒</Text>
                        <View style={styles.lockedTextCol}>
                            <Text style={styles.lockedAmount}>${myBet.amount.toFixed(2)} locked in</Text>
                            <Text style={styles.lockedSub}>One bet per fight — you're all set.</Text>
                        </View>
                    </View>
                </View>
            ) : (
                <>
                    <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
                        <Text style={styles.inputPrefix}>$</Text>
                        <TextInput
                            value={wager}
                            onChangeText={setWager}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="0.00"
                            placeholderTextColor={colors.greyDim}
                            keyboardType="decimal-pad"
                            selectionColor={colors.salmon}
                            underlineColorAndroid="transparent"
                            style={styles.input}
                        />
                    </View>
                    <Pressable
                        style={({ pressed }) => [styles.placeBetBtn, pressed && styles.placeBetBtnPressed]}
                        onPress={handlePlaceBet}
                        disabled={submitting}
                    >
                        <Text style={styles.placeBetBtnText}>{submitting ? 'PLACING…' : 'PLACE BET'}</Text>
                    </Pressable>
                </>
            )}
        </View>
    );
}

function OddsPicker({
                        name,
                        americanOdds,
                        selected,
                        isUnderdog,
                        onPress,
                        disabled,
                    }: {
    name: string;
    americanOdds: string;
    selected: boolean;
    isUnderdog: boolean;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            style={[
                styles.oddsPicker,
                selected && styles.oddsPickerSelected,
                disabled && !selected && styles.oddsPickerDisabled,
            ]}
            onPress={onPress}
            disabled={disabled && !selected}
        >
            <Text style={styles.oddsPickerName} numberOfLines={1}>
                {name}
            </Text>
            <Text style={[styles.oddsValue, { color: isUnderdog ? colors.yellow : colors.salmon }]}>
                {americanOdds}
            </Text>
            {selected && (
                <View style={styles.selectedCheckWrap}>
                    <Text style={styles.selectedCheck}>✓</Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: colors.bgCard,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.bgCardBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    accent: {
        width: 3,
        height: 14,
        backgroundColor: colors.salmon,
        marginRight: spacing.sm,
        borderRadius: 2,
    },
    header: {
        fontFamily: fonts.display,
        fontSize: 14,
        color: colors.white,
        letterSpacing: 1.5,
        flex: 1,
    },
    balanceInline: {
        fontFamily: fonts.bodySemibold,
        fontSize: 11,
        color: colors.grey,
    },
    oddsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    oddsPicker: {
        flex: 1,
        backgroundColor: colors.bgElevated,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: colors.bgCardBorder,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        position: 'relative',
    },
    oddsPickerSelected: {
        borderColor: colors.yellow,
        backgroundColor: 'rgba(255,214,10,0.06)',
    },
    oddsPickerDisabled: {
        opacity: 0.35,
    },
    oddsPickerName: {
        fontFamily: fonts.bodySemibold,
        fontSize: 12,
        color: colors.grey,
        marginBottom: 4,
    },
    oddsValue: {
        fontFamily: fonts.display,
        fontSize: 20,
    },
    selectedCheckWrap: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedCheck: {
        fontSize: 10,
        fontFamily: fonts.bodyBold,
        color: colors.bg,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: colors.bgCardBorder,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        height: 56,
    },
    inputWrapFocused: {
        borderColor: colors.salmon,
    },
    inputPrefix: {
        fontFamily: fonts.display,
        fontSize: 20,
        color: colors.grey,
        marginRight: spacing.xs,
    },
    input: {
        flex: 1,
        color: colors.white,
        fontFamily: fonts.display,
        fontSize: 20,
        height: '100%',
        ...({ outlineStyle: 'none' } as any),
    },
    placeBetBtn: {
        backgroundColor: colors.salmon,
        borderRadius: radii.md,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeBetBtnPressed: {
        opacity: 0.85,
    },
    placeBetBtnText: {
        fontFamily: fonts.display,
        fontSize: 15,
        color: colors.bg,
        letterSpacing: 1,
    },
    lockedWrap: {
        backgroundColor: colors.bgElevated,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: colors.bgCardBorder,
        borderStyle: 'dashed',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        opacity: 0.7,
    },
    lockedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    lockedIcon: {
        fontSize: 20,
    },
    lockedTextCol: {
        flex: 1,
    },
    lockedAmount: {
        fontFamily: fonts.display,
        fontSize: 16,
        color: colors.grey,
    },
    lockedSub: {
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.greyDim,
        marginTop: 2,
    },
});