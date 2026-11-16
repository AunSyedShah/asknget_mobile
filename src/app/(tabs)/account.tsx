import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { logout } from '@/api/endpoints';
import { ComingSoonBadge } from '@/components/coming-soon';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button, Row } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { useCartToken } from '@/state/cart-token';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function AccountScreen() {
  const queryClient = useQueryClient();
  const user = useSession((state) => state.user);
  const signedIn = useSession((state) => state.accessToken !== null);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await logout(useSession.getState().refreshToken);
    } catch {
      // Sign out locally even if the server cannot be reached.
    } finally {
      useSession.getState().clear();
      useCartToken.getState().setToken(null);
      queryClient.clear();
      setSigningOut(false);
    }
  }

  if (!signedIn) {
    return (
      <Screen title={en.account.title}>
        <EmptyState title={en.account.signedOutTitle} body={en.account.signedOutBody} />
        <View style={styles.stack}>
          <Button label={en.common.signIn} onPress={() => router.push('/auth/login')} />
          <Button label={en.account.signUp} variant="secondary" onPress={() => router.push('/auth/register')} />
          <Button label={en.account.track} variant="ghost" onPress={() => router.push('/track')} />
          <Button label={en.account.policy} variant="ghost" onPress={() => router.push('/returns-policy')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={en.account.title}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.muted}>
          {en.account.signedInAs} {user?.full_name || user?.email}
        </Text>
        <Row onPress={() => router.push('/account/profile')}>
          <Text style={styles.label}>{en.account.profile}</Text>
        </Row>
        <Row onPress={() => router.push('/account/orders')}>
          <Text style={styles.label}>{en.account.orders}</Text>
        </Row>
        <Row onPress={() => router.push('/account/wishlist')}>
          <Text style={styles.label}>{en.account.wishlist}</Text>
        </Row>
        <Row onPress={() => router.push('/account/addresses')}>
          <Text style={styles.label}>{en.account.addresses}</Text>
        </Row>
        <Row onPress={() => router.push('/account/chats')}>
          <Text style={styles.label}>{en.account.support}</Text>
        </Row>
        <Row onPress={() => router.push('/track')}>
          <Text style={styles.label}>{en.account.track}</Text>
        </Row>
        <Row onPress={() => router.push('/returns-policy')}>
          <Text style={styles.label}>{en.account.policy}</Text>
        </Row>

        <FeatureGate feature="savedCards" comingSoon={<SoonRow label={en.account.payments} />}>
          <Row>
            <Text style={styles.label}>{en.account.payments}</Text>
          </Row>
        </FeatureGate>
        <FeatureGate feature="wallet" comingSoon={<SoonRow label={en.account.wallet} />}>
          <Row>
            <Text style={styles.label}>{en.account.wallet}</Text>
          </Row>
        </FeatureGate>

        <Button label={en.account.logout} variant="secondary" onPress={() => void signOut()} loading={signingOut} />
      </ScrollView>
    </Screen>
  );
}

function SoonRow({ label }: { label: string }) {
  return (
    <Row>
      <Text style={[styles.label, styles.dim]}>{label}</Text>
      <ComingSoonBadge />
    </Row>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.sm, paddingBottom: space.xxl },
  stack: { gap: space.sm, paddingBottom: space.xxl },
  label: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.bodyLg },
  dim: { opacity: 0.6 },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
