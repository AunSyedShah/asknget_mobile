import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Schemas } from '@/api/endpoints';
import { discountLabel, formatMoney } from '@/lib/money';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

type Product = Schemas['ProductCardOut'];

/** A product tile for rails and lists. Tapping opens the product page. */
export function ProductCard({ product, width }: { product: Product; width?: number }) {
  const badge = discountLabel(product.discount_percent);
  return (
    <Link href={{ pathname: '/product/[slug]', params: { slug: product.slug } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={product.name} style={[styles.card, width ? { width } : null]}>
        <View style={styles.imageWrap}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatMoney(product.price_cents, product.currency)}</Text>
        {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents ? (
          <Text style={styles.compare}>{formatMoney(product.compare_at_price_cents, product.currency)}</Text>
        ) : null}
        {product.rating_count > 0 ? (
          <Text style={styles.rating}>★ {product.rating_avg.toFixed(1)}</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: space.sm,
    gap: space.xs,
    flex: 1,
  },
  imageWrap: { borderRadius: radius.md, overflow: 'hidden', aspectRatio: 1 },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: colors.peach },
  badge: {
    position: 'absolute',
    top: space.xs,
    left: space.xs,
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingHorizontal: space.xs,
    paddingVertical: 2,
  },
  badgeText: { color: colors.white, fontFamily: fontFamily.medium, fontSize: fontSize.caption },
  name: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  price: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  compare: {
    color: colors.muted,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    textDecorationLine: 'line-through',
  },
  rating: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
