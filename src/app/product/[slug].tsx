import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as endpoints from '@/api/endpoints';
import { keys, useCartMutations, useProduct, useReviews } from '@/api/queries';
import { ComingSoonBadge } from '@/components/coming-soon';
import { Button, Card, ErrorText, Loading, SectionHeader, TextField } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { discountLabel, formatMoney } from '@/lib/money';
import { findVariant } from '@/lib/variants';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

const MAX_QTY = 10;

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const product = useProduct(slug ?? '');
  const reviews = useReviews(slug ?? '');
  const cart = useCartMutations();
  const queryClient = useQueryClient();
  const signedIn = useSession((state) => state.accessToken !== null);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [askError, setAskError] = useState<unknown>(null);
  const [asking, setAsking] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  const data = product.data;
  const variant = useMemo(
    () => (data ? findVariant(data.variants, selected, data.option_types) : null),
    [data, selected],
  );
  const maxQty = variant ? Math.max(1, Math.min(MAX_QTY, variant.stock_qty)) : 1;

  if (product.isPending) return <Loading />;
  if (product.isError || !data) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: true, title: en.product.title }} />
        <ErrorText error={product.error} />
      </View>
    );
  }

  const loaded = data;
  const primary = data.images.find((image) => image.is_primary) ?? data.images[0];
  const badge = discountLabel(data.discount_percent);
  const priceCents = variant?.price_cents ?? data.price_cents;
  const compareCents = variant?.compare_at_price_cents ?? data.compare_at_price_cents;
  const inStock = variant ? variant.in_stock : false;

  async function addToCart(buyNow: boolean) {
    if (!variant) return;
    setAdded(false);
    try {
      await cart.addItem.mutateAsync({ variantId: variant.id, qty });
      setAdded(true);
      if (buyNow) router.push('/(tabs)/cart');
    } catch {
      // The error is shown from cart.addItem.error below.
    }
  }

  async function toggleWishlist() {
    if (!signedIn) {
      router.push('/auth/login');
      return;
    }
    setWishBusy(true);
    try {
      if (loaded.is_wishlisted) await endpoints.removeFromWishlist(loaded.id);
      else await endpoints.addToWishlist(loaded.id);
      await queryClient.invalidateQueries({ queryKey: keys.product(slug ?? '') });
      await queryClient.invalidateQueries({ queryKey: keys.wishlist });
    } finally {
      setWishBusy(false);
    }
  }

  async function askSeller() {
    const body = question.trim();
    if (body === '') return;
    setAsking(true);
    setAskError(null);
    try {
      const thread = await endpoints.openConversation({
        store_slug: loaded.store.slug,
        subject: loaded.name,
        body,
      });
      setQuestion('');
      setAskOpen(false);
      router.push({ pathname: '/account/chat/[id]', params: { id: thread.id } });
    } catch (error) {
      setAskError(error);
    } finally {
      setAsking(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: data.name, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gallery}>
          {primary?.url ? (
            <Image source={{ uri: primary.url }} style={styles.hero} contentFit="cover" transition={150} accessibilityLabel={primary.alt} />
          ) : (
            <View style={[styles.hero, styles.placeholder]} />
          )}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text accessibilityRole="header" style={styles.name}>
          {data.name}
        </Text>
        {data.short_description ? <Text style={styles.body}>{data.short_description}</Text> : null}
        <Text style={styles.sold}>
          {en.product.sold} {data.store.display_name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(priceCents, data.currency)}</Text>
          {compareCents && compareCents > priceCents ? (
            <Text style={styles.compare}>{formatMoney(compareCents, data.currency)}</Text>
          ) : null}
        </View>
        <Text style={styles.rating}>
          ★ {data.rating_avg.toFixed(1)} · {data.rating_count} {en.product.ratingCount}
        </Text>

        {data.option_types.map((type) => (
          <View key={type.id}>
            <SectionHeader title={type.name} />
            <View style={styles.optionRow}>
              {type.values.map((value) => {
                const active = selected[type.id] === value.id;
                return (
                  <Pressable
                    key={value.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${type.name}: ${value.value}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setSelected((current) => ({ ...current, [type.id]: value.id }))}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{value.value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {data.option_types.length > 0 && !variant ? <Text style={styles.hint}>{en.product.chooseOptions}</Text> : null}

        <SectionHeader title={en.product.quantity} />
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="Less" onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.stepBtn}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{qty}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => setQty((q) => Math.min(maxQty, q + 1))} style={styles.stepBtn}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        {data.key_benefits.length > 0 ? (
          <>
            <SectionHeader title={en.product.keyBenefits} />
            <Card>
              {data.key_benefits.map((section, index) => (
                <Text key={index} style={styles.body}>
                  • {section.title}
                  {section.body ? ` — ${section.body}` : ''}
                </Text>
              ))}
            </Card>
          </>
        ) : null}

        {data.usage_steps.length > 0 ? (
          <>
            <SectionHeader title={en.product.howToUse} />
            <Card>
              {data.usage_steps.map((section, index) => (
                <Text key={index} style={styles.body}>
                  {index + 1}. {section.title}
                  {section.body ? ` — ${section.body}` : ''}
                </Text>
              ))}
            </Card>
          </>
        ) : null}

        <SectionHeader title={en.product.reviews} />
        <Card>
          {reviews.isPending ? <Loading /> : null}
          {reviews.isError ? <ErrorText error={reviews.error} /> : null}
          {reviews.data && reviews.data.items.length === 0 ? <Text style={styles.body}>{en.product.noReviews}</Text> : null}
          {reviews.data?.items.map((review) => (
            <View key={review.id} style={styles.review}>
              <Text style={styles.reviewMeta}>
                ★ {review.rating} · {review.reviewer_name}
                {review.is_verified_purchase ? ' · verified purchase' : ''}
              </Text>
              {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
              <Text style={styles.body}>{review.body}</Text>
            </View>
          ))}
        </Card>

        <SectionHeader title={en.product.faq} />
        <FeatureGate feature="productFaq" comingSoon={<ComingSoonBadge />}>
          <View />
        </FeatureGate>

        <Pressable accessibilityRole="link" onPress={() => router.push('/returns-policy')} style={styles.linkRow}>
          <Text style={styles.linkText}>{en.product.returnsShipping} →</Text>
        </Pressable>

        <View style={styles.actions}>
          <Button
            label={en.product.addToCart}
            variant="secondary"
            onPress={() => void addToCart(false)}
            disabled={!inStock}
            loading={cart.addItem.isPending}
          />
          <Button label={en.product.buyNow} onPress={() => void addToCart(true)} disabled={!inStock} loading={cart.addItem.isPending} />
        </View>
        {!inStock && variant ? <Text style={styles.hint}>{en.product.outOfStock}</Text> : null}
        {added ? <Text style={styles.success}>{en.product.added}</Text> : null}
        <ErrorText error={cart.addItem.error} />

        <Button
          label={data.is_wishlisted ? en.product.inWishlist : en.product.addToWishlist}
          variant="ghost"
          onPress={() => void toggleWishlist()}
          loading={wishBusy}
        />
        {!signedIn ? <Text style={styles.hint}>{en.product.wishlistSignIn}</Text> : null}

        <Button label={en.product.askSeller} variant="ghost" onPress={() => setAskOpen((open) => !open)} />
        {askOpen ? (
          <Card>
            {signedIn ? (
              <>
                <TextField
                  label={en.chats.typeMessage}
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                  maxLength={4000}
                />
                <ErrorText error={askError} />
                <Button label={en.chats.send} onPress={() => void askSeller()} loading={asking} disabled={question.trim() === ''} />
              </>
            ) : (
              <Button label={en.common.signIn} onPress={() => router.push('/auth/login')} />
            )}
          </Card>
        ) : null}
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  gallery: { borderRadius: radius.xl, overflow: 'hidden' },
  hero: { width: '100%', aspectRatio: 1, backgroundColor: colors.white },
  placeholder: { backgroundColor: colors.peach },
  badge: { position: 'absolute', top: space.md, left: space.md, backgroundColor: colors.brand, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: space.xs },
  badgeText: { color: colors.white, fontFamily: fontFamily.medium, fontSize: fontSize.caption },
  name: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.title, marginTop: space.sm },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body, lineHeight: 20 },
  sold: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  price: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.display },
  compare: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.bodyLg, textDecorationLine: 'line-through' },
  rating: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  option: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, minWidth: 72, alignItems: 'center' },
  optionActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  optionText: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  optionTextActive: { color: colors.white, fontFamily: fontFamily.medium },
  hint: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  success: { color: colors.success, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.title },
  stepValue: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.bodyLg, minWidth: 24, textAlign: 'center' },
  review: { gap: space.xs, paddingVertical: space.xs },
  reviewMeta: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  reviewTitle: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  linkRow: { paddingVertical: space.md },
  linkText: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
});
