import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { updateMe } from '@/api/endpoints';
import { keys, useMe } from '@/api/queries';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button, ErrorText, Loading, TextField } from '@/components/ui';
import { en } from '@/i18n/en';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const me = useMe();
  // The field shows what the shopper typed, or the saved name until they type.
  const [typedName, setFullName] = useState<string | null>(null);
  const fullName = typedName ?? me.data?.full_name ?? '';
  const [failure, setFailure] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setFailure(null);
    setSaved(false);
    try {
      const updated = await updateMe({ full_name: fullName.trim() });
      const session = useSession.getState();
      if (session.accessToken && session.refreshToken) {
        session.setSession(
          { accessToken: session.accessToken, refreshToken: session.refreshToken },
          { ...(session.user ?? { email: updated.email }), full_name: updated.full_name },
        );
      }
      await queryClient.invalidateQueries({ queryKey: keys.me });
      setSaved(true);
    } catch (error) {
      setFailure(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.profile.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {me.isPending ? <Loading /> : null}
          {me.isError ? <ErrorText error={me.error} /> : null}
          {me.data ? (
            <>
              <Text style={styles.muted}>{me.data.email}</Text>
              <TextField label={en.profile.fullName} value={fullName} onChangeText={setFullName} autoComplete="name" />
              <ErrorText error={failure} />
              {saved ? <Text style={styles.success}>{en.profile.saved}</Text> : null}
              <Button label={en.common.save} onPress={() => void save()} loading={loading} disabled={fullName.trim() === ''} />
            </>
          ) : null}
        </ScrollView>
      </RequireSignIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.xl, gap: space.md },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
  success: { color: colors.success, fontFamily: fontFamily.medium, fontSize: fontSize.body },
});
