import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Circle } from 'react-native-svg';
import { radii } from '@/lib/theme';

interface FighterAvatarProps {
  avatarUrl: string | null;
  avatarColor: string;
  size: number;
  style?: object;
}

export function FighterAvatar({ avatarUrl, avatarColor, size, style }: FighterAvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[{ width: size, height: size, borderRadius: radii.sm }, style]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.silhouetteWrap,
        { width: size, height: size, borderRadius: radii.sm, backgroundColor: darken(avatarColor) },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Head */}
        <Circle cx="50" cy="38" r="18" fill={avatarColor} />
        {/* Shoulders */}
        <Path
          d="M 12 100 C 12 72 28 58 50 58 C 72 58 88 72 88 100 Z"
          fill={avatarColor}
        />
      </Svg>
    </View>
  );
}

// Darkens a hex color slightly to use as the background behind the silhouette,
// so the icon itself reads clearly against it.
function darken(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#1A1A1D';
  const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - 60);
  const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - 60);
  const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - 60);
  return `rgb(${r}, ${g}, ${b})`;
}

const styles = StyleSheet.create({
  silhouetteWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
