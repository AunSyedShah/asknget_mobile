import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { resetPassword } from '@/api/endpoints';
import { Button, ErrorText, TextField } from '@/components/ui';
import { en } from '@/i18n/en';
import { fieldErrors, resetSchema } from '@/lib/auth';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function ResetScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [form, setForm] = useState({ email: params.email ?? '', code: '', new_password: '', confirm_password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    const parsed = resetSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFailure(null);
    setLoading(true);
    try {
      await resetPassword({
        email: parsed.data.email,
        code: parsed.data.code,
        new_password: parsed.data.new_password,
        confirm_password: parsed.data.confirm_password,
      });
      setDone(true);
    } catch (error) {
      setFailure(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.auth.resetTitle, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{en.auth.resetTitle}</Text>
        <Text style={styles.body}>{en.auth.resetBody}</Text>
        <TextField label={en.auth.email} value={form.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
        <TextField label={en.auth.code} value={form.code} onChangeText={set('code')} error={errors.code} keyboardType="number-pad" autoComplete="one-time-code" />
        <TextField label={en.auth.newPassword} value={form.new_password} onChangeText={set('new_password')} error={errors.new_password} secureTextEntry autoComplete="new-password" />
        <TextField label={en.auth.confirmPassword} value={form.confirm_password} onChangeText={set('confirm_password')} error={errors.confirm_password} secureTextEntry autoComplete="new-password" />
        <ErrorText error={failure} />
        <Text style={styles.muted}>{en.auth.codeNotArriving}</Text>
        {done ? (
          <>
            <Text style={styles.success}>{en.auth.resetDone}</Text>
            <Button label={en.common.signIn} onPress={() => router.replace('/auth/login')} />
          </>
        ) : (
          <Button label={en.auth.resetSubmit} onPress={() => void submit()} loading={loading} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.xl, gap: space.md },
  title: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.display },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  success: { color: colors.success, fontFamily: fontFamily.medium, fontSize: fontSize.body },
});
