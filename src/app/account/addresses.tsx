import { useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { deleteAddress, setDefaultAddress } from '@/api/endpoints';
import { keys, useAddresses } from '@/api/queries';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button, Card, ErrorText, Loading } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

export default function AddressesScreen() {
  const queryClient = useQueryClient();
  const addresses = useAddresses();
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.addresses });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.addresses.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <ScrollView contentContainerStyle={styles.content}>
          {addresses.isPending ? <Loading /> : null}
          {addresses.isError ? <ErrorText error={addresses.error} /> : null}
          {addresses.data && addresses.data.length === 0 ? <Text style={styles.muted}>{en.addresses.empty}</Text> : null}
          {addresses.data?.map((address) => (
            <Card key={address.id ?? address.street_address}>
              <Text style={styles.strong}>
                {address.label ? `${address.label} · ` : ''}
                {address.full_name}
                {address.is_default ? ` (${en.addresses.default})` : ''}
              </Text>
              <Text style={styles.body}>{address.street_address}</Text>
              <Text style={styles.body}>
                {[address.city, address.province, address.postal_code].filter(Boolean).join(', ')}
              </Text>
              <Text style={styles.muted}>{address.phone}</Text>
              <View style={styles.actions}>
                <Button
                  label={en.addresses.edit}
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/account/address', params: { id: address.id ?? '' } })}
                />
                {!address.is_default && address.id ? (
                  <Button
                    label={en.addresses.setDefault}
                    variant="ghost"
                    onPress={async () => {
                      await setDefaultAddress(address.id as string);
                      await refresh();
                    }}
                  />
                ) : null}
                {address.id ? (
                  <Button
                    label={en.addresses.delete}
                    variant="ghost"
                    onPress={async () => {
                      await deleteAddress(address.id as string);
                      await refresh();
                    }}
                  />
                ) : null}
              </View>
            </Card>
          ))}
          <Button label={en.addresses.add} onPress={() => router.push('/account/address')} />
        </ScrollView>
      </RequireSignIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  strong: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
