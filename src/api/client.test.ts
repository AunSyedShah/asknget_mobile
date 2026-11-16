import { useCartToken } from '@/state/cart-token';
import { useSession } from '@/state/session';

import { createApiClient } from './client';

// jest hoists this above the imports, so the stores never touch the native keystore.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = jest.fn<Promise<Response>, [Request | string, RequestInit?]>();
const originalFetch = globalThis.fetch;

function headersOf(call: number): Headers {
  const request = fetchMock.mock.calls[call][0];
  return (request as Request).headers;
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  useCartToken.setState({ token: null });
  useSession.getState().clear();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('shared headers', () => {
  it('sends market, language and timezone on every call', async () => {
    fetchMock.mockImplementation(async () => json([]));
    const api = createApiClient(fetchMock as unknown as typeof fetch);
    await api.GET('/api/v1/categories');

    const headers = headersOf(0);
    expect(headers.get('X-Region')).toBe('ZA');
    expect(headers.get('X-Language')).toBe('en');
    expect(headers.get('X-Timezone')).toBeTruthy();
  });

  it('sends the guest cart token only when one is stored', async () => {
    fetchMock.mockImplementation(async () => json([]));
    const api = createApiClient(fetchMock as unknown as typeof fetch);

    await api.GET('/api/v1/categories');
    expect(headersOf(0).has('X-Cart-Token')).toBe(false);

    useCartToken.setState({ token: 'cart-abc' });
    await api.GET('/api/v1/categories');
    expect(headersOf(1).get('X-Cart-Token')).toBe('cart-abc');
  });

  it('sends the bearer token only when signed in', async () => {
    fetchMock.mockImplementation(async () => json([]));
    const api = createApiClient(fetchMock as unknown as typeof fetch);

    await api.GET('/api/v1/categories');
    expect(headersOf(0).has('Authorization')).toBe(false);

    useSession.getState().setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    await api.GET('/api/v1/categories');
    expect(headersOf(1).get('Authorization')).toBe('Bearer access-1');
  });
});

describe('session refresh on 401', () => {
  it('refreshes once and retries a GET with the new token', async () => {
    useSession.getState().setTokens({ accessToken: 'old', refreshToken: 'refresh-1' });
    fetchMock
      .mockResolvedValueOnce(json({ detail: 'Unauthorized' }, 401)) // the call
      .mockResolvedValueOnce(json({ access_token: 'new', refresh_token: 'refresh-2' })) // the refresh
      .mockResolvedValueOnce(json({ ok: true })); // the retry

    const api = createApiClient(fetchMock as unknown as typeof fetch);
    const result = await api.GET('/api/v1/me');

    expect(result.response.status).toBe(200);
    expect(useSession.getState().accessToken).toBe('new');
    expect(useSession.getState().refreshToken).toBe('refresh-2');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[2][0] as Request).headers.get('Authorization')).toBe('Bearer new');
  });

  it('signs the user out when the refresh token is refused', async () => {
    useSession.getState().setTokens({ accessToken: 'old', refreshToken: 'bad' });
    fetchMock
      .mockResolvedValueOnce(json({ detail: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(json({ detail: 'Invalid refresh token' }, 401));

    const api = createApiClient(fetchMock as unknown as typeof fetch);
    const result = await api.GET('/api/v1/me');

    expect(result.response.status).toBe(401);
    expect(useSession.getState().accessToken).toBeNull();
    expect(useSession.getState().refreshToken).toBeNull();
  });

  it('does not try to refresh without a refresh token', async () => {
    fetchMock.mockResolvedValueOnce(json({ detail: 'Unauthorized' }, 401));
    const api = createApiClient(fetchMock as unknown as typeof fetch);
    const result = await api.GET('/api/v1/me');

    expect(result.response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
