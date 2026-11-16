export const DEFAULT_API_ORIGIN = 'https://asknget.co.za';

/** The only market the app serves for now. Never hard-code it elsewhere; read it from here. */
export const SUPPORTED_MARKET = 'ZA' as const;

const SCHEME = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i;
const ORIGIN_ONLY = /^[a-z][a-z0-9+.-]*:\/\/[^/?#\s@]+\/?$/i;

/**
 * Validates the API origin. The API paths already start with /api/v1, so the
 * origin is scheme + host + port only. Throws on a bad value so a broken build
 * fails loudly at start-up instead of sending requests to the wrong server.
 *
 * Written with plain string checks on purpose: React Native's URL class does
 * not implement pathname, hostname or origin.
 */
export function normaliseApiOrigin(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (value === '') return DEFAULT_API_ORIGIN;

  const match = SCHEME.exec(value);
  if (!match) throw new Error(`EXPO_PUBLIC_API_ORIGIN is not a valid URL: ${value}`);

  const scheme = match[1].toLowerCase();
  const host = match[2];
  const hostname = host.replace(/:\d+$/, '').toLowerCase();
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (scheme !== 'https' && !(scheme === 'http' && isLocal)) {
    throw new Error('EXPO_PUBLIC_API_ORIGIN must use https (http is allowed only for localhost).');
  }
  if (!ORIGIN_ONLY.test(value)) {
    throw new Error('EXPO_PUBLIC_API_ORIGIN must be an origin only, with no path, query or hash.');
  }
  return `${scheme}://${host.toLowerCase()}`;
}

export const API_ORIGIN = normaliseApiOrigin(process.env.EXPO_PUBLIC_API_ORIGIN);
