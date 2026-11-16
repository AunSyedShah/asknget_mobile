import { useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { createAddress, updateAddress } from '@/api/endpoints';
import { keys, useAddresses, useRegion } from '@/api/queries';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button, ErrorText, TextField } from '@/components/ui';
import { en } from '@/i18n/en';
import { EMPTY_ADDRESS, type AddressForm, toAddressInput, toAddressPatch, validateAddress } from '@/lib/address';
import { colors, space } from '@/theme/tokens';

/** New or edited address. The province is optional free text, labelled from the market. */
export default function AddressScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const region = useRegion();
  const addresses = useAddresses();

  // The form shows what the shopper typed, or the saved address until they type.
  const [draft, setDraft] = useState<AddressForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const editing = Boolean(id);
  const prefix = region.data?.country.phone_prefix ?? '';
  const provinceLabel = region.data?.country.region_label || en.addresses.province;

  const existing = id ? addresses.data?.find((address) => address.id === id) : undefined;
  const form: AddressForm =
    draft ??
    (existing
      ? {
          label: existing.label ?? '',
          full_name: existing.full_name,
          phone: existing.phone,
          street_address: existing.street_address,
          unit_floor: existing.unit_floor ?? '',
          city: existing.city,
          province: existing.province ?? '',
          postal_code: existing.postal_code,
          delivery_instructions: existing.delivery_instructions ?? '',
        }
      : EMPTY_ADDRESS);

  const set = (key: keyof AddressForm) => (value: string) => setDraft({ ...form, [key]: value });

  async function save() {
    const found = validateAddress(form, region.data?.postal_code_regex);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setFailure(null);
    setLoading(true);
    try {
      if (id) await updateAddress(id, toAddressPatch(form));
      else await createAddress(toAddressInput(form));
      await queryClient.invalidateQueries({ queryKey: keys.addresses });
      router.back();
    } catch (error) {
      setFailure(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: editing ? en.addresses.edit : en.addresses.add,
          headerBackTitle: en.common.back,
        }}
      />
      <RequireSignIn>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField label={en.addresses.label} value={form.label} onChangeText={set('label')} />
          <TextField label={en.addresses.fullName} value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} autoComplete="name" />
          <TextField
            label={en.addresses.phone}
            value={form.phone}
            onChangeText={set('phone')}
            error={errors.phone}
            hint={prefix ? en.addresses.phoneHint.replaceAll('{prefix}', prefix) : null}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <TextField label={en.addresses.street} value={form.street_address} onChangeText={set('street_address')} error={errors.street_address} />
          <TextField label={en.addresses.unit} value={form.unit_floor} onChangeText={set('unit_floor')} />
          <TextField label={en.addresses.city} value={form.city} onChangeText={set('city')} error={errors.city} />
          <TextField
            label={provinceLabel}
            value={form.province}
            onChangeText={set('province')}
            error={errors.province}
            hint={en.addresses.provinceHint}
            maxLength={100}
          />
          <TextField
            label={en.addresses.postal}
            value={form.postal_code}
            onChangeText={set('postal_code')}
            error={errors.postal_code ? en.addresses.postalInvalid : null}
            keyboardType="number-pad"
            autoComplete="postal-code"
          />
          <TextField label={en.addresses.instructions} value={form.delivery_instructions} onChangeText={set('delivery_instructions')} multiline />
          <ErrorText error={failure} />
          <Button label={en.common.save} onPress={() => void save()} loading={loading} />
        </ScrollView>
      </RequireSignIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.xl, gap: space.md, paddingBottom: space.xxl },
});
