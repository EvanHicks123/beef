import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, shadows } from '@/lib/theme';

interface BottomNavProps {
  active: 'fights' | 'stats';
  onChange: (tab: 'fights' | 'stats') => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) + 8 }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <NavTab label="FIGHTS" isActive={active === 'fights'} onPress={() => onChange('fights')} />
        <NavTab label="STATS" isActive={active === 'stats'} onPress={() => onChange('stats')} />
      </View>
    </View>
  );
}

function NavTab({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withSpring(isActive ? colors.salmon : 'transparent', {
      damping: 16,
      stiffness: 180,
    }),
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabTouchArea} hitSlop={8}>
      <Animated.View style={[styles.tab, animatedStyle, isActive && shadows.salmonGlow]}>
        <Text style={[styles.tabLabel, { color: isActive ? colors.black : colors.grey }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    padding: 6,
    gap: 4,
    ...shadows.card,
  },
  tabTouchArea: {
    borderRadius: radii.pill,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 1.2,
  },
});
