import { useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { register, sendOtp } from '@/api/endpoints';
import { Button, ErrorText, TextField } from '@/components/ui';
import { en } from '@/i18n/en';
import { fieldErrors, isCustomerAccount, registerSchema } from '@/lib/auth';
import { useRegion } from '@/api/queries';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function RegisterScreen() {
  const queryClient = useQueryClient();
  const region = useRegion();
  const prefix = region.data?.country.phone_prefix ?? '';

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFailure(null);
    setLoading(true);
    try {
      const { user, tokens } = await register({
        email: parsed.data.email,
        password: parsed.data.password,
        confirm_password: parsed.data.confirm_password,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ? parsed.data.phone : null,
      });
      if (!isCustomerAccount(user)) return;
      useSession.getState().setSession(
        { accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
        { id: user.id, email: user.email, full_name: user.full_name, is_seller: user.is_seller, is_staff: user.is_staff },
      );
      await queryClient.invalidateQueries();
      // Ask for a verification code; if sending fails the verify screen can resend.
      try {
        await sendOtp('signup_email', parsed.data.email);
      } catch {
        // Shown on the verify screen when the shopper taps "send a new code".
      }
      router.replace({ pathname: '/auth/verify', params: { email: parsed.data.email } });
    } catch (error) {
      setFailure(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.auth.signUp, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{en.auth.registerTitle}</Text>
        <TextField label={en.auth.fullName} value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} autoComplete="name" />
        <TextField
          label={en.auth.email}
          value={form.email}
          onChangeText={set('email')}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label={en.auth.phone}
          value={form.phone}
          onChangeText={set('phone')}
          error={errors.phone}
          hint={prefix ? en.addresses.phoneHint.replaceAll('{prefix}', prefix) : null}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <TextField label={en.auth.password} value={form.password} onChangeText={set('password')} error={errors.password} secureTextEntry autoComplete="new-password" />
        <TextField
          label={en.auth.confirmPassword}
          value={form.confirm_password}
          onChangeText={set('confirm_password')}
          error={errors.confirm_password}
          secureTextEntry
          autoComplete="new-password"
        />
        <ErrorText error={failure} />
        <Button label={en.auth.createAccount} onPress={() => void submit()} loading={loading} />
        <View style={styles.footer}>
          <Text style={styles.body}>{en.auth.haveAccount}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace('/auth/login')}>
            <Text style={styles.link}>{en.common.signIn}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.xl, gap: space.md },
  title: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.display },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  link: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  footer: { flexDirection: 'row', gap: space.xs, justifyContent: 'center', marginTop: space.lg },
});
