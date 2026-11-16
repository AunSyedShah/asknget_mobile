import { ApiError, isNetworkError, toApiError, unwrap } from './errors';

const response = (status: number) => ({ ok: status >= 200 && status < 300, status }) as Response;

describe('toApiError', () => {
  it('reads the server detail and field errors', () => {
    const error = toApiError(422, { detail: 'Invalid', errors: [{ field: 'email' }] });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe('Invalid');
    expect(error.errors).toEqual([{ field: 'email' }]);
  });

  it('falls back to a plain message for an unknown body', () => {
    expect(toApiError(500, undefined).message).toBe('Something went wrong. Please try again.');
    expect(toApiError(502, '<html>').message).toBe('Something went wrong. Please try again.');
  });
});

describe('unwrap', () => {
  it('returns the data of a successful call', () => {
    expect(unwrap({ data: { ok: true }, response: response(200) })).toEqual({ ok: true });
  });

  it('throws an ApiError for a failed call', () => {
    expect(() => unwrap({ error: { detail: 'Not found' }, response: response(404) })).toThrow('Not found');
    try {
      unwrap({ error: { detail: 'Not found' }, response: response(404) });
    } catch (error) {
      expect((error as ApiError).status).toBe(404);
    }
  });

  it('accepts an empty 204 body', () => {
    expect(unwrap({ response: response(204) })).toBeUndefined();
  });
});

describe('isNetworkError', () => {
  it('is true for anything that is not an ApiError', () => {
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    expect(isNetworkError(new ApiError(500, 'x'))).toBe(false);
  });
});
