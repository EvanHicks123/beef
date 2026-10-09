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
import { AvatarPicker } from '@/components/AvatarPicker';
import { GlowButton } from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { session, needsOnboarding, completeOnboarding, uploadAvatar } = useAuth();

  const [realName, setRealName] = useState('');
  const [fightName, setFightName] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [nationality, setNationality] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState('#FF6B6B');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!needsOnboarding) return <Redirect href="/(tabs)/fights" />;

  const handlePickImage = async (localUri: string) => {
    setAvatarUploading(true);
    const { url, error } = await uploadAvatar(localUri);
    setAvatarUploading(false);

    if (error) {
      Alert.alert('Upload failed', error);
      return;
    }
    setAvatarUrl(url);
  };

  const handleSubmit = async () => {
    const ft = parseInt(heightFt, 10);
    const inch = parseInt(heightIn || '0', 10);
    const wt = parseInt(weight, 10);

    if (!realName.trim() || !fightName.trim() || !nationality.trim()) {
      Alert.alert('Missing info', 'Fill out every field to enter the arena.');
      return;
    }
    if (!Number.isFinite(ft) || !Number.isFinite(wt) || ft <= 0 || wt <= 0) {
      Alert.alert('Invalid height/weight', 'Height and weight must be valid numbers.');
      return;
    }

    setSubmitting(true);
    const { error } = await completeOnboarding({
      realName: realName.trim(),
      fightName: fightName.trim(),
      heightIn: ft * 12 + (Number.isFinite(inch) ? inch : 0),
      weightLbs: wt,
      nationality: nationality.trim(),
      avatarUrl,
      avatarColor,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Setup failed', error);
      return;
    }
    router.replace('/(tabs)/fights');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>FIGHTER SETUP</Text>
        <Text style={styles.subtitle}>EVERY FIELD IS MANDATORY. NO EXCUSES.</Text>

        <AvatarPicker
          avatarUrl={avatarUrl}
          avatarColor={avatarColor}
          onChange={({ avatarUrl: nextUrl, avatarColor: nextColor }) => {
            setAvatarUrl(nextUrl);
            setAvatarColor(nextColor);
          }}
          onPickImage={handlePickImage}
          uploading={avatarUploading}
        />

        <FormInput label="REAL NAME" value={realName} onChangeText={setRealName} placeholder="Ben Johnson" />
        <FormInput
          label="FIGHT NAME"
          value={fightName}
          onChangeText={setFightName}
          placeholder="'The Hammer'"
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormInput
              label="HEIGHT (FT)"
              value={heightFt}
              onChangeText={setHeightFt}
              placeholder="6"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <FormInput
              label="HEIGHT (IN)"
              value={heightIn}
              onChangeText={setHeightIn}
              placeholder="1"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <FormInput
          label="WEIGHT (LBS)"
          value={weight}
          onChangeText={setWeight}
          placeholder="185"
          keyboardType="number-pad"
        />
        <FormInput
          label="NATIONALITY"
          value={nationality}
          onChangeText={setNationality}
          placeholder="USA"
        />

        <GlowButton
          label="ENTER THE ARENA"
          variant="salmon"
          size="lg"
          onPress={handleSubmit}
          disabled={submitting}
          style={styles.submitBtn}
        />
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
    fontSize: 30,
    color: colors.white,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.grey,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
});
