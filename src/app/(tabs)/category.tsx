import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCategories } from '@/api/queries';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ErrorText, Loading } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

export default function CategoryScreen() {
  const categories = useCategories();

  return (
    <Screen title={en.category.title}>
      {categories.isPending ? <Loading /> : null}
      {categories.isError ? <ErrorText error={categories.error} /> : null}
      {categories.data && categories.data.length === 0 ? (
        <EmptyState title={en.category.emptyTitle} body={en.category.emptyBody} />
      ) : null}
      <FlatList
        data={categories.data ?? []}
        keyExtractor={(category) => category.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={item.name}
            onPress={() => router.push({ pathname: '/products', params: { category: item.slug, title: item.name } })}
            style={styles.tile}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={[styles.image, styles.placeholder]} />
            )}
            <Text numberOfLines={2} style={styles.name}>
              {item.name}
            </Text>
            <Text style={styles.count}>
              {item.product_count} {en.category.products}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md, paddingBottom: space.xxl },
  column: { gap: space.md },
  tile: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.sm, gap: space.xs },
  image: { width: '100%', aspectRatio: 1.4, borderRadius: radius.md },
  placeholder: { backgroundColor: colors.peach },
  name: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  count: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
