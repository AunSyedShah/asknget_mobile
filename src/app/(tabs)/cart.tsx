import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Schemas } from '@/api/endpoints';
import { useCart, useCartMutations } from '@/api/queries';
import { EmptyState } from '@/components/empty-state';
import { Button, Card, ErrorText, Loading, TextField } from '@/components/ui';
import { Screen } from '@/components/screen';
import { en } from '@/i18n/en';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

type Line = Schemas['CartLineOut'];

const MAX_QTY = 10;

export default function CartScreen() {
  const cart = useCart();
  const mutations = useCartMutations();
  const signedIn = useSession((state) => state.accessToken !== null);
  const [code, setCode] = useState('');

  return (
    <Screen title={en.cart.title}>
      {cart.isPending ? <Loading /> : null}
      {cart.isError ? <ErrorText error={cart.error} /> : null}
      {cart.data && cart.data.items.length === 0 ? (
        <EmptyState title={en.cart.emptyTitle} body={en.cart.emptyBody} />
      ) : null}

      {cart.data && cart.data.items.length > 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          {cart.data.items.map((line) => (
            <LineRow
              key={line.id}
              line={line}
              currency={cart.data.summary.currency}
              onQty={(qty) => mutations.setQty.mutate({ itemId: line.id, qty })}
              onRemove={() => mutations.removeItem.mutate(line.id)}
              busy={mutations.setQty.isPending || mutations.removeItem.isPending}
            />
          ))}

          <Card>
            <Text style={styles.sectionTitle}>{en.cart.voucherLabel}</Text>
            {cart.data.voucher ? (
              <View style={styles.voucherRow}>
                <Text style={styles.body}>
                  {cart.data.voucher.code} · {cart.data.voucher.label}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => mutations.removeVoucher.mutate()}>
                  <Text style={styles.danger}>{en.common.remove}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.voucherForm}>
                <View style={{ flex: 1 }}>
                  <TextField label={en.cart.voucherLabel} placeholder={en.cart.voucherPlaceholder} value={code} onChangeText={setCode} autoCapitalize="characters" />
                </View>
                <Button
                  label={en.cart.apply}
                  variant="secondary"
                  disabled={code.trim() === ''}
                  loading={mutations.applyVoucher.isPending}
                  onPress={() => mutations.applyVoucher.mutate(code.trim(), { onSuccess: () => setCode('') })}
                />
              </View>
            )}
            <ErrorText error={mutations.applyVoucher.error} />
          </Card>

          <Card>
            <SummaryRow label={en.cart.subtotal} cents={cart.data.summary.subtotal_cents} currency={cart.data.summary.currency} />
            <SummaryRow label={en.cart.shipping} cents={cart.data.summary.shipping_cents} currency={cart.data.summary.currency} />
            {cart.data.summary.discount_cents > 0 ? (
              <SummaryRow label={en.cart.discount} cents={-cart.data.summary.discount_cents} currency={cart.data.summary.currency} />
            ) : null}
            <SummaryRow label={en.cart.total} cents={cart.data.summary.total_cents} currency={cart.data.summary.currency} strong />
          </Card>

          {cart.data.problems.length > 0 ? (
            <Card>
              <Text style={styles.danger}>{en.cart.problems}</Text>
              {cart.data.problems.map((problem) => (
                <Text key={problem} style={styles.body}>
                  • {problem}
                </Text>
              ))}
            </Card>
          ) : null}

          <Button
            label={signedIn ? en.cart.checkout : en.cart.signInToCheckout}
            onPress={() => router.push('/checkout')}
            disabled={!cart.data.can_checkout && signedIn}
          />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function LineRow({
  line,
  currency,
  onQty,
  onRemove,
  busy,
}: {
  line: Line;
  currency: string;
  onQty: (qty: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const max = Math.max(1, Math.min(MAX_QTY, line.available_qty));
  return (
    <Card>
      <View style={styles.lineTop}>
        {line.image_url ? (
          <Image source={{ uri: line.image_url }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.placeholder]} />
        )}
        <View style={styles.lineText}>
          <Text numberOfLines={2} style={styles.lineName}>
            {line.product_name}
          </Text>
          {line.variant_summary ? <Text style={styles.body}>{line.variant_summary}</Text> : null}
          <Text style={styles.muted}>{line.store_name}</Text>
          {!line.in_stock ? <Text style={styles.danger}>{en.cart.unavailable}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={en.common.remove} disabled={busy} onPress={onRemove}>
          <Text style={styles.danger}>{en.common.remove}</Text>
        </Pressable>
      </View>
      <View style={styles.lineBottom}>
        <Text style={styles.price}>{formatMoney(line.unit_price_cents, currency)}</Text>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="Less" disabled={busy || line.qty <= 1} onPress={() => onQty(line.qty - 1)} style={styles.stepBtn}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{line.qty}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="More" disabled={busy || line.qty >= max} onPress={() => onQty(line.qty + 1)} style={styles.stepBtn}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function SummaryRow({ label, cents, currency, strong = false }: { label: string; cents: number; currency: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.body, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.body, strong && styles.strong]}>{formatMoney(cents, currency)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  lineTop: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.peach },
  placeholder: { backgroundColor: colors.peach },
  lineText: { flex: 1, gap: 2 },
  lineName: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  lineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.bodyLg },
  stepValue: { color: colors.ink, fontFamily: fontFamily.medium, minWidth: 20, textAlign: 'center' },
  sectionTitle: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.bodyLg },
  voucherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voucherForm: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  strong: { fontFamily: fontFamily.semibold, color: colors.ink },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  danger: { color: colors.danger, fontFamily: fontFamily.medium, fontSize: fontSize.body },
});
