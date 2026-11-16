import createClient, { type Middleware } from 'openapi-fetch';

import { API_ORIGIN, SUPPORTED_MARKET } from '@/config/env';
import { useCartToken } from '@/state/cart-token';
import { useSession } from '@/state/session';

import type { paths } from './schema';

export const LANGUAGE = 'en';
const FALLBACK_TIMEZONE = 'Africa/Johannesburg';
const REFRESH_PATH = '/api/v1/auth/refresh';

export function requestTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** One refresh at a time; concurrent 401s share the same request. */
let inFlightRefresh: Promise<boolean> | null = null;

/**
 * Exchanges the refresh token for a new pair. Returns false when there is no
 * refresh token or the server refuses it, and then signs the user out.
 */
export function refreshSession(): Promise<boolean> {
  if (inFlightRefresh) return inFlightRefresh;

  const { refreshToken } = useSession.getState();
  if (!refreshToken) return Promise.resolve(false);

  inFlightRefresh = (async () => {
    try {
      const response = await fetch(`${API_ORIGIN}${REFRESH_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Region': SUPPORTED_MARKET,
          'X-Language': LANGUAGE,
          'X-Timezone': requestTimezone(),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        useSession.getState().clear();
        return false;
      }
      const body = (await response.json()) as { access_token: string; refresh_token?: string };
      useSession.getState().setTokens({
        accessToken: body.access_token,
        refreshToken: body.refresh_token ?? refreshToken,
      });
      return true;
    } catch {
      // Network failure: keep the session, the caller shows its own error.
      return false;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

/**
 * Sets the shared headers once, for every call: market, language, timezone,
 * guest cart token and the bearer token. On a 401 it refreshes the session and
 * retries a GET once.
 */
const sharedHeaders: Middleware = {
  async onRequest({ request }) {
    request.headers.set('X-Region', SUPPORTED_MARKET);
    request.headers.set('X-Language', LANGUAGE);
    request.headers.set('X-Timezone', requestTimezone());

    const cartToken = useCartToken.getState().token;
    if (cartToken) request.headers.set('X-Cart-Token', cartToken);

    const accessToken = useSession.getState().accessToken;
    if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  },

  async onResponse({ request, response }) {
    const isRefresh = new URL(request.url).pathname === REFRESH_PATH;
    if (response.status !== 401 || isRefresh) return response;

    const refreshed = await refreshSession();
    if (refreshed && request.method === 'GET') {
      const retry = new Request(request);
      retry.headers.set('Authorization', `Bearer ${useSession.getState().accessToken ?? ''}`);
      return fetch(retry);
    }
    return response;
  },
};

/** A typed client with the shared headers. Tests pass their own `fetch`. */
export function createApiClient(fetchImpl?: typeof fetch) {
  const client = createClient<paths>({ baseUrl: API_ORIGIN, ...(fetchImpl ? { fetch: fetchImpl } : {}) });
  client.use(sharedHeaders);
  return client;
}

export const api = createApiClient();
