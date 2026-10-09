import type { Profile } from '@/types/database';

export interface FighterOdds {
  americanOdds: number; // e.g. -150 or +130
  decimalOdds: number; // e.g. 1.67
  impliedProbability: number; // 0..1
  isUnderdog: boolean;
}

export interface MatchupOdds {
  challenger: FighterOdds;
  challenged: FighterOdds;
}

/**
 * Computes a "power score" for a fighter from record, height, and weight.
 * This is a lighthearted heuristic, not a real sports model — the point is
 * that bigger, more experienced, more successful fighters are favored.
 */
function powerScore(p: Profile): number {
  const totalFights = p.wins + p.losses;
  const winRate = totalFights > 0 ? p.wins / totalFights : 0.5;
  const experienceBonus = Math.min(totalFights, 30) * 0.4; // caps out around 30 fights
  const sizeBonus = p.height_in * 0.5 + p.weight_lbs * 0.15;
  return winRate * 50 + experienceBonus + sizeBonus;
}

function probabilityToAmerican(prob: number): number {
  const clamped = Math.min(Math.max(prob, 0.03), 0.97);
  if (clamped >= 0.5) {
    return Math.round(-1 * (clamped / (1 - clamped)) * 100);
  }
  return Math.round(((1 - clamped) / clamped) * 100);
}

function probabilityToDecimal(prob: number): number {
  const clamped = Math.min(Math.max(prob, 0.03), 0.97);
  return Math.round((1 / clamped) * 100) / 100;
}

export function calculateOdds(challenger: Profile, challenged: Profile): MatchupOdds {
  const scoreA = powerScore(challenger);
  const scoreB = powerScore(challenged);
  const total = scoreA + scoreB || 1;

  const probA = scoreA / total;
  const probB = scoreB / total;

  return {
    challenger: {
      americanOdds: probabilityToAmerican(probA),
      decimalOdds: probabilityToDecimal(probA),
      impliedProbability: probA,
      isUnderdog: probA < probB,
    },
    challenged: {
      americanOdds: probabilityToAmerican(probB),
      decimalOdds: probabilityToDecimal(probB),
      impliedProbability: probB,
      isUnderdog: probB < probA,
    },
  };
}

export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function calculatePayout(wagerAmount: number, decimalOdds: number): number {
  return Math.round(wagerAmount * decimalOdds * 100) / 100;
}

export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}
