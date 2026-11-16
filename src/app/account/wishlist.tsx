import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { removeFromWishlist } from '@/api/endpoints';
import { keys, useWishlist } from '@/api/queries';
import { ProductCard } from '@/components/product-card';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button, ErrorText, Loading } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function WishlistScreen() {
  const queryClient = useQueryClient();
  const wishlist = useWishlist();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.wishlist.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <ScrollView contentContainerStyle={styles.content}>
          {wishlist.isPending ? <Loading /> : null}
          {wishlist.isError ? <ErrorText error={wishlist.error} /> : null}
          {wishlist.data && wishlist.data.length === 0 ? <Text style={styles.muted}>{en.wishlist.empty}</Text> : null}
          <View style={styles.grid}>
            {wishlist.data?.map(({ product }) => (
              <View key={product.id} style={styles.cell}>
                <ProductCard product={product} />
                <Button
                  label={en.common.remove}
                  variant="ghost"
                  onPress={async () => {
                    await removeFromWishlist(product.id);
                    await queryClient.invalidateQueries({ queryKey: keys.wishlist });
                  }}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </RequireSignIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47%' },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
