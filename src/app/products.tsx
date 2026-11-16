import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductListQuery } from '@/api/endpoints';
import { useProductsInfinite } from '@/api/queries';
import { ProductCard } from '@/components/product-card';
import { ErrorText, Loading } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

type Sort = NonNullable<ProductListQuery['sort']>;

const SORTS: { value: Sort; label: string }[] = [
  { value: 'relevance', label: en.products.sortRelevance },
  { value: 'price_asc', label: en.products.sortPriceAsc },
  { value: 'price_desc', label: en.products.sortPriceDesc },
  { value: 'rating', label: en.products.sortRating },
  { value: 'popular', label: en.products.sortPopular },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Product list for a search term or a category. Pages accumulate under "Load more". */
export default function ProductsScreen() {
  const params = useLocalSearchParams<{ q?: string | string[]; category?: string | string[]; title?: string | string[] }>();
  const q = first(params.q);
  const category = first(params.category);
  const title = first(params.title) ?? en.products.title;

  const [sort, setSort] = useState<Sort>('relevance');

  const query = useMemo(
    () => ({ q: q || undefined, category: category || undefined, sort, per_page: 20 }),
    [q, category, sort],
  );
  const products = useProductsInfinite(query);
  const items = products.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title, headerBackTitle: en.common.back }} />
      <View style={styles.sortRow}>
        {SORTS.map((option) => {
          const active = option.value === sort;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSort(option.value)}
              style={[styles.sortChip, active && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, active && styles.sortTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {products.isError ? <ErrorText error={products.error} /> : null}
      {products.isPending ? <Loading /> : null}

      <FlatList
        data={items}
        keyExtractor={(product) => product.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={products.isPending ? undefined : <Text style={styles.empty}>{en.products.empty}</Text>}
        ListFooterComponent={
          products.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              disabled={products.isFetchingNextPage}
              onPress={() => void products.fetchNextPage()}
              style={styles.loadMore}
            >
              <Text style={styles.loadMoreText}>
                {products.isFetchingNextPage ? en.common.loading : en.products.loadMore}
              </Text>
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, padding: space.lg, paddingBottom: space.sm },
  sortChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  sortText: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  sortTextActive: { color: colors.white, fontFamily: fontFamily.medium },
  list: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  column: { gap: space.md },
  empty: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body, textAlign: 'center', marginTop: space.xl },
  loadMore: {
    alignSelf: 'center',
    marginTop: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  loadMoreText: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
});
