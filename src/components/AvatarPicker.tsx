import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { FighterAvatar } from '@/components/FighterAvatar';

const SWATCHES = [
  '#FF6B6B', // salmon
  '#F4D03F', // yellow
  '#4ADE80', // green
  '#60A5FA', // blue
  '#C084FC', // purple
  '#FB923C', // orange
  '#F472B6', // pink
  '#94A3B8', // slate
];

interface AvatarPickerProps {
  avatarUrl: string | null;
  avatarColor: string;
  onChange: (next: { avatarUrl: string | null; avatarColor: string }) => void;
  /** Called with a local file URI when the user picks a photo, so the parent can upload it. */
  onPickImage: (localUri: string) => Promise<void>;
  uploading?: boolean;
}

export function AvatarPicker({
  avatarUrl,
  avatarColor,
  onChange,
  onPickImage,
  uploading = false,
}: AvatarPickerProps) {
  const [mode, setMode] = useState<'default' | 'upload'>(avatarUrl ? 'upload' : 'default');

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMode('upload');
      await onPickImage(result.assets[0].uri);
    }
  };

  const handleSelectColor = (color: string) => {
    setMode('default');
    onChange({ avatarUrl: null, avatarColor: color });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>FIGHTER PHOTO</Text>

      <View style={styles.previewRow}>
        <View style={styles.previewCircle}>
          {uploading ? (
            <ActivityIndicator color={colors.salmon} />
          ) : (
            <FighterAvatar avatarUrl={avatarUrl} avatarColor={avatarColor} size={72} />
          )}
        </View>

        <View style={styles.modeButtons}>
          <Pressable
            style={[styles.modeBtn, mode === 'default' && styles.modeBtnActive]}
            onPress={() => {
              setMode('default');
              if (avatarUrl) onChange({ avatarUrl: null, avatarColor });
            }}
          >
            <Text
              style={[styles.modeBtnText, mode === 'default' && styles.modeBtnTextActive]}
            >
              DEFAULT ICON
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'upload' && styles.modeBtnActive]}
            onPress={handlePickPhoto}
            disabled={uploading}
          >
            <Text style={[styles.modeBtnText, mode === 'upload' && styles.modeBtnTextActive]}>
              UPLOAD PHOTO
            </Text>
          </Pressable>
        </View>
      </View>

      {mode === 'default' && (
        <View style={styles.swatchRow}>
          {SWATCHES.map((color) => (
            <Pressable
              key={color}
              onPress={() => handleSelectColor(color)}
              style={[
                styles.swatch,
                { backgroundColor: color },
                avatarColor === color && !avatarUrl && styles.swatchSelected,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.salmon,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  previewCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modeButtons: {
    flex: 1,
    gap: spacing.sm,
  },
  modeBtn: {
    borderWidth: 1.5,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    borderColor: colors.salmon,
    backgroundColor: colors.salmonDim,
  },
  modeBtnText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.grey,
    letterSpacing: 0.5,
  },
  modeBtnTextActive: {
    color: colors.salmon,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.white,
  },
});
