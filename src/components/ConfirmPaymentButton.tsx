import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Text } from './typography';
import { fonts, radius, shadows } from '../theme';

const PURCHASE_ORANGE = '#FF5000';
const PURCHASE_ORANGE_PRESSED = '#E64800';

export function ConfirmPaymentButton({
  label,
  onPress,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const inactive = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        inactive && styles.buttonDisabled,
        pressed && !inactive && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    width: '100%',
    minHeight: 48,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURCHASE_ORANGE,
    ...shadows.button,
  },
  buttonPressed: {
    backgroundColor: PURCHASE_ORANGE_PRESSED,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: fonts.weights.bold,
    textAlign: 'center',
  },
});