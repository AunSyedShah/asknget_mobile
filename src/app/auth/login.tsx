import { useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { login } from '@/api/endpoints';
import { ComingSoonBadge } from '@/components/coming-soon';
import { Button, ErrorText, TextField } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { fieldErrors, isCustomerAccount, loginSchema } from '@/lib/auth';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [refused, setRefused] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFailure(null);
    setRefused(false);
    setLoading(true);
    try {
      const { user, tokens } = await login(parsed.data.email, parsed.data.password);
      if (!isCustomerAccount(user)) {
        // Never keep tokens for a seller or staff account in the customer app.
        setRefused(true);
        return;
      }
      useSession.getState().setSession(
        { accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
        { id: user.id, email: user.email, full_name: user.full_name, is_seller: user.is_seller, is_staff: user.is_staff },
      );
      await queryClient.invalidateQueries();
      router.replace('/(tabs)/account');
    } catch (error) {
      setFailure(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.common.signIn, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{en.auth.loginTitle}</Text>
        <Text style={styles.body}>{en.auth.loginBody}</Text>
        <TextField
          label={en.auth.email}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label={en.auth.password}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoComplete="current-password"
        />
        <Pressable accessibilityRole="link" onPress={() => router.push('/auth/forgot')}>
          <Text style={styles.link}>{en.auth.forgot}</Text>
        </Pressable>
        {refused ? <Text style={styles.error}>{en.errors.sellerRefused}</Text> : null}
        <ErrorText error={failure} />
        <Button label={en.auth.submit} onPress={() => void submit()} loading={loading} />

        <FeatureGate feature="socialAuth" comingSoon={<SocialSoon />}>
          <View />
        </FeatureGate>

        <View style={styles.footer}>
          <Text style={styles.body}>{en.auth.noAccount}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace('/auth/register')}>
            <Text style={styles.link}>{en.auth.signUp}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SocialSoon() {
  return (
    <View style={styles.social}>
      <Text style={styles.muted}>Google · Apple · Facebook</Text>
      <ComingSoonBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.xl, gap: space.md },
  title: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.display },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
  link: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  error: { color: colors.danger, fontFamily: fontFamily.body, fontSize: fontSize.body },
  social: { alignItems: 'center', gap: space.xs, marginTop: space.md },
  footer: { flexDirection: 'row', gap: space.xs, justifyContent: 'center', marginTop: space.lg },
});
