import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface OnboardingInput {
  realName: string;
  fightName: string;
  heightIn: number;
  weightLbs: number;
  nationality: string;
  avatarUrl: string | null;
  avatarColor: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  uploadAvatar: (localUri: string) => Promise<{ url: string | null; error: string | null }>;
  /** Instantly updates the balance shown in the UI, ahead of the network round-trip completing. */
  applyLocalBalanceChange: (delta: number) => void;
}


const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Ben Fight] Failed to fetch profile:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      if (!session?.user) return { error: 'Not authenticated' };

      const { error } = await supabase.from('profiles').insert<{
        id: string;
        real_name: string;
        fight_name: string;
        height_in: number;
        weight_lbs: number;
        nationality: string;
        avatar_url: string | null;
        avatar_color: string;
      }>({
        id: session.user.id,
        real_name: input.realName,
        fight_name: input.fightName,
        height_in: input.heightIn,
        weight_lbs: input.weightLbs,
        nationality: input.nationality,
        avatar_url: input.avatarUrl,
        avatar_color: input.avatarColor,
      });

      if (error) return { error: error.message };
      await fetchProfile(session.user.id);
      return { error: null };
    },
    [session, fetchProfile]
  );

  // Uploads a local image file (from expo-image-picker) to Supabase Storage
  // under avatars/{userId}/... and returns a public URL. Doesn't touch the
  // profile row — callers decide when to persist the URL.
  const uploadAvatar = useCallback(
    async (localUri: string) => {
      if (!session?.user) return { url: null, error: 'Not authenticated' };

      try {
        const response = await fetch(localUri);
        const blob = await response.blob();

        // Determine the correct MIME type and extension from the blob
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) return { url: null, error: uploadError.message };

        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        return { url: data.publicUrl, error: null };
      } catch (err) {
        return { url: null, error: err instanceof Error ? err.message : 'Upload failed' };
      }
    },
    [session]
  );

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const applyLocalBalanceChange = useCallback((delta: number) => {
    setProfile((prev) => (prev ? { ...prev, balance: prev.balance + delta } : prev));
  }, []);

  const needsOnboarding = Boolean(session?.user) && !loading && profile === null;

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        needsOnboarding,
        signUp,
        signIn,
        signOut,
        completeOnboarding,
        refreshProfile,
        uploadAvatar,
        applyLocalBalanceChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
