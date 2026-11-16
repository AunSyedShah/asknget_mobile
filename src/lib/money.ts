/**
 * Money is always integer minor units (cents) from the API. Format it here,
 * never with floats in the screens. South African style: "R 1 250.00".
 */
const SYMBOLS: Record<string, string> = { ZAR: 'R' };

export function formatMoney(cents: number, currency = 'ZAR'): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${sign}${symbol}${grouped}.${fraction}`;
}

/** Percentage discount shown next to a price (e.g. 20 for "-20%"). */
export function discountLabel(percent: number | null | undefined): string | null {
  if (!percent || percent <= 0) return null;
  return `-${percent}%`;
}
