export type FightStatus = 'pending' | 'active' | 'vetoed' | 'resolved';
export type VoteChoice = 'authorize' | 'mercy';

export interface Profile {
  id: string;
  real_name: string;
  fight_name: string;
  height_in: number;
  weight_lbs: number;
  nationality: string;
  avatar_url: string | null;
  avatar_color: string;
  balance: number;
  wins: number;
  losses: number;
  fights_demanded: number;
  fights_accepted: number;
  fights_rejected: number;
  created_at: string;
  is_judge: boolean;
}

export interface Fight {
  id: string;
  challenger_id: string;
  challenged_id: string;
  reason: string;
  status: FightStatus;
  winner_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Vote {
  id: string;
  fight_id: string;
  voter_id: string;
  choice: VoteChoice;
  created_at: string;
}

export interface Bet {
  id: string;
  fight_id: string;
  bettor_id: string;
  fighter_id: string;
  amount: number;
  odds_at_bet: number;
  payout: number | null;
  created_at: string;
  is_claimed: boolean;
}


// Joined shape used throughout the UI once we hydrate a fight with its fighters
export interface FightWithFighters extends Fight {
  challenger: Profile;
  challenged: Profile;
  eligible_voter_count: number;
  authorize_count: number;
  mercy_count: number;
  my_vote: VoteChoice | null;
  my_bet: {
      is_claimed: boolean;
      fighter_id: string; amount: number };
  top_bettors: { profile: Profile; amount: number; fighter_id: string }[];
}




