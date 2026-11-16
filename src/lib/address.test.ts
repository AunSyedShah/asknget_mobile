import { EMPTY_ADDRESS, isValidPostalCode, toAddressInput, toAddressPatch, validateAddress } from './address';

const ZA_POSTAL = '^\\d{4}$';

const valid = {
  ...EMPTY_ADDRESS,
  full_name: 'Thandi Nkosi',
  phone: '+27821234567',
  street_address: '12 Main Road',
  city: 'Johannesburg',
  postal_code: '2000',
};

describe('isValidPostalCode', () => {
  it('uses the market regex', () => {
    expect(isValidPostalCode('2000', ZA_POSTAL)).toBe(true);
    expect(isValidPostalCode('20000', ZA_POSTAL)).toBe(false);
    expect(isValidPostalCode('ABCD', ZA_POSTAL)).toBe(false);
  });

  it('still enforces the server length rule (2 to 20)', () => {
    expect(isValidPostalCode('1', null)).toBe(false);
    expect(isValidPostalCode('x'.repeat(21), null)).toBe(false);
    expect(isValidPostalCode('12', null)).toBe(true);
  });

  it('accepts when the market gives no pattern or a broken one', () => {
    expect(isValidPostalCode('AB12', undefined)).toBe(true);
    expect(isValidPostalCode('AB12', '(')).toBe(true);
  });
});

describe('validateAddress', () => {
  it('passes a complete address without a province', () => {
    expect(validateAddress(valid, ZA_POSTAL)).toEqual({});
  });

  it('reports each missing field', () => {
    const errors = validateAddress({ ...EMPTY_ADDRESS, postal_code: '12' }, ZA_POSTAL);
    expect(Object.keys(errors).sort()).toEqual(['city', 'full_name', 'phone', 'postal_code', 'street_address']);
  });
});

describe('toAddressInput', () => {
  it('always sends the market country, because the server default is PK', () => {
    expect(toAddressInput(valid).country).toBe('ZA');
    expect(toAddressPatch(valid).country).toBe('ZA');
  });

  it('turns blank optional fields into null and trims the rest', () => {
    const body = toAddressInput({ ...valid, full_name: '  Thandi  ', province: '  ', unit_floor: '' });
    expect(body.full_name).toBe('Thandi');
    expect(body.province).toBeNull();
    expect(body.unit_floor).toBeNull();
  });

  it('creates a non-default home address', () => {
    expect(toAddressInput(valid)).toMatchObject({ type: 'home', is_default: false });
  });
});

describe('toAddressPatch', () => {
  it('never sends is_default or type, so editing keeps the default flag', () => {
    const patch = toAddressPatch(valid);
    expect('is_default' in patch).toBe(false);
    expect('type' in patch).toBe(false);
  });
});
