export const DEFAULT_API_ORIGIN = 'https://asknget.co.za';

/** The only market the app serves for now. Never hard-code it elsewhere; read it from here. */
export const SUPPORTED_MARKET = 'ZA' as const;

/**
 * Validates the API origin. The API paths already start with /api/v1, so the
 * origin is scheme + host + port only. Throws on a bad value so a broken build
 * fails loudly at start-up instead of sending requests to the wrong server.
 */
export function normaliseApiOrigin(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (value === '') return DEFAULT_API_ORIGIN;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_ORIGIN is not a valid URL: ${value}`);
  }

  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    throw new Error('EXPO_PUBLIC_API_ORIGIN must use https (http is allowed only for localhost).');
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error('EXPO_PUBLIC_API_ORIGIN must be an origin only, with no path, query or hash.');
  }
  return url.origin;
}

export const API_ORIGIN = normaliseApiOrigin(process.env.EXPO_PUBLIC_API_ORIGIN);
