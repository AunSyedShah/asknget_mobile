import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { sendOtp, verifyOtp } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { Button, ErrorText, TextField } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

/** Email verification after sign-up. The code is sent by email; a tester may not receive it until mail is set up. */
export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit() {
    setLoading(true);
    setFailure(null);
    setNotice(null);
    try {
      await verifyOtp('signup_email', email ?? '', code.trim());
      setNotice(en.auth.verified);
      router.replace('/(tabs)/account');
    } catch (error) {
      setFailure(error);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setFailure(null);
    setNotice(null);
    try {
      await sendOtp('signup_email', email ?? '');
    } catch (error) {
      // 429 means a code was sent recently: tell the shopper to wait.
      setFailure(error instanceof ApiError && error.status === 429 ? new ApiError(429, en.errors.codeWait) : error);
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.auth.verifyTitle, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{en.auth.verifyTitle}</Text>
        <Text style={styles.body}>
          {en.auth.verifyBody} {email}
        </Text>
        <TextField label={en.auth.code} value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" />
        <ErrorText error={failure} />
        {notice ? <Text style={styles.success}>{notice}</Text> : null}
        <Button label={en.auth.verifySubmit} onPress={() => void submit()} loading={loading} disabled={code.trim() === ''} />
        <Button label={en.auth.resend} variant="ghost" onPress={() => void resend()} loading={resending} />
        <Text style={styles.muted}>{en.auth.codeNotArriving}</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/(tabs)/account')}>
          <Text style={styles.link}>Skip for now</Text>
        </Pressable>
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
  link: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body, textAlign: 'center' },
});
