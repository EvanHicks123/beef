# Ben Fight

MMA-broadcast-themed joke-fight app for friend groups. React Native + Expo Router + TypeScript, backed by Supabase.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL Editor (Dashboard → SQL Editor → New Query → paste → Run). This creates the `profiles`, `fights`, `votes`, `bets` tables with RLS policies and enables realtime.

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Supabase → Project Settings → API.

4. **Enable Email auth** in Supabase → Authentication → Providers (enabled by default). For local dev, you can disable "Confirm email" under Authentication → Settings to skip email verification.

5. **Seed a couple of profiles** (optional, for testing before your friend group signs up) — sign up 2+ accounts through the app itself, since `profiles` requires a matching `auth.users` row via RLS.

6. **Run**
   ```bash
   npm run ios      # or
   npm run android  # or
   npm run web
   ```

## Architecture

- **`app/`** — Expo Router file-based routes. `(auth)` group = login/onboarding, `(tabs)` group = the two-tab main app (mounted manually inside `(tabs)/_layout.tsx` rather than Expo Router's built-in tab navigator, to match the custom floating pill nav spec).
- **`src/context/AuthContext.tsx`** — session + profile state, sign in/up/out, onboarding completion.
- **`src/context/FightsContext.tsx`** — fights/votes/bets data layer with Supabase Realtime subscriptions. Auto-vetoes a fight once "show mercy" votes reach 50% of the group.
- **`src/lib/odds.ts`** — betting odds calculator. Derives a "power score" per fighter from win rate, experience (fight count), height, and weight, then converts the probability split into American/decimal odds.
- **`src/components/`** — presentational pieces: `ContenderCard` (swipeable via `react-native-gesture-handler` Pan gesture), `MatchupCard` (compact feed card, doubles as the veto/grayscale variant), `ClashCard` (the full expanded betting+voting screen), `BettingHub`, `CommunityDetails`, `VetoDetailsModal`.

## Notes on the veto mechanic

There's no explicit "veto vote" — a fight moves to `vetoed` status automatically once mercy votes cross the 50% threshold (`VETO_MERCY_THRESHOLD` in `FightsContext.tsx`), so "voted yes to veto" in the details modal maps to whoever voted "mercy." Adjust the threshold or swap in an explicit veto flow if your group wants different rules.

## Things you'll likely want to add next

- Fight creation flow (the schema/context support it via `supabase.from('fights').insert(...)`, but there's no UI for challenging someone yet — worth a "NEW FIGHT" button on the Fights screen)
- Bet resolution / payout logic once a fight result is recorded (`winner_id` on `fights`, `payout` on `bets` are in the schema, unused so far)
- Avatar upload (currently falls back to a placeholder image everywhere `avatar_url` is null)
- Push notifications for new fight challenges / vote deadlines
