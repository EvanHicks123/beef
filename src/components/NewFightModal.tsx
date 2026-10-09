import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { GlowButton } from '@/components/GlowButton';
import { FighterAvatar } from '@/components/FighterAvatar';
import { useFights } from '@/context/FightsContext';
import { useAuth } from '@/context/AuthContext';
import type { Profile } from '@/types/database';

const REASON_SUGGESTIONS = [
  'Disrespect at Weigh-In',
  'Stole the Last Slice',
  'Trash Talk in the Group Chat',
  'Beat Me at Pool and Wouldn\u2019t Shut Up',
  'Showed Up Late. Again.',
];

interface NewFightModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NewFightModal({ visible, onClose }: NewFightModalProps) {
  const insets = useSafeAreaInsets();
  const { allProfiles, createFight } = useFights();
  const { profile } = useAuth();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const opponents = useMemo(
    () => allProfiles.filter((p) => p.id !== profile?.id),
    [allProfiles, profile?.id]
  );

  const reset = () => {
    setSelectedId(null);
    setReason('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedId) {
      Alert.alert('Pick an opponent', 'Choose who you\u2019re calling out.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Give a reason', 'Every fight needs a story.');
      return;
    }
    setSubmitting(true);
    const { error } = await createFight(selectedId, reason);
    setSubmitting(false);

    if (error) {
      Alert.alert('Could not create fight', error);
      return;
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
            paddingHorizontal: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>NEW FIGHT</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeText}>✕ CLOSE</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>CALL SOMEONE OUT</Text>

          {/* Opponent picker */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionHeader}>CHOOSE YOUR OPPONENT</Text>
          </View>

          {opponents.length === 0 ? (
            <Text style={styles.emptyText}>
              No one else has joined the roster yet.
            </Text>
          ) : (
            <View style={styles.grid}>
              {opponents.map((p) => (
                <OpponentTile
                  key={p.id}
                  profile={p}
                  selected={selectedId === p.id}
                  onPress={() => setSelectedId(p.id)}
                />
              ))}
            </View>
          )}

          {/* Reason */}
          <View style={[styles.sectionHeaderRow, styles.reasonHeaderRow]}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionHeader}>THE REASON</Text>
          </View>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder='"Disrespect at Weigh-In"'
            placeholderTextColor={colors.greyDim}
            style={styles.reasonInput}
            multiline
            maxLength={80}
          />

          <View style={styles.suggestionsWrap}>
            {REASON_SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.suggestionChip} onPress={() => setReason(s)}>
                <Text style={styles.suggestionChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* Preview */}
          {selectedId && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.previewWrap}>
              <Text style={styles.previewLabel}>PREVIEW</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {profile?.fight_name ?? 'YOU'}
                </Text>
                <Text style={styles.previewVs}>vs</Text>
                <Text style={[styles.previewName, styles.previewNameRight]} numberOfLines={1}>
                  {opponents.find((o) => o.id === selectedId)?.fight_name}
                </Text>
              </View>
            </Animated.View>
          )}

          <GlowButton
            label="ISSUE CHALLENGE"
            variant="salmon"
            size="lg"
            onPress={handleSubmit}
            disabled={submitting || !selectedId || !reason.trim()}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OpponentTile({
  profile,
  selected,
  onPress,
}: {
  profile: Profile;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tile, selected && styles.tileSelected]} onPress={onPress}>
      <FighterAvatar
        avatarUrl={profile.avatar_url}
        avatarColor={profile.avatar_color}
        size={52}
        style={styles.tileAvatar}
      />
      <Text style={styles.tileFightName} numberOfLines={1}>
        '{profile.fight_name}'
      </Text>
      <Text style={styles.tileRealName} numberOfLines={1}>
        {profile.real_name}
      </Text>
      {selected && (
        <View style={styles.tileCheck}>
          <Text style={styles.tileCheckText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

const TILE_GAP = spacing.md;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    letterSpacing: 1,
  },
  closeText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.grey,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.salmon,
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reasonHeaderRow: {
    marginTop: spacing.xl,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    backgroundColor: colors.salmon,
    marginRight: spacing.sm,
    borderRadius: 2,
  },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 1,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.grey,
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tile: {
    width: '30%',
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  tileSelected: {
    borderColor: colors.salmon,
  },
  tileAvatar: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.bgElevated,
    marginBottom: spacing.xs,
  },
  tileFightName: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.white,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tileRealName: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 1,
  },
  tileCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.salmon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCheckText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.black,
  },
  reasonInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.white,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    fontStyle: 'italic',
    minHeight: 56,
    textAlignVertical: 'top',
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  suggestionChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.grey,
  },
  previewWrap: {
    marginTop: spacing.xl,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  previewLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.yellow,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewName: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.5,
  },
  previewNameRight: {
    textAlign: 'right',
  },
  previewVs: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.grey,
    marginHorizontal: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});
