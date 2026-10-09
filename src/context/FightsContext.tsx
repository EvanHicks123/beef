import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Fight, FightWithFighters, Profile, VoteChoice } from '@/types/database';

interface FightsContextValue {
    pendingFights: FightWithFighters[];
    activeFights: FightWithFighters[];
    pastFights: FightWithFighters[];
    allProfiles: Profile[];
    loading: boolean;
    refresh: () => Promise<void>;
    castVote: (fightId: string, choice: VoteChoice) => Promise<{ error: string | null }>;
    createFight: (challengedId: string, reason: string) => Promise<{ error: string | null }>;
    placeBet: (
        fightId: string,
        fighterId: string,
        amount: number,
        decimalOdds: number
    ) => Promise<{ error: string | null }>;
    getVetoVoters: (fightId: string) => Promise<{ yes: Profile[]; no: Profile[] }>;
}

const FightsContext = createContext<FightsContextValue | undefined>(undefined);

const VETO_MERCY_THRESHOLD = 0.5;
const AUTHORIZE_THRESHOLD = 0.5;

type VoteEntry = { voter_id: string; choice: VoteChoice };
type BetEntry = { bettor_id: string; fighter_id: string; amount: number; odds_at_bet: number; is_claimed: boolean };

export function FightsProvider({ children }: { children: React.ReactNode }) {
    const { session, applyLocalBalanceChange } = useAuth();
    const [rawFights, setRawFights] = useState<Fight[]>([]);
    const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
    const [votesByFight, setVotesByFight] = useState<Record<string, VoteEntry[]>>({});
    const [betsByFight, setBetsByFight] = useState<Record<string, BetEntry[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        const [{ data: fightsData }, { data: profilesData }, { data: votesData }, { data: betsData }] =
            await Promise.all([
                supabase
                    .from('fights')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .returns<Fight[]>(),
                supabase.from('profiles').select('*').returns<Profile[]>(),
                supabase
                    .from('votes')
                    .select('fight_id, voter_id, choice')
                    .returns<{ fight_id: string; voter_id: string; choice: VoteChoice }[]>(),
                supabase
                    .from('bets')
                    .select('fight_id, bettor_id, fighter_id, amount, odds_at_bet, is_claimed')
                    .returns<{ fight_id: string; bettor_id: string; fighter_id: string; amount: number; odds_at_bet: number; is_claimed: boolean }[]>(),
            ]);

        setRawFights((fightsData as Fight[]) ?? []);

        const byId: Record<string, Profile> = {};
        for (const p of (profilesData as Profile[]) ?? []) byId[p.id] = p;
        setProfilesById(byId);

        const votesGrouped: Record<string, VoteEntry[]> = {};
        for (const v of votesData ?? []) {
            (votesGrouped[v.fight_id] ??= []).push({ voter_id: v.voter_id, choice: v.choice });
        }
        setVotesByFight(votesGrouped);

        const betsGrouped: Record<string, BetEntry[]> = {};
        for (const b of betsData ?? []) {
            (betsGrouped[b.fight_id] ??= []).push({
                bettor_id: b.bettor_id,
                fighter_id: b.fighter_id,
                amount: b.amount,
                odds_at_bet: b.odds_at_bet,
                is_claimed: b.is_claimed,
            });
        }
        setBetsByFight(betsGrouped);

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAll();

        const channel = supabase
            .channel('ben-fight-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fights' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAll)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAll]);

    const hydrated: FightWithFighters[] = useMemo(() => {
        return rawFights
            .map((f) => {
                const challenger = profilesById[f.challenger_id];
                const challenged = profilesById[f.challenged_id];
                if (!challenger || !challenged) return null;

                const votes = votesByFight[f.id] ?? [];
                const eligibleVotes = votes.filter(
                    (v) => v.voter_id !== f.challenger_id && v.voter_id !== f.challenged_id
                );
                const authorize_count = eligibleVotes.filter((v) => v.choice === 'authorize').length;
                const mercy_count = eligibleVotes.filter((v) => v.choice === 'mercy').length;
                const eligible_voter_count = Object.keys(profilesById).filter(
                    (id) => id !== f.challenger_id && id !== f.challenged_id
                ).length;
                const my_vote = votes.find((v) => v.voter_id === session?.user?.id)?.choice ?? null;

                const bets = betsByFight[f.id] ?? [];
                const myBetRaw = bets.find((b) => b.bettor_id === session?.user?.id);
                const my_bet = myBetRaw
                    ? {
                        fighter_id: myBetRaw.fighter_id,
                        amount: myBetRaw.amount,
                        odds_at_bet: myBetRaw.odds_at_bet,
                        is_claimed: myBetRaw.is_claimed
                    }
                    : null;

                const bettorTotals: Record<string, { fighter_id: string; amount: number }> = {};
                for (const b of bets) {
                    const existing = bettorTotals[b.bettor_id];
                    bettorTotals[b.bettor_id] = {
                        fighter_id: b.fighter_id,
                        amount: (existing?.amount ?? 0) + b.amount,
                    };
                }
                const top_bettors = Object.entries(bettorTotals)
                    .map(([bettorId, v]) => ({
                        profile: profilesById[bettorId],
                        amount: v.amount,
                        fighter_id: v.fighter_id,
                    }))
                    .filter((x) => Boolean(x.profile))
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5);

                const result: FightWithFighters = {
                    ...f,
                    challenger,
                    challenged,
                    authorize_count,
                    mercy_count,
                    eligible_voter_count,
                    my_vote,
                    my_bet: my_bet as any,
                    top_bettors,
                };
                return result;
            })
            .filter((f): f is FightWithFighters => f !== null);
    }, [rawFights, profilesById, votesByFight, betsByFight, session?.user?.id]);

    const pendingFights = useMemo(() => hydrated.filter((f) => f.status === 'pending'), [hydrated]);
    const activeFights = useMemo(() => hydrated.filter((f) => f.status === 'active'), [hydrated]);
    const pastFights = useMemo(() => hydrated.filter((f) => f.status === 'resolved'), [hydrated]);
    const allProfiles = useMemo(() => Object.values(profilesById), [profilesById]);

    const castVote = useCallback(
        async (fightId: string, choice: VoteChoice) => {
            if (!session?.user) return { error: 'Not authenticated' };
            const voterId = session.user.id;

            const fight = rawFights.find((f) => f.id === fightId);
            if (fight && (voterId === fight.challenger_id || voterId === fight.challenged_id)) {
                return { error: "You can't vote on your own fight" };
            }

            setVotesByFight((prev) => {
                const existing = prev[fightId] ?? [];
                const withoutMine = existing.filter((v) => v.voter_id !== voterId);
                return { ...prev, [fightId]: [...withoutMine, { voter_id: voterId, choice }] };
            });

            const { error } = await supabase
                .from('votes')
                .upsert<{ fight_id: string; voter_id: string; choice: VoteChoice }>(
                    { fight_id: fightId, voter_id: voterId, choice },
                    { onConflict: 'fight_id,voter_id' }
                );
            if (error) {
                await fetchAll();
                return { error: error.message };
            }

            const { data: freshVotes } = await supabase
                .from('votes')
                .select('voter_id, choice')
                .eq('fight_id', fightId)
                .returns<{ voter_id: string; choice: VoteChoice }[]>();

            const eligibleVotes = (freshVotes ?? []).filter(
                (v) => !fight || (v.voter_id !== fight.challenger_id && v.voter_id !== fight.challenged_id)
            );
            const eligibleVoterCount = fight
                ? Object.keys(profilesById).filter(
                    (id) => id !== fight.challenger_id && id !== fight.challenged_id
                ).length
                : Object.keys(profilesById).length;
            const totalGroupSize = eligibleVoterCount || 1;
            const mercyCount = eligibleVotes.filter((v) => v.choice === 'mercy').length;
            const authorizeCount = eligibleVotes.filter((v) => v.choice === 'authorize').length;

            if (fight?.status === 'pending' && mercyCount / totalGroupSize >= VETO_MERCY_THRESHOLD) {
                setRawFights((prev) => prev.map((f) => (f.id === fightId ? { ...f, status: 'vetoed' } : f)));
                await supabase.from('fights').update({ status: 'vetoed' }).eq('id', fightId);
            } else if (
                fight?.status === 'pending' &&
                authorizeCount / totalGroupSize >= AUTHORIZE_THRESHOLD
            ) {
                setRawFights((prev) => prev.map((f) => (f.id === fightId ? { ...f, status: 'active' } : f)));
                await supabase.from('fights').update({ status: 'active' }).eq('id', fightId);
            }

            fetchAll();
            return { error: null };
        },
        [session, profilesById, rawFights, fetchAll]
    );

    const createFight = useCallback(
        async (challengedId: string, reason: string) => {
            if (!session?.user) return { error: 'Not authenticated' };
            if (session.user.id === challengedId) return { error: "You can't fight yourself" };
            if (!reason.trim()) return { error: 'Give a reason for the fight' };

            const { error: fightError } = await supabase.from('fights').insert<{
                challenger_id: string;
                challenged_id: string;
                reason: string;
            }>({
                challenger_id: session.user.id,
                challenged_id: challengedId,
                reason: reason.trim(),
            });
            if (fightError) return { error: fightError.message };

            const myProfile = profilesById[session.user.id];
            if (myProfile) {
                await supabase
                    .from('profiles')
                    .update<{ fights_demanded: number }>({ fights_demanded: myProfile.fights_demanded + 1 })
                    .eq('id', session.user.id);
            }

            await fetchAll();
            return { error: null };
        },
        [session, profilesById, fetchAll]
    );

    const placeBet = useCallback(
        async (fightId: string, fighterId: string, amount: number, decimalOdds: number) => {
            if (!session?.user) return { error: 'Not authenticated' };
            if (amount <= 0) return { error: 'Bet must be greater than $0' };

            const bettorId = session.user.id;
            const myProfile = profilesById[bettorId];
            if (myProfile && amount > myProfile.balance) return { error: 'Insufficient balance' };

            const existingBet = (betsByFight[fightId] ?? []).find((b) => b.bettor_id === bettorId);
            if (existingBet) return { error: 'You already placed a bet on this fight' };

            setBetsByFight((prev) => {
                const existing = prev[fightId] ?? [];
                return {
                    ...prev,
                    [fightId]: [...existing, { bettor_id: bettorId, fighter_id: fighterId, amount, odds_at_bet: decimalOdds, is_claimed: false }],
                };
            });
            setProfilesById((prev) => {
                const p = prev[bettorId];
                if (!p) return prev;
                return { ...prev, [bettorId]: { ...p, balance: p.balance - amount } };
            });
            applyLocalBalanceChange(-amount);

            const { error: betError } = await supabase.from('bets').insert<{
                fight_id: string;
                bettor_id: string;
                fighter_id: string;
                amount: number;
                odds_at_bet: number;
                is_claimed: boolean;
            }>({
                fight_id: fightId,
                bettor_id: bettorId,
                fighter_id: fighterId,
                amount,
                odds_at_bet: decimalOdds,
                is_claimed: false,
            });
            if (betError) {
                applyLocalBalanceChange(amount);
                await fetchAll();
                return { error: betError.message };
            }

            if (myProfile) {
                const { error: balanceError } = await supabase
                    .from('profiles')
                    .update<{ balance: number }>({ balance: myProfile.balance - amount })
                    .eq('id', bettorId);
                if (balanceError) return { error: balanceError.message };
            }

            fetchAll();
            return { error: null };
        },
        [session, profilesById, betsByFight, fetchAll, applyLocalBalanceChange]
    );

    const getVetoVoters = useCallback(
        async (fightId: string) => {
            const { data } = await supabase
                .from('votes')
                .select('voter_id, choice')
                .eq('fight_id', fightId)
                .returns<{ voter_id: string; choice: VoteChoice }[]>();

            const yes = (data ?? [])
                .filter((v) => v.choice === 'mercy')
                .map((v) => profilesById[v.voter_id])
                .filter((p): p is Profile => Boolean(p));

            const no = (data ?? [])
                .filter((v) => v.choice === 'authorize')
                .map((v) => profilesById[v.voter_id])
                .filter((p): p is Profile => Boolean(p));

            return { yes, no };
        },
        [profilesById]
    );

    return (
        <FightsContext.Provider
            value={{ pendingFights, activeFights, pastFights, allProfiles, loading, refresh: fetchAll, castVote, createFight, placeBet, getVetoVoters }}
        >
            {children}
        </FightsContext.Provider>
    );
}

export function useFights() {
    const ctx = useContext(FightsContext);
    if (!ctx) throw new Error('useFights must be used within FightsProvider');
    return ctx;
}