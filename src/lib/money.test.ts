import { discountLabel, formatMoney } from './money';

describe('formatMoney', () => {
  it('formats integer cents as rand with two decimals', () => {
    expect(formatMoney(18500)).toBe('R185.00');
    expect(formatMoney(9)).toBe('R0.09');
    expect(formatMoney(0)).toBe('R0.00');
  });

  it('groups thousands with a space, the South African way', () => {
    expect(formatMoney(125000)).toBe('R1 250.00');
    expect(formatMoney(123456789)).toBe('R1 234 567.89');
  });

  it('keeps the sign in front of the symbol', () => {
    expect(formatMoney(-2000)).toBe('-R20.00');
  });

  it('never uses floats: sub-cent input is rounded to whole cents', () => {
    expect(formatMoney(1999.6)).toBe('R20.00');
  });

  it('falls back to the currency code for other currencies', () => {
    expect(formatMoney(500, 'USD')).toBe('USD 5.00');
  });
});

describe('discountLabel', () => {
  it('shows a minus percentage only for a real discount', () => {
    expect(discountLabel(20)).toBe('-20%');
    expect(discountLabel(0)).toBeNull();
    expect(discountLabel(null)).toBeNull();
    expect(discountLabel(undefined)).toBeNull();
  });
});
