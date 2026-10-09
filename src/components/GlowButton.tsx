import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, radii, shadows } from '@/lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'salmon' | 'yellow' | 'ghost' | 'mercy';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
  /** Shows a checkmark and a bright border to indicate this option is the current selection. */
  active?: boolean;
}

export function GlowButton({
  label,
  onPress,
  variant = 'salmon',
  disabled = false,
  style,
  size = 'md',
  active = false,
}: GlowButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), []);

  const variantStyle = {
    salmon: { backgroundColor: colors.salmon, ...shadows.salmonGlow },
    yellow: { backgroundColor: colors.yellow, ...shadows.yellowGlow },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.yellow,
    },
    mercy: {
      backgroundColor: colors.mercy,
      borderWidth: 1,
      borderColor: colors.greyDark,
    },
  }[variant];

  const textColor = variant === 'ghost' ? colors.yellow : variant === 'mercy' ? colors.offWhite : colors.black;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 12, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 260 });
      }}
      onPress={onPress}
      style={[
        styles.base,
        size === 'lg' && styles.lg,
        variantStyle,
        active && styles.active,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.labelRow}>
        {active && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkBadgeText}>✓</Text>
          </View>
        )}
        <Text
          style={[
            styles.label,
            { color: textColor },
            size === 'lg' && styles.labelLg,
          ]}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    borderWidth: 3,
    borderColor: colors.white,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.black,
  },
  lg: {
    paddingVertical: 18,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 1,
  },
  labelLg: {
    fontSize: 20,
  },
});