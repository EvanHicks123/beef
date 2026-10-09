import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { session, needsOnboarding, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.salmon} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (needsOnboarding) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)/fights" />;
}
