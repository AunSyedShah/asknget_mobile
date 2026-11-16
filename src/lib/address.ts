import type { components } from '@/api/schema';
import { SUPPORTED_MARKET } from '@/config/env';

type AddressIn = components['schemas']['AddressIn'];

export type AddressForm = {
  label: string;
  full_name: string;
  phone: string;
  street_address: string;
  unit_floor: string;
  city: string;
  province: string;
  postal_code: string;
  delivery_instructions: string;
};

export const EMPTY_ADDRESS: AddressForm = {
  label: '',
  full_name: '',
  phone: '',
  street_address: '',
  unit_floor: '',
  city: '',
  province: '',
  postal_code: '',
  delivery_instructions: '',
};

/**
 * The server only checks the postal code length (2 to 20), so the app checks it
 * against the market's regex from GET /regions/current. An empty or unusable
 * pattern means "accept", so a bad pattern never blocks a shopper.
 */
export function isValidPostalCode(value: string, pattern: string | null | undefined): boolean {
  const code = value.trim();
  if (code.length < 2 || code.length > 20) return false;
  if (!pattern) return true;
  try {
    return new RegExp(pattern).test(code);
  } catch {
    return true;
  }
}

/** Returns one message per invalid field. `postalPattern` comes from the market. */
export function validateAddress(form: AddressForm, postalPattern: string | null | undefined): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.full_name.trim() === '') errors.full_name = 'Enter the recipient name.';
  if (form.phone.trim().length < 5) errors.phone = 'Enter a mobile number.';
  if (form.street_address.trim() === '') errors.street_address = 'Enter the street address.';
  if (form.city.trim() === '') errors.city = 'Enter the city.';
  if (!isValidPostalCode(form.postal_code, postalPattern)) errors.postal_code = 'Enter a valid postal code.';
  if (form.province.length > 100) errors.province = 'Use at most 100 characters.';
  return errors;
}

type AddressPatchIn = components['schemas']['AddressPatchIn'];

/** The fields shared by create and edit. `country` is always sent: the server's schema defaults it to PK. */
function commonFields(form: AddressForm) {
  return {
    label: form.label.trim() || null,
    full_name: form.full_name.trim(),
    phone: form.phone.trim(),
    street_address: form.street_address.trim(),
    unit_floor: form.unit_floor.trim() || null,
    city: form.city.trim(),
    province: form.province.trim() || null,
    postal_code: form.postal_code.trim(),
    country: SUPPORTED_MARKET,
    delivery_instructions: form.delivery_instructions.trim() || null,
  };
}

/** Body for creating an address (POST /me/addresses). */
export function toAddressInput(form: AddressForm): AddressIn {
  return { ...commonFields(form), type: 'home', is_default: false };
}

/**
 * Body for editing an address (PATCH). It leaves `is_default` and `type` out on
 * purpose, so editing a default address never un-defaults it.
 */
export function toAddressPatch(form: AddressForm): AddressPatchIn {
  return commonFields(form);
}
