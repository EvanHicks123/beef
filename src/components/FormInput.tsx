import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

interface FormInputProps extends TextInputProps {
  label: string;
}

export function FormInput({ label, style, ...rest }: FormInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.greyDim}
        style={[styles.input, style]}
        {...rest}
      />
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
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    color: colors.white,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
});
