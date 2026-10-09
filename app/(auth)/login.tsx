import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '@/lib/theme';
import { FormInput } from '@/components/FormInput';
import { GlowButton } from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { session, needsOnboarding, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session && !needsOnboarding) return <Redirect href="/(tabs)/fights" />;
  if (session && needsOnboarding) return <Redirect href="/(auth)/onboarding" />;

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter both email and password.');
      return;
    }
    setSubmitting(true);
    const { error } =
      mode === 'signin' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);

    if (error) {
      Alert.alert(mode === 'signin' ? 'Sign in failed' : 'Sign up failed', error);
      return;
    }

    if (mode === 'signup') {
      Alert.alert(
        'Check your inbox',
        'Confirm your email if required, then finish your fighter profile.'
      );
    }
    router.replace('/(auth)/onboarding');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>BEN FIGHT</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin' ? 'ENTER THE ARENA' : 'JOIN THE ROSTER'}
        </Text>

        <View style={styles.form}>
          <FormInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <FormInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <GlowButton
            label={mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            variant="salmon"
            size="lg"
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submitBtn}
          />

          <Text
            style={styles.switchModeText}
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already fighting? Sign in'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.salmon,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    marginTop: spacing.xs,
  },
  form: {
    marginTop: spacing.lg,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  switchModeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.grey,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
