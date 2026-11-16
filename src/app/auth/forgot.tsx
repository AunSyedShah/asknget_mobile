import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { forgotPassword } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { Button, ErrorText, TextField } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function ForgotScreen() {
  const [email, setEmail] = useState('');
  const [failure, setFailure] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setFailure(null);
    try {
      // The server never says whether the email exists, so we always move on.
      await forgotPassword(email.trim());
      router.push({ pathname: '/auth/reset', params: { email: email.trim() } });
    } catch (error) {
      setFailure(error instanceof ApiError && error.status === 429 ? new ApiError(429, en.errors.codeWait) : error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.auth.forgotTitle, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{en.auth.forgotTitle}</Text>
        <Text style={styles.body}>{en.auth.forgotBody}</Text>
        <TextField label={en.auth.email} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <ErrorText error={failure} />
        <Button label={en.auth.sendCode} onPress={() => void submit()} loading={loading} disabled={email.trim() === ''} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.xl, gap: space.md },
  title: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.display },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
