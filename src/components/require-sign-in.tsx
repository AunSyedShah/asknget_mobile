import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { en } from '@/i18n/en';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

import { Button } from './ui';

/** Shows its children to signed-in users and a sign-in prompt to everyone else. */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const signedIn = useSession((state) => state.accessToken !== null);
  if (signedIn) return <>{children}</>;
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{en.account.signedOutTitle}</Text>
      <Text style={styles.body}>{en.account.signedOutBody}</Text>
      <Button label={en.common.signIn} onPress={() => router.push('/auth/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  title: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.title, textAlign: 'center' },
  body: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body, textAlign: 'center' },
});
