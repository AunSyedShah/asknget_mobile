import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { ApiError } from '@/api/errors';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, accessibilityLabel }: ButtonProps) {
  const inactive = disabled || loading;
  const palette = BUTTON[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        inactive && styles.buttonInactive,
        pressed && !inactive && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.buttonLabel, { color: palette.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const BUTTON = {
  primary: { background: colors.brand, border: colors.brand, text: colors.white },
  secondary: { background: colors.white, border: colors.brand, text: colors.brand },
  ghost: { background: 'transparent', border: 'transparent', text: colors.ink },
} as const;

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string | null;
};

export function TextField({ label, error, hint, ...input }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null]}
        {...input}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="link" onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}

/**
 * Shows the server's message, or a plain network message when there was no
 * server answer. For the latter it adds the technical detail in small grey
 * text, so a failure can be diagnosed from a screenshot.
 */
export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  if (error instanceof ApiError) return <Text style={styles.errorText}>{error.message}</Text>;

  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return (
    <View>
      <Text style={styles.errorText}>We could not reach the server. Check your connection and try again.</Text>
      <Text style={styles.hintText}>{detail.slice(0, 200)}</Text>
    </View>
  );
}

export function Row({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : 'text'} onPress={onPress} disabled={!onPress} style={styles.row}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonInactive: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.bodyLg },
  field: { gap: space.xs },
  fieldLabel: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  input: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodyLg,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontFamily: fontFamily.body, fontSize: fontSize.body },
  hintText: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  sectionTitle: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  sectionAction: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
});
