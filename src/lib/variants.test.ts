import type { components } from '@/api/schema';

import { findVariant } from './variants';

type Variant = components['schemas']['VariantOut'];
type OptionType = components['schemas']['OptionTypeOut'];

const variant = (id: string, optionValueIds: string[], stock = 5): Variant => ({
  id,
  sku: id,
  option_value_ids: optionValueIds,
  price_cents: 1000,
  stock_qty: stock,
  in_stock: stock > 0,
});

const size: OptionType = {
  id: 'size',
  name: 'Size',
  values: [
    { id: 's', value: '15ml', swatch_hex: '' },
    { id: 'm', value: '30ml', swatch_hex: '' },
  ],
};
const colour: OptionType = {
  id: 'colour',
  name: 'Colour',
  values: [
    { id: 'red', value: 'Red', swatch_hex: '' },
    { id: 'blue', value: 'Blue', swatch_hex: '' },
  ],
};

describe('findVariant', () => {
  it('returns the only variant when the product has no options', () => {
    const only = variant('v1', []);
    expect(findVariant([only], {}, [])).toBe(only);
  });

  it('waits until every option has a value', () => {
    const variants = [variant('v1', ['s', 'red'])];
    expect(findVariant(variants, { size: 's' }, [size, colour])).toBeNull();
  });

  it('finds the variant that matches every chosen option', () => {
    const a = variant('a', ['s', 'red']);
    const b = variant('b', ['m', 'red']);
    const c = variant('c', ['m', 'blue']);
    expect(findVariant([a, b, c], { size: 'm', colour: 'blue' }, [size, colour])).toBe(c);
  });

  it('returns null for a combination that does not exist', () => {
    const a = variant('a', ['s', 'red']);
    expect(findVariant([a], { size: 'm', colour: 'blue' }, [size, colour])).toBeNull();
  });
});
