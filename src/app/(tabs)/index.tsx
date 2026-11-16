import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useBanners, useCategories, useProductRail } from '@/api/queries';
import { ErrorText, Loading, SectionHeader } from '@/components/ui';
import { ProductCard } from '@/components/product-card';
import { Screen } from '@/components/screen';
import { ComingSoonIconBadge } from '@/components/coming-soon';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

const RAIL_WIDTH = 160;

function openSearch(q: string) {
  const term = q.trim();
  if (term === '') return;
  router.push({ pathname: '/products', params: { q: term } });
}

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const banners = useBanners('hero');
  const categories = useCategories();
  const featured = useProductRail('featured');
  const bestSellers = useProductRail('best-sellers');
  const newArrivals = useProductRail('new-arrivals');
  const topDiscounted = useProductRail('top-discounted');

  const hero = banners.data?.[0];

  return (
    <Screen title={en.home.title}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              accessibilityLabel={en.home.searchLabel}
              placeholder={en.home.searchPlaceholder}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => openSearch(query)}
              returnKeyType="search"
              style={styles.searchInput}
            />
            <FeatureGate feature="imageSearch" comingSoon={<ComingSoonIconBadge label={en.home.cameraSearch} />}>
              <View />
            </FeatureGate>
            <FeatureGate feature="voiceSearch" comingSoon={<ComingSoonIconBadge label={en.home.voiceSearch} />}>
              <View />
            </FeatureGate>
          </View>
        </View>

        {hero ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={hero.title}
            onPress={() => {
              if (/^https?:\/\//.test(hero.cta_url)) void Linking.openURL(hero.cta_url);
            }}
            style={styles.hero}
          >
            {hero.image_url ? <Image source={{ uri: hero.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            <View style={styles.heroShade} />
            <Text style={styles.heroEyebrow}>{hero.eyebrow}</Text>
            <Text style={styles.heroTitle}>{hero.title}</Text>
            {hero.subtitle ? <Text style={styles.heroSubtitle}>{hero.subtitle}</Text> : null}
            {hero.cta_label ? <Text style={styles.heroCta}>{hero.cta_label}</Text> : null}
          </Pressable>
        ) : null}

        <SectionHeader title={en.home.categories} actionLabel={en.home.viewAll} onAction={() => router.push('/products')} />
        {categories.isError ? <ErrorText error={categories.error} /> : null}
        {categories.isPending ? (
          <Loading />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {(categories.data ?? []).slice(0, 12).map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="link"
                accessibilityLabel={category.name}
                onPress={() => router.push({ pathname: '/products', params: { category: category.slug, title: category.name } })}
                style={styles.categoryChip}
              >
                {category.image_url ? (
                  <Image source={{ uri: category.image_url }} style={styles.categoryImage} contentFit="cover" />
                ) : (
                  <View style={[styles.categoryImage, styles.placeholder]} />
                )}
                <Text numberOfLines={1} style={styles.categoryName}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Rail title={en.home.featured} query={featured} />
        <Rail title={en.home.bestSellers} query={bestSellers} />
        <Rail title={en.home.newArrivals} query={newArrivals} />
        <Rail title={en.home.topDiscounted} query={topDiscounted} />
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </Screen>
  );
}

type RailQuery = ReturnType<typeof useProductRail>;

function Rail({ title, query }: { title: string; query: RailQuery }) {
  return (
    <View>
      <SectionHeader title={title} actionLabel={en.home.viewAll} onAction={() => router.push('/products')} />
      {query.isError ? <ErrorText error={query.error} /> : null}
      {query.isPending ? (
        <Loading />
      ) : query.data && query.data.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {query.data.map((product) => (
            <ProductCard key={product.id} product={product} width={RAIL_WIDTH} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>{en.home.railEmpty}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xl, gap: space.md },
  searchRow: { flexDirection: 'row' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.ink,
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodyLg,
  },
  hero: {
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: space.lg,
    justifyContent: 'flex-end',
    backgroundColor: colors.brand,
  },
  heroShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(48,48,48,0.35)' },
  heroEyebrow: { color: colors.peach, fontFamily: fontFamily.medium, fontSize: fontSize.caption },
  heroTitle: { color: colors.white, fontFamily: fontFamily.semibold, fontSize: fontSize.title },
  heroSubtitle: { color: colors.white, fontFamily: fontFamily.body, fontSize: fontSize.body },
  heroCta: { color: colors.white, fontFamily: fontFamily.medium, fontSize: fontSize.body, marginTop: space.xs },
  chips: { gap: space.md, paddingVertical: space.xs },
  categoryChip: { width: 76, alignItems: 'center', gap: space.xs },
  categoryImage: { width: 64, height: 64, borderRadius: 32 },
  placeholder: { backgroundColor: colors.peach },
  categoryName: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.caption, textAlign: 'center' },
  rail: { gap: space.md, paddingVertical: space.xs },
  empty: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
