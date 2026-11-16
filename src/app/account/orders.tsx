import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { OrderTab } from '@/api/endpoints';
import { useOrders } from '@/api/queries';
import { RequireSignIn } from '@/components/require-sign-in';
import { Card, ErrorText, Loading } from '@/components/ui';
import { en } from '@/i18n/en';
import { formatMoney } from '@/lib/money';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

const TABS: { value: OrderTab; label: string }[] = [
  { value: 'all', label: en.orders.all },
  { value: 'ongoing', label: en.orders.ongoing },
  { value: 'completed', label: en.orders.completed },
  { value: 'cancelled', label: en.orders.cancelled },
];

export default function OrdersScreen() {
  const [tab, setTab] = useState<OrderTab>('all');
  const orders = useOrders(tab);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.orders.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <View style={styles.tabs}>
          {TABS.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === item.value }}
              onPress={() => setTab(item.value)}
              style={[styles.tab, tab === item.value && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === item.value && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {orders.isPending ? <Loading /> : null}
          {orders.isError ? <ErrorText error={orders.error} /> : null}
          {orders.data && orders.data.items.length === 0 ? <Text style={styles.muted}>{en.orders.empty}</Text> : null}
          {orders.data?.items.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/account/order/[id]', params: { id: order.id } })}
            >
              <Card>
                <Text style={styles.strong}>
                  {order.order_number} · {order.status_label}
                </Text>
                <Text style={styles.muted}>
                  {en.orders.placed} {new Date(order.placed_at).toLocaleDateString('en-ZA')}
                </Text>
                <Text style={styles.body}>
                  {order.items.length} · {en.orders.total} {formatMoney(order.total_cents, order.currency)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </RequireSignIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, padding: space.lg, paddingBottom: space.sm },
  tab: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  tabTextActive: { color: colors.white, fontFamily: fontFamily.medium },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  strong: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
