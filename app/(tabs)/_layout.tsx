import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { FightsProvider } from '@/context/FightsContext';
import { useAuth } from '@/context/AuthContext';
import FightsScreen from './fights';
import StatsScreen from './stats';

export default function TabsLayout() {
  const { session, needsOnboarding, loading } = useAuth();
  const [tab, setTab] = useState<'fights' | 'stats'>('fights');

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (needsOnboarding) return <Redirect href="/(auth)/onboarding" />;

  return (
    <FightsProvider>
      <View style={styles.root}>
        {tab === 'fights' ? <FightsScreen /> : <StatsScreen />}
        <BottomNav active={tab} onChange={setTab} />
      </View>
    </FightsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
