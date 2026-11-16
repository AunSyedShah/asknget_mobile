import { useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cancelOrder, reorder } from '@/api/endpoints';
import { keys, useOrder } from '@/api/queries';
import { ComingSoonBadge } from '@/components/coming-soon';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button, Card, ErrorText, Loading, SectionHeader } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { formatMoney } from '@/lib/money';
import { useCartToken } from '@/state/cart-token';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const order = useOrder(id ?? '');
  const [failure, setFailure] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const data = order.data;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setFailure(null);
    try {
      await action();
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: data?.order_number ?? en.orders.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <ScrollView contentContainerStyle={styles.content}>
          {order.isPending ? <Loading /> : null}
          {order.isError ? <ErrorText error={order.error} /> : null}
          {data ? (
            <>
              <Card>
                <Text style={styles.strong}>{data.status_label}</Text>
                <Text style={styles.muted}>
                  {en.orders.placed} {new Date(data.placed_at).toLocaleString('en-ZA')}
                </Text>
              </Card>

              <SectionHeader title={en.orders.items} />
              <Card>
                {data.items.map((item) => (
                  <View key={item.id} style={styles.item}>
                    <Text style={styles.body}>
                      {item.qty} × {item.product_name}
                    </Text>
                    {item.variant_summary ? <Text style={styles.muted}>{item.variant_summary}</Text> : null}
                    <Text style={styles.body}>{formatMoney(item.line_total_cents, data.currency)}</Text>
                  </View>
                ))}
              </Card>

              <Card>
                <Row label={en.cart.subtotal} value={formatMoney(data.subtotal_cents, data.currency)} />
                <Row label={en.cart.shipping} value={formatMoney(data.shipping_cents, data.currency)} />
                {data.discount_cents > 0 ? <Row label={en.cart.discount} value={formatMoney(-data.discount_cents, data.currency)} /> : null}
                <Row label={en.orders.total} value={formatMoney(data.total_cents, data.currency)} strong />
              </Card>

              <SectionHeader title={en.orders.events} />
              <Card>
                {data.events.map((event, index) => (
                  <View key={`${event.status}-${index}`} style={styles.item}>
                    <Text style={styles.strong}>{event.label}</Text>
                    <Text style={styles.muted}>{new Date(event.created_at).toLocaleString('en-ZA')}</Text>
                    {event.note ? <Text style={styles.body}>{event.note}</Text> : null}
                  </View>
                ))}
              </Card>

              <FeatureGate feature="liveTracking" comingSoon={<ComingSoonBadge />}>
                <View />
              </FeatureGate>

              <ErrorText error={failure} />
              {data.can_cancel ? (
                <Button
                  label={en.orders.cancel}
                  variant="secondary"
                  loading={busy}
                  onPress={() =>
                    void run(async () => {
                      await cancelOrder(data.id);
                      await queryClient.invalidateQueries({ queryKey: keys.order(data.id) });
                      await queryClient.invalidateQueries({ queryKey: ['orders'] });
                    })
                  }
                />
              ) : null}
              {data.can_reorder ? (
                <Button
                  label={en.orders.reorder}
                  loading={busy}
                  onPress={() =>
                    void run(async () => {
                      const cart = await reorder(data.id);
                      if (cart.cart_token) useCartToken.getState().setToken(cart.cart_token);
                      await queryClient.invalidateQueries({ queryKey: ['cart'] });
                      router.push('/(tabs)/cart');
                    })
                  }
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </RequireSignIn>
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
  item: { gap: 2, paddingVertical: space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  strong: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
