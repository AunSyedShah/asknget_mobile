import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAddresses, useCart } from '@/api/queries';
import { ComingSoonBadge } from '@/components/coming-soon';
import { Button, Card, ErrorText, Loading, SectionHeader } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

/**
 * Checkout stops before payment. The API cannot take an order yet: there is no
 * cash-on-delivery method and no payment provider. So the payment step and the
 * place-order button are inert, labelled coming soon, and nothing is submitted.
 */
export default function CheckoutScreen() {
  const signedIn = useSession((state) => state.accessToken !== null);
  const cart = useCart();
  const addresses = useAddresses();

  if (!signedIn) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: en.checkout.title, headerBackTitle: en.common.back }} />
        <View style={styles.center}>
          <Text style={styles.title}>{en.checkout.signInTitle}</Text>
          <Text style={styles.body}>{en.checkout.signInBody}</Text>
          <Button label={en.common.signIn} onPress={() => router.push('/auth/login')} />
        </View>
      </View>
    );
  }

  const defaultAddress = addresses.data?.find((address) => address.is_default) ?? addresses.data?.[0];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.checkout.title, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title={en.checkout.address} />
        <Card>
          {addresses.isPending ? <Loading /> : null}
          <ErrorText error={addresses.error} />
          {addresses.data && addresses.data.length === 0 ? <Text style={styles.body}>{en.checkout.noAddress}</Text> : null}
          {defaultAddress ? (
            <View style={styles.address}>
              <Text style={styles.strong}>{defaultAddress.full_name}</Text>
              <Text style={styles.body}>{defaultAddress.street_address}</Text>
              <Text style={styles.body}>
                {defaultAddress.city} {defaultAddress.postal_code}
              </Text>
            </View>
          ) : null}
          <Pressable accessibilityRole="link" onPress={() => router.push('/account/addresses')}>
            <Text style={styles.link}>{en.checkout.manageAddresses}</Text>
          </Pressable>
        </Card>

        <SectionHeader title={en.checkout.summary} />
        <Card>
          {cart.isPending ? <Loading /> : null}
          <ErrorText error={cart.error} />
          {cart.data ? (
            <>
              <Row label={en.cart.subtotal} value={formatMoney(cart.data.summary.subtotal_cents, cart.data.summary.currency)} />
              <Row label={en.cart.shipping} value={formatMoney(cart.data.summary.shipping_cents, cart.data.summary.currency)} />
              {cart.data.summary.discount_cents > 0 ? (
                <Row label={en.cart.discount} value={formatMoney(-cart.data.summary.discount_cents, cart.data.summary.currency)} />
              ) : null}
              <Row label={en.cart.total} value={formatMoney(cart.data.summary.total_cents, cart.data.summary.currency)} strong />
            </>
          ) : null}
        </Card>

        <SectionHeader title={en.checkout.paymentTitle} />
        <Card>
          <Text style={styles.body}>{en.checkout.paymentBody}</Text>
          <FeatureGate feature="cashOnDelivery" comingSoon={<PaymentRow label={en.checkout.cashOnDelivery} />}>
            <PaymentRow label={en.checkout.cashOnDelivery} />
          </FeatureGate>
          <FeatureGate feature="onlinePayments" comingSoon={<PaymentRow label={en.checkout.onlinePayments} />}>
            <PaymentRow label={en.checkout.onlinePayments} />
          </FeatureGate>
        </Card>

        {cart.data && !cart.data.can_checkout ? (
          <Card>
            {cart.data.problems.map((problem) => (
              <Text key={problem} style={styles.body}>
                • {problem}
              </Text>
            ))}
          </Card>
        ) : null}

        <Button label={en.checkout.placeOrderSoon} disabled onPress={() => undefined} accessibilityLabel={en.checkout.placeOrder} />
        <View style={styles.soon}>
          <ComingSoonBadge />
        </View>
      </ScrollView>
    </View>
  );
}

function PaymentRow({ label }: { label: string }) {
  return (
    <View style={styles.paymentRow}>
      <Text style={styles.body}>{label}</Text>
      <ComingSoonBadge />
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.body, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.body, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  title: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.title, textAlign: 'center' },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body, textAlign: 'center' },
  strong: { color: colors.ink, fontFamily: fontFamily.semibold },
  link: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  address: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.xs, borderRadius: radius.md },
  soon: { alignItems: 'center', marginTop: space.sm },
});
